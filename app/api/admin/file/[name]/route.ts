import { NextRequest } from 'next/server';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { checkToken, resolveStoredFile, getR2Object, guessMime } from '@/lib/storage';

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
  const filePath = resolveStoredFile(storedName); // also validates against traversal
  if (!filePath) return new Response('bad-name', { status: 400 });

  const mime = guessMime(storedName);
  const wantsDownload = url.searchParams.get('download') === '1';
  const disposition = wantsDownload
    ? `attachment; filename*=UTF-8''${encodeURIComponent(storedName)}`
    : 'inline';
  const range = req.headers.get('range');

  // Is the media on local disk (an R2-failed fallback)?
  let size: number | null = null;
  try {
    size = (await stat(filePath)).size;
  } catch {
    size = null;
  }

  // ─── Media on local disk ────────────────────────────────
  if (size !== null) {
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

  // ─── Media in R2 ────────────────────────────────────────
  try {
    const obj = await getR2Object(storedName, range);
    if (!obj) return new Response('not-found', { status: 404 });

    const headers: Record<string, string> = {
      'Content-Type': obj.contentType || mime,
      'Accept-Ranges': 'bytes',
      'Content-Disposition': disposition,
      'Cache-Control': 'private, max-age=3600',
    };
    if (obj.contentLength != null) headers['Content-Length'] = String(obj.contentLength);
    if (obj.contentRange) headers['Content-Range'] = obj.contentRange;

    return new Response(toWeb(obj.body), { status: obj.status, headers });
  } catch (err) {
    const code = (err as { name?: string })?.name === 'NoSuchKey' ? 404 : 502;
    return new Response('r2-fetch-failed', { status: code });
  }
}
