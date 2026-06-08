import { NextRequest, NextResponse } from 'next/server';
import { listUploads, checkPassword, makeToken, isImageName } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const pw = req.headers.get('x-admin-password');
  if (!checkPassword(pw)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const metas = await listUploads();
  const token = makeToken();

  const uploads = metas.map((m) => ({
    ...m,
    isImage: isImageName(m.storedName),
  }));

  return NextResponse.json({ ok: true, token, uploads });
}
