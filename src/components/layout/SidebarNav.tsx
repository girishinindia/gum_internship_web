'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export interface NavItem { href: string; label: string; icon?: ReactNode }

/** Vertical section nav for dashboard areas; highlights the active route. */
export function SidebarNav({ items }: { items: NavItem[] }): JSX.Element {
  const pathname = usePathname();
  const isActive = (href: string): boolean => pathname === href || (href !== '/my' && pathname.startsWith(`${href}/`));
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-body-sm font-medium transition ${
            isActive(it.href) ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
        >
          {it.icon && <span className="text-base" aria-hidden>{it.icon}</span>}
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
