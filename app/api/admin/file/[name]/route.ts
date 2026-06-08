import { NextRequest } from 'next/server';
import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { checkToken, resolveStoredFile, UPLOAD_DIR } from '@/lib/storage';
import type { UploadMeta } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toWeb(stream: Readable): ReadableStream {
  return Readable.toWeb(stream) as unknown as ReadableStream;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const url = new URL(req.url);

  if (!checkToken(url.searchParams.get('t'))) {
    return new Response('unauthorized', { status: 401 });
  }

  const storedName = decodeURIComponent(name);
  const filePath = resolveStoredFile(storedName);
  if (!filePath) return new Response('bad-name', { status: 400 });

  let size: number;
  try {
    size = (await stat(filePath)).size;
  } catch {
    return new Response('not-found', { status: 404 });
  }

  // Pull mime / original filename from the sidecar (best-effort).
  let mime = 'application/octet-stream';
  let originalName = storedName;
  try {
    const meta = JSON.parse(await readFile(join(UPLOAD_DIR, `${storedName}.json`), 'utf8')) as UploadMeta;
    if (meta.mime) mime = meta.mime;
    if (meta.originalName) originalName = meta.originalName;
  } catch {
    /* no sidecar → fall back to defaults */
  }

  const wantsDownload = url.searchParams.get('download') === '1';
  const disposition = wantsDownload
    ? `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`
    : 'inline';

  const range = req.headers.get('range');
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? parseInt(m[2], 10) : size - 1;
      if (start >= size || end >= size || start > end) {
        return new Response('range-not-satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${size}` },
        });
      }
      const stream = createReadStream(filePath, { start, end });
      return new Response(toWeb(stream), {
        status: 206,
        headers: {
          'Content-Type': mime,
          'Content-Length': String(end - start + 1),
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Disposition': disposition,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    }
  }

  const stream = createReadStream(filePath);
  return new Response(toWeb(stream), {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Length': String(size),
      'Accept-Ranges': 'bytes',
      'Content-Disposition': disposition,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
