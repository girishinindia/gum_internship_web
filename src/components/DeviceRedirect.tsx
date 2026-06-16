'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isMobilePath, toDesktopPath, toMobilePath } from '@/lib/deviceRoutes';

const MOBILE_MAX = 767; // px — below this we use the /m app shell

/**
 * Viewport-width device routing (complements the server-side UA routing in
 * middleware). This catches cases UA detection misses: Chrome DevTools device
 * emulation that doesn't reload, and narrow desktop windows. Pure width-based
 * and idempotent, so it can't loop: small width → /m equivalent; wide → desktop.
 */
export function DeviceRedirect(): null {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname) return;
    if (pathname === '/login' || pathname.startsWith('/verify')) return; // shared pages

    const apply = (): void => {
      const small = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches;
      const onMobile = isMobilePath(pathname);
      if (small && !onMobile) {
        const to = toMobilePath(pathname);
        if (to && to !== pathname) router.replace(to);
      } else if (!small && onMobile) {
        const to = toDesktopPath(pathname);
        if (to && to !== pathname) router.replace(to);
      }
    };

    apply();
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pathname, router]);

  return null;
}
