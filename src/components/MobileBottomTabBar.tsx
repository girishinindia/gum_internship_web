'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/m', label: 'Home', icon: '⌂' },
  { href: '/m/learn', label: 'Learn', icon: '▣' },
  { href: '/m/live', label: 'Live', icon: '◉' },
  { href: '/m/profile', label: 'Profile', icon: '☺' },
];

export function MobileBottomTabBar(): JSX.Element {
  const pathname = usePathname();
  return (
    <nav className="z-20 grid shrink-0 grid-cols-4 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
      {TABS.map((t) => {
        const active = t.href === '/m' ? pathname === '/m' : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`tab-btn ${active ? 'text-primary-600' : 'text-neutral-500'}`}>
            <span aria-hidden className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
