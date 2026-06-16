'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface MenuLink { href: string; label: string }

export function UserMenu({ name, links }: { name: string; links: MenuLink[] }): JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent): void => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const logout = async (): Promise<void> => {
    await fetch('/api/session', { method: 'DELETE' });
    setOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-neutral-100 py-1 pl-1 pr-3 transition hover:bg-neutral-200"
        aria-haspopup="menu" aria-expanded={open}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-caption font-semibold text-white">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="text-body-sm text-neutral-700">{name.split(' ')[0]}</span>
        <span className="text-neutral-400">▾</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white py-1 shadow-lift">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-body-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700">
              {l.label}
            </Link>
          ))}
          <div className="my-1 border-t border-neutral-100" />
          <button onClick={logout} className="block w-full px-4 py-2.5 text-left text-body-sm text-danger-600 hover:bg-danger-50">
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
