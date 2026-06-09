import { NextRequest, NextResponse } from 'next/server';
import { listUploads, checkPassword, makeToken } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const pw = req.headers.get('x-admin-password');
  if (!checkPassword(pw)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const uploads = await listUploads();
  const token = makeToken();

  return NextResponse.json({ ok: true, token, uploads });
}
