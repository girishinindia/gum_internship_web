import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isMobilePath, toDesktopPath, toMobilePath } from '@/lib/deviceRoutes';

/**
 * ONE app, two layouts, auto-selected by device.
 *
 * 1) DEVICE ROUTING: phones & tablets are redirected from the desktop routes to
 *    their mobile-native equivalents under /m (and desktop browsers hitting /m
 *    are sent back).
 * 2) AUTH: protected routes bounce to /login when there's no session.
 * 3) TOKEN REFRESH: the access cookie lives ~15 min; once the browser drops it,
 *    server-rendered pages would 401. Here — the one place that can re-set
 *    cookies AND forward them to the current render — we refresh using the
 *    refresh cookie, so authed pages keep working without a re-login.
 */

const API = process.env.API_URL ?? 'http://localhost:4000';
const AT = 'gum_at';
const RT = 'gum_rt';
const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Silk/i;

const PROTECTED = [
  /^\/my/, /^\/classroom/, /^\/instructor/, /^\/m\/learn/, /^\/m\/profile/,
  /^\/m\/jobs/, /^\/m\/applications/, /^\/m\/mentorship/, /^\/m\/assessment/, /^\/m\/interview/,
  /^\/m\/forum/, /^\/m\/achievements/, /^\/m\/notifications/, /^\/m\/bundles/, /^\/m\/cpd/, /^\/m\/classroom/,
  /^\/checkout/, /^\/orders/, /^\/notifications/, /^\/ai(\/|$)/, /^\/employer/, /^\/orgs/,
  /^\/achievements/, /^\/forum/, /^\/interview/, /^\/mentorship/, /^\/assessment/,
  /^\/jobs/, /^\/applications/, /^\/bundles/, /^\/cpd/, /^\/become-instructor/,
];

async function refresh(rt: string): Promise<{ at: string; rt: string; maxAge: number } | null> {
  try {
    const r = await fetch(`${API}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
      cache: 'no-store',
    });
    const j = (await r.json()) as { success: boolean; data?: { accessToken: string; refreshToken: string; expiresIn: number } };
    if (j.success && j.data) return { at: j.data.accessToken, rt: j.data.refreshToken, maxAge: j.data.expiresIn };
  } catch {
    // network/refresh failure → treat as no session
  }
  return null;
}

/** Replace (or add) one cookie in a raw Cookie header string. */
function withCookie(header: string, name: string, value: string): string {
  const parts = header ? header.split(/;\s*/).filter((p) => p && !p.startsWith(`${name}=`)) : [];
  parts.push(`${name}=${value}`);
  return parts.join('; ');
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  const isMobile = MOBILE_UA.test(req.headers.get('user-agent') ?? '');

  // 1) Device routing (skip the shared /login and /verify pages).
  const onMobilePath = isMobilePath(pathname);
  const shared = pathname === '/login' || pathname === '/forgot-password' || pathname.startsWith('/verify') || pathname.startsWith('/pages');
  if (!shared) {
    if (isMobile && !onMobilePath) {
      const to = toMobilePath(pathname);
      if (to) return NextResponse.redirect(new URL(to + search, req.url));
    }
    if (!isMobile && onMobilePath) {
      const to = toDesktopPath(pathname);
      return NextResponse.redirect(new URL((to ?? '/') + search, req.url));
    }
  }

  // 2) Refresh the access token if it expired but we still have a refresh token.
  let rotated: { at: string; rt: string; maxAge: number } | null = null;
  let sessionDead = false;
  const hasAt = req.cookies.has(AT);
  const rt = req.cookies.get(RT)?.value;
  if (!hasAt && rt) {
    rotated = await refresh(rt);
    if (!rotated) sessionDead = true; // refresh cookie present but rejected → dead session
  }
  const loggedIn = req.cookies.has(RT) && !sessionDead;

  // A dead session must not look logged-in: clear its cookies on whatever we return.
  const clearDead = (res: NextResponse): NextResponse => {
    if (sessionDead) { res.cookies.delete(AT); res.cookies.delete(RT); }
    return res;
  };

  // 3) Auth gate.
  if (PROTECTED.some((re) => re.test(pathname)) && !loggedIn) {
    const login = new URL('/login', req.url);
    login.searchParams.set('next', pathname);
    return clearDead(NextResponse.redirect(login));
  }
  if (pathname === '/login' && loggedIn) {
    return NextResponse.redirect(new URL(isMobile ? '/m/learn' : '/my', req.url));
  }

  // Forward the new token to THIS render (cookie header) + persist for the browser.
  if (rotated) {
    req.cookies.set(AT, rotated.at); // update the NextRequest store…
    const headers = new Headers(req.headers);
    headers.set('cookie', withCookie(req.headers.get('cookie') ?? '', AT, rotated.at)); // …and the raw header cookies() parses
    const res = NextResponse.next({ request: { headers } });
    const base = { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: process.env.NODE_ENV === 'production' };
    res.cookies.set(AT, rotated.at, { ...base, maxAge: rotated.maxAge });
    res.cookies.set(RT, rotated.rt, { ...base, maxAge: 30 * 24 * 3600 });
    return res;
  }
  return clearDead(NextResponse.next());
}

// Run on everything except API routes, Next internals and static assets.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)'],
};
