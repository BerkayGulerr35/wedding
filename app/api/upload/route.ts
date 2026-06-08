import { NextRequest, NextResponse } from 'next/server';
import { saveUpload } from '@/lib/storage';

export const runtime = 'nodejs';
// Don't let the platform try to statically optimize or cache this.
export const dynamic = 'force-dynamic';
// Large media: keep the function alive long enough to stream big videos.
export const maxDuration = 300;

function decodeHeader(value: string | null): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function POST(req: NextRequest) {
  const originalName = decodeHeader(req.headers.get('x-original-name')) || 'upload.bin';
  const mime = req.headers.get('x-mime') || req.headers.get('content-type') || 'application/octet-stream';
  const name = decodeHeader(req.headers.get('x-guest-name')) || null;
  const note = decodeHeader(req.headers.get('x-guest-note')) || null;

  if (!req.body) {
    return NextResponse.json({ ok: false, error: 'empty-body' }, { status: 400 });
  }

  try {
    const result = await saveUpload({
      body: req.body,
      originalName,
      mime,
      name,
      note,
    });

    return NextResponse.json({
      ok: true,
      storedName: result.meta.storedName,
      r2: result.r2Ok,
      r2Error: result.r2Error ?? null,
    });
  } catch (err) {
    // Disk write failed → the upload genuinely failed.
    const message = err instanceof Error ? err.message : 'disk-write-failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
