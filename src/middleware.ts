import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isMobilePath, toDesktopPath, toMobilePath } from '@/lib/deviceRoutes';

/**
 * ONE app, two layouts, auto-selected by device.
 *
 * 1) DEVICE ROUTING: phones & tablets are redirected from the desktop routes to
 *    their mobile-native equivalents under /m (and desktop browsers hitting /m
 *    are sent back). Same app, same session, same deploy — no separate portal.
 * 2) AUTH: protected routes (desktop + mobile) bounce to /login when there's no
 *    session cookie. Real authorization is enforced by the API on every call.
 */

const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Silk/i;

const PROTECTED = [
  /^\/my/, /^\/classroom/, /^\/instructor/, /^\/m\/learn/, /^\/m\/profile/,
  /^\/m\/jobs/, /^\/m\/applications/, /^\/m\/mentorship/, /^\/m\/assessment/, /^\/m\/interview/,
  /^\/m\/forum/, /^\/m\/achievements/, /^\/m\/notifications/, /^\/m\/bundles/, /^\/m\/cpd/, /^\/m\/classroom/,
  // authenticated areas added across the web phases (W1+)
  /^\/checkout/, /^\/orders/, /^\/notifications/, /^\/ai(\/|$)/, /^\/employer/, /^\/orgs/,
  /^\/achievements/, /^\/forum/, /^\/interview/, /^\/mentorship/, /^\/assessment/,
  /^\/jobs/, /^\/applications/, /^\/bundles/, /^\/cpd/,
];

export function middleware(req: NextRequest): NextResponse {
  const { pathname, search } = req.nextUrl;
  const hasSession = req.cookies.has('gum_rt');
  const isMobile = MOBILE_UA.test(req.headers.get('user-agent') ?? '');

  // 1) Device routing (skip the shared /login and /verify pages).
  const onMobilePath = isMobilePath(pathname);
  const shared = pathname === '/login' || pathname.startsWith('/verify');
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

  // 2) Auth gate.
  if (PROTECTED.some((re) => re.test(pathname)) && !hasSession) {
    const login = new URL('/login', req.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }
  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL(isMobile ? '/m/learn' : '/my', req.url));
  }
  return NextResponse.next();
}

// Run on everything except API routes, Next internals and static assets.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)'],
};
