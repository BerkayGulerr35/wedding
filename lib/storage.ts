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
import { mkdir, writeFile, readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import type { UploadMeta } from './types';

// ─── Config ───────────────────────────────────────────────
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim()
    ? process.env.UPLOAD_DIR.trim()
    : join(process.cwd(), 'uploads');

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
  diskOk: true; // we only return on disk success; otherwise we throw
  r2Ok: boolean;
  r2Error?: string;
}

async function ensureDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Stream an upload to disk (required), then mirror to R2 (best-effort).
 * Throws if the disk write fails. R2 failures are reported, not thrown.
 */
export async function saveUpload(input: SaveInput): Promise<SaveResult> {
  await ensureDir();

  const { id, storedName } = buildStoredName(input.originalName, input.name);
  const filePath = join(UPLOAD_DIR, storedName);

  // 1. Stream request body straight to disk (no buffering of the whole file).
  if (!input.body) throw new Error('empty-body');
  const nodeStream = Readable.fromWeb(input.body as any);
  await pipeline(nodeStream, createWriteStream(filePath));

  const { size } = await stat(filePath);

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

  // 2. Mirror media + sidecar to R2 (best-effort).
  let r2Ok = false;
  let r2Error: string | undefined;
  if (r2Configured) {
    try {
      await uploadToR2(filePath, storedName, meta.mime);
      await putR2Object(`${storedName}.json`, JSON.stringify({ ...meta, r2: true }), 'application/json');
      r2Ok = true;
      meta.r2 = true;
    } catch (err) {
      r2Error = err instanceof Error ? err.message : String(err);
    }
  }

  // 3. Write the sidecar to disk last, so it reflects the final r2 status.
  await writeFile(join(UPLOAD_DIR, `${storedName}.json`), JSON.stringify(meta, null, 2), 'utf8');

  return { meta, diskOk: true, r2Ok, r2Error };
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

/** List all uploads by reading the sidecar JSON files on disk. */
export async function listUploads(): Promise<UploadMeta[]> {
  await ensureDir();
  const entries = await readdir(UPLOAD_DIR);
  const sidecars = entries.filter((f) => f.endsWith('.json'));

  const metas: UploadMeta[] = [];
  for (const sc of sidecars) {
    try {
      const raw = await readFile(join(UPLOAD_DIR, sc), 'utf8');
      metas.push(JSON.parse(raw) as UploadMeta);
    } catch {
      // skip corrupt sidecar
    }
  }

  metas.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); // newest first
  return metas;
}

/** Resolve a stored file path, guarding against path traversal. */
export function resolveStoredFile(storedName: string): string | null {
  if (!storedName || storedName.includes('/') || storedName.includes('\\') || storedName.includes('..')) {
    return null;
  }
  return join(UPLOAD_DIR, storedName);
}

/** Stream a stored object back from R2 (fallback when disk copy is gone). */
export async function getFromR2(key: string) {
  if (!r2Configured) return null;
  const res = await r2Client().send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  return res.Body as Readable | undefined;
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
