import { NextRequest, NextResponse } from 'next/server';
import { checkPassword } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validate the admin password server-side against the ADMIN_PASSWORD env var,
// so the real password never ships in the client bundle.
export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: '' }));
  if (!checkPassword(password)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
