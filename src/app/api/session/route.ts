import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AT_COOKIE, RT_COOKIE, apiSend } from '@/lib/serverApi';
import type { SessionUser } from '@/lib/types';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: SessionUser;
}

const cookieBase = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' };

function setSession(res: NextResponse, tokens: AuthTokens): void {
  res.cookies.set(AT_COOKIE, tokens.accessToken, { ...cookieBase, maxAge: tokens.expiresIn });
  res.cookies.set(RT_COOKIE, tokens.refreshToken, { ...cookieBase, maxAge: 30 * 24 * 3600 });
  // Non-sensitive display hint for layouts (NOT used for authorization):
  res.cookies.set('gum_user', JSON.stringify({ name: tokens.user.fullName, roles: tokens.user.roles }), {
    ...cookieBase,
    httpOnly: false,
    maxAge: 30 * 24 * 3600,
  });
}

/** POST /api/session — login. Tokens live in httpOnly cookies (XSS-safe). */
export async function POST(req: Request): Promise<NextResponse> {
  const { identifier, password } = (await req.json()) as { identifier: string; password: string };
  const { status, body } = await apiSend<AuthTokens>('POST', '/auth/login', { identifier, password });
  if (!body.success) {
    return NextResponse.json(body, { status });
  }
  const res = NextResponse.json({ success: true, data: { user: body.data.user }, error: null });
  setSession(res, body.data);
  return res;
}

/** PUT /api/session — refresh rotation (called by the proxy on 401). */
export async function PUT(): Promise<NextResponse> {
  const rt = cookies().get(RT_COOKIE)?.value;
  if (!rt) return NextResponse.json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'No session' } }, { status: 401 });
  const { status, body } = await apiSend<AuthTokens>('POST', '/auth/refresh', { refreshToken: rt });
  if (!body.success) {
    const res = NextResponse.json(body, { status });
    res.cookies.delete(AT_COOKIE);
    res.cookies.delete(RT_COOKIE);
    res.cookies.delete('gum_user');
    return res;
  }
  const res = NextResponse.json({ success: true, data: { user: body.data.user }, error: null });
  setSession(res, body.data);
  return res;
}

/** DELETE /api/session — logout (revokes server session + clears cookies). */
export async function DELETE(): Promise<NextResponse> {
  const rt = cookies().get(RT_COOKIE)?.value;
  if (rt) await apiSend('POST', '/auth/logout', { refreshToken: rt }).catch(() => undefined);
  const res = NextResponse.json({ success: true, data: { message: 'Logged out' }, error: null });
  res.cookies.delete(AT_COOKIE);
  res.cookies.delete(RT_COOKIE);
  res.cookies.delete('gum_user');
  return res;
}
