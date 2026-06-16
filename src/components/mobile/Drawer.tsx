'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMobileShell } from './MobileShell';
import { Icon } from './Icon';
import type { IconName } from './Icon';

interface Item { href: string; label: string; icon: IconName }
const PRIMARY: Item[] = [
  { href: '/m', label: 'Dashboard', icon: 'dashboard' },
  { href: '/m/learn', label: 'My internships', icon: 'book' },
  { href: '/m/explore', label: 'Explore', icon: 'compass' },
  { href: '/m/jobs', label: 'Job board', icon: 'briefcase' },
  { href: '/m/applications', label: 'My applications', icon: 'receipt' },
  { href: '/m/mentorship', label: 'Mentorship', icon: 'school' },
  { href: '/m/assessment', label: 'Skill check', icon: 'target' },
  { href: '/m/interview', label: 'Mock interview', icon: 'robot' },
  { href: '/m/forum', label: 'Forum', icon: 'chat' },
  { href: '/m/achievements', label: 'Achievements', icon: 'trophy' },
  { href: '/m/bundles', label: 'Bundles', icon: 'gift' },
  { href: '/m/cpd', label: 'CPD hours', icon: 'clock' },
  { href: '/m/notifications', label: 'Notifications', icon: 'bell' },
];

function readUser(): { name: string; roles: string[] } | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|; )gum_user=([^;]+)/);
  if (!m) return null;
  try { return JSON.parse(decodeURIComponent(m[1])) as { name: string; roles: string[] }; } catch { return null; }
}

export function Drawer(): JSX.Element {
  const { drawerOpen, closeDrawer } = useMobileShell();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; roles: string[] } | null>(null);

  useEffect(() => { setUser(readUser()); }, [drawerOpen]);
  useEffect(() => { closeDrawer(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const roles = user?.roles ?? [];
  const isStaff = (r: string): boolean => roles.includes('super_admin') || roles.includes(r);

  const logout = async (): Promise<void> => {
    await fetch('/api/session', { method: 'DELETE' });
    closeDrawer(); router.push('/m'); router.refresh();
  };

  return (
    <>
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-neutral-900/45 transition-opacity duration-200 ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-xs flex-col bg-white shadow-2xl transition-transform duration-200 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog" aria-modal="true" aria-label="Menu"
      >
        <div className="bg-brand-gradient px-4 pb-4 text-white" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>
          {user ? (
            <>
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white/20 text-h3 font-semibold">{user.name.slice(0, 1).toUpperCase()}</div>
              <p className="mt-2 font-medium">{user.name}</p>
              <p className="text-caption capitalize opacity-90">{roles.join(' · ') || 'student'}</p>
            </>
          ) : (
            <Link href="/login" onClick={closeDrawer} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-body-sm font-medium">Log in</Link>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {PRIMARY.map((it) => {
            const active = pathname === it.href;
            return (
              <Link key={it.href} href={it.href} onClick={closeDrawer}
                className={`flex items-center gap-3 px-4 py-2.5 text-body-sm transition ${active ? 'bg-primary-50 font-medium text-primary-700' : 'text-neutral-700 active:bg-neutral-100'}`}>
                <Icon name={it.icon} size={20} /> {it.label}
              </Link>
            );
          })}
          <div className="my-2 border-t border-neutral-100" />
          {isStaff('instructor') && <Link href="/instructor" onClick={closeDrawer} className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-neutral-700 active:bg-neutral-100"><Icon name="dashboard" size={20} /> Instructor console</Link>}
          <Link href="/employer" onClick={closeDrawer} className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-neutral-700 active:bg-neutral-100"><Icon name="building" size={20} /> Employer portal</Link>
          <Link href="/orgs" onClick={closeDrawer} className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-neutral-700 active:bg-neutral-100"><Icon name="users" size={20} /> Organizations</Link>
          <Link href="/my/portfolio" onClick={closeDrawer} className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-neutral-700 active:bg-neutral-100"><Icon name="user" size={20} /> Portfolio &amp; resume</Link>
        </nav>

        {user && (
          <button onClick={logout} className="flex items-center gap-3 border-t border-neutral-100 px-4 py-3.5 text-body-sm text-danger-600 active:bg-danger-50" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.875rem)' }}>
            <Icon name="logout" size={20} /> Sign out
          </button>
        )}
      </aside>
    </>
  );
}
