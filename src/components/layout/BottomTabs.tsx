'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Home', icon: '⌂' },
  { href: '/my', label: 'My Internships', icon: '▣' },
  { href: '/my/live', label: 'Live', icon: '◉' },
  { href: '/my/profile', label: 'Profile', icon: '☺' },
];

/** MOBILE app shell (hidden ≥768px — TopNav owns desktop). Distinct layout, not a scaled one. */
export function BottomTabs(): JSX.Element {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Primary">
      {TABS.map((t) => {
        const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`flex h-14 flex-col items-center justify-center gap-0.5 text-caption ${active ? 'text-primary-600' : 'text-neutral-600'}`}>
            <span aria-hidden className="text-base leading-none">{t.icon}</span>
            {t.label.split(' ')[0]}
          </Link>
        );
      })}
    </nav>
  );
}
