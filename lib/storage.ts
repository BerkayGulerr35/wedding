// Server-only storage layer.
//
// Every upload is written to TWO places:
//   1. The local disk of the server this app runs on   (REQUIRED)
//   2. A Cloudflare R2 bucket                            (best-effort)
//
// An upload counts as successful as long as the disk write succeeds.
// R2 is attempted too; if it fails the file still lives on disk and the
// metadata records `r2: false` so it can be re-synced later.
//
// There is NO database. Metadata lives next to each media file as a small
// `<storedName>.json` sidecar (and is mirrored to R2 as well).

import 'server-only';

import { createWriteStream, createReadStream } from 'node:fs';
import { mkdir, writeFile, readdir, stat, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';

import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import type { UploadMeta, AdminItem } from './types';

// ─── Config ───────────────────────────────────────────────
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim()
    ? process.env.UPLOAD_DIR.trim()
    : join(process.cwd(), 'uploads');

// Incoming uploads are staged here first so we can try R2 and still fall back
// to permanent local storage if R2 fails. Same filesystem as UPLOAD_DIR, so
// promoting a staged file to permanent is an atomic rename.
const TMP_DIR = join(UPLOAD_DIR, '.tmp');

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'gizobekoevlendi';

const R2_BUCKET = process.env.R2_BUCKET ?? '';
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? '';
const R2_ENDPOINT =
  process.env.R2_ENDPOINT ??
  (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '');

export const r2Configured = Boolean(
  R2_BUCKET && R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY,
);

let _r2: S3Client | null = null;
function r2Client(): S3Client {
  if (!_r2) {
    _r2 = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _r2;
}

// ─── Filename helpers ─────────────────────────────────────

const TR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
  ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
};

/** Make a string safe + readable to embed in a filename (ASCII, lowercase). */
function slug(input: string, max = 40): string {
  const cleaned = input
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => TR_MAP[c] ?? c) // Turkish → ASCII
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // anything else → dash
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, max);
  return cleaned || 'anonim';
}

function timestampSlug(d = new Date()): string {
  // 2026-06-08T14-30-05
  return d.toISOString().replace(/\..+$/, '').replace(/:/g, '-');
}

function extOf(filename: string): string {
  const m = /\.([A-Za-z0-9]{1,8})$/.exec(filename);
  return m ? `.${m[1].toLowerCase()}` : '';
}

/**
 * Build the on-disk / R2 filename. The guest name and a timestamp are baked
 * into the name so the file is self-describing even without the sidecar.
 *   2026-06-08T14-30-05__gizem__IMG_1234__a1b2c3.jpg
 */
function buildStoredName(originalName: string, name: string | null): {
  id: string;
  storedName: string;
} {
  const id = randomBytes(5).toString('hex'); // 10 hex chars
  const ext = extOf(originalName);
  const baseOriginal = slug(originalName.replace(/\.[^.]*$/, ''), 30);
  const namePart = slug(name ?? 'anonim', 24);
  const storedName = `${timestampSlug()}__${namePart}__${baseOriginal}__${id}${ext}`;
  return { id, storedName };
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'avif', 'bmp', 'tiff'];

export function isImageName(storedName: string): boolean {
  const ext = storedName.split('.').pop()?.toLowerCase() ?? '';
  return IMAGE_EXTS.includes(ext);
}

// ─── Write path ───────────────────────────────────────────

export interface SaveInput {
  body: ReadableStream<Uint8Array> | null;
  originalName: string;
  mime: string;
  name: string | null;
  note: string | null;
}

export interface SaveResult {
  meta: UploadMeta;
  /** Where the media ended up. */
  storedIn: 'r2' | 'disk';
  r2Ok: boolean;
  r2Error?: string;
}

async function ensureDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Save an upload, R2 first, local disk as fallback.
 *
 *   1. Stage the request body to a temp file (so the stream can be replayed).
 *   2. Try Cloudflare R2. On success the media lives ONLY in R2 and the temp
 *      file is discarded.
 *   3. If R2 fails (or isn't configured), promote the temp file to permanent
 *      local storage instead.
 *   4. Always write the metadata sidecar to local disk so the admin gallery
 *      can list every upload regardless of where the media lives.
 *
 * Throws only if BOTH R2 and the local fallback fail.
 */
export async function saveUpload(input: SaveInput): Promise<SaveResult> {
  if (!input.body) throw new Error('empty-body');
  await ensureDir();
  await mkdir(TMP_DIR, { recursive: true });

  const { id, storedName } = buildStoredName(input.originalName, input.name);
  const tmpPath = join(TMP_DIR, storedName);
  const finalPath = join(UPLOAD_DIR, storedName);

  // 1. Stage to temp (no full-file buffering in memory).
  const nodeStream = Readable.fromWeb(input.body as any);
  await pipeline(nodeStream, createWriteStream(tmpPath));

  const { size } = await stat(tmpPath);

  const meta: UploadMeta = {
    id,
    storedName,
    originalName: input.originalName,
    name: input.name?.trim() || null,
    note: input.note?.trim() || null,
    mime: input.mime || 'application/octet-stream',
    size,
    createdAt: new Date().toISOString(),
    r2: false,
  };

  // 2. Try R2 first.
  let r2Ok = false;
  let r2Error: string | undefined;
  if (r2Configured) {
    try {
      await uploadToR2(tmpPath, storedName, meta.mime);
      r2Ok = true;
      meta.r2 = true;
    } catch (err) {
      r2Error = err instanceof Error ? err.message : String(err);
    }
  } else {
    r2Error = 'r2-not-configured';
  }

  const sidecar = JSON.stringify(meta, null, 2);
  const localSidecar = join(UPLOAD_DIR, `${storedName}.json`);

  // 3. Persist media + its .json sidecar. The sidecar always lives NEXT TO the
  //    media: in R2 on success (nothing left on local disk), on local disk on
  //    failure.
  if (r2Ok) {
    // Put the sidecar in R2 too so "who uploaded" travels with the file.
    let sidecarInR2 = false;
    try {
      await putR2Object(`${storedName}.json`, sidecar, 'application/json');
      sidecarInR2 = true;
    } catch {
      /* fall back to a local sidecar below so metadata isn't lost */
    }
    await unlink(tmpPath).catch(() => {});
    // Safety net: if even the tiny sidecar couldn't reach R2, keep it locally.
    if (!sidecarInR2) await writeFile(localSidecar, sidecar, 'utf8');
  } else {
    // R2 failed → keep BOTH media and sidecar on local disk.
    try {
      await rename(tmpPath, finalPath);
    } catch (err) {
      await unlink(tmpPath).catch(() => {});
      throw new Error(
        `persist-failed (r2: ${r2Error ?? 'n/a'}) (disk: ${err instanceof Error ? err.message : String(err)})`,
      );
    }
    await writeFile(localSidecar, sidecar, 'utf8');
  }

  return { meta, storedIn: r2Ok ? 'r2' : 'disk', r2Ok, r2Error };
}

async function uploadToR2(filePath: string, key: string, contentType: string) {
  const upload = new Upload({
    client: r2Client(),
    params: {
      Bucket: R2_BUCKET,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentType,
    },
    queueSize: 4,
    partSize: 10 * 1024 * 1024, // 10 MB parts → handles multi-GB videos
  });
  await upload.done();
}

async function putR2Object(key: string, body: string, contentType: string) {
  const upload = new Upload({
    client: r2Client(),
    params: { Bucket: R2_BUCKET, Key: key, Body: body, ContentType: contentType },
  });
  await upload.done();
}

// ─── Read path (admin) ────────────────────────────────────

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', heic: 'image/heic', heif: 'image/heif', avif: 'image/avif',
  bmp: 'image/bmp', tiff: 'image/tiff',
  mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/x-m4v', webm: 'video/webm',
  avi: 'video/x-msvideo', mkv: 'video/x-matroska', '3gp': 'video/3gpp',
};

/** Best-effort MIME from a filename extension (used when there's no sidecar). */
export function guessMime(storedName: string): string {
  const ext = storedName.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MIME[ext] ?? 'application/octet-stream';
}

/** Pull the guest name + timestamp back out of the stored filename. */
function parseStoredName(storedName: string): { name: string | null; createdAt: string | null } {
  const base = storedName.replace(/\.[^.]*$/, '');
  const parts = base.split('__'); // [timestamp, name, originalBase, id]
  let createdAt: string | null = null;
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})$/.exec(parts[0] ?? '');
  if (m) createdAt = `${m[1]}T${m[2]}:${m[3]}:${m[4]}Z`;
  let name: string | null = parts.length >= 4 ? parts[1] : null;
  if (!name || name === 'anonim') name = null;
  return { name, createdAt };
}

function toAdminItem(storedName: string, lastModified?: Date): AdminItem {
  const { name, createdAt } = parseStoredName(storedName);
  return {
    storedName,
    isImage: isImageName(storedName),
    name,
    createdAt: createdAt ?? lastModified?.toISOString() ?? new Date(0).toISOString(),
  };
}

/**
 * List uploads for the admin gallery straight from the MEDIA files — no
 * sidecar reads. Sources: R2 (successful uploads) + local disk (R2-failed
 * fallbacks). Name/date come from the filename itself.
 */
export async function listUploads(): Promise<AdminItem[]> {
  const items = new Map<string, AdminItem>();

  // Local disk (R2-failed fallbacks).
  await ensureDir();
  for (const f of await readdir(UPLOAD_DIR)) {
    if (f.startsWith('.') || f.endsWith('.json')) continue; // skip .tmp, sidecars
    items.set(f, toAdminItem(f));
  }

  // R2 (successful uploads) — one paginated listing, no per-object fetch.
  // If R2 is unreachable we still return the local items rather than failing.
  if (r2Configured) {
    try {
      let cursor: string | undefined;
      do {
        const res = await r2Client().send(
          new ListObjectsV2Command({ Bucket: R2_BUCKET, ContinuationToken: cursor }),
        );
        for (const o of res.Contents ?? []) {
          const key = o.Key ?? '';
          if (!key || key.endsWith('.json')) continue;
          if (!items.has(key)) items.set(key, toAdminItem(key, o.LastModified));
        }
        cursor = res.IsTruncated ? res.NextContinuationToken : undefined;
      } while (cursor);
    } catch {
      // R2 listing failed (creds/bucket/network) — show local items only.
    }
  }

  return [...items.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Resolve a stored file path, guarding against path traversal. */
export function resolveStoredFile(storedName: string): string | null {
  if (!storedName || storedName.includes('/') || storedName.includes('\\') || storedName.includes('..')) {
    return null;
  }
  return join(UPLOAD_DIR, storedName);
}

export interface R2Object {
  body: Readable;
  contentType?: string;
  contentLength?: number;
  contentRange?: string;
  /** 206 when a Range was honoured, otherwise 200. */
  status: number;
}

/** Stream a stored object back from R2, forwarding an optional Range header. */
export async function getR2Object(key: string, range?: string | null): Promise<R2Object | null> {
  if (!r2Configured) return null;
  const res = await r2Client().send(
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key, Range: range || undefined }),
  );
  return {
    body: res.Body as Readable,
    contentType: res.ContentType,
    contentLength: res.ContentLength,
    contentRange: res.ContentRange,
    status: range && res.ContentRange ? 206 : 200,
  };
}

// ─── Admin auth token ─────────────────────────────────────
// The admin password gates the API. For media URLs used in <img>/<video>
// tags (which can't send custom headers) we hand out a derived static token
// instead of putting the raw password in the URL.

export function makeToken(): string {
  return createHmac('sha256', ADMIN_PASSWORD).update('wedding-admin-v1').digest('hex');
}

export function checkPassword(pw: string | null | undefined): boolean {
  if (!pw) return false;
  const a = Buffer.from(pw);
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function checkToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = Buffer.from(makeToken());
  const got = Buffer.from(token);
  return got.length === expected.length && timingSafeEqual(got, expected);
}
