'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';
import type { IconName } from './Icon';

const TABS: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: '/m', label: 'Home', icon: 'home', match: (p) => p === '/m' },
  { href: '/m/learn', label: 'Learn', icon: 'book', match: (p) => p.startsWith('/m/learn') },
  { href: '/m/explore', label: 'Explore', icon: 'compass', match: (p) => p.startsWith('/m/explore') || p.startsWith('/m/internships') },
  { href: '/m/forum', label: 'Community', icon: 'users', match: (p) => p.startsWith('/m/forum') || p.startsWith('/m/achievements') },
  { href: '/m/profile', label: 'Profile', icon: 'user', match: (p) => p.startsWith('/m/profile') },
];

// Immersive/detail screens hide the bar so the content owns the viewport.
const HIDE = /^\/m\/(?:internships|jobs|forum|bundles)\/[^/]+$|^\/m\/interview|^\/m\/classroom/;

export function BottomNav(): JSX.Element | null {
  const pathname = usePathname() ?? '';
  if (HIDE.test(pathname)) return null;
  return (
    <nav className="z-20 grid shrink-0 grid-cols-5 border-t border-neutral-200 bg-white/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link key={t.href} href={t.href} className={`flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium transition ${active ? 'text-primary-600' : 'text-neutral-400'}`}>
            <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active ? 'bg-primary-50' : ''}`}>
              <Icon name={t.icon} size={21} />
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
