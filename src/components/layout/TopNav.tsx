import Link from 'next/link';
import { getSessionUser, hasRole } from '@/lib/session';
import { UserMenu } from './UserMenu';

/** DESKTOP navigation — glassy sticky bar (hidden on mobile; /m owns <768px). */
export function TopNav(): JSX.Element {
  const user = getSessionUser();
  const menuLinks = [
    { href: '/my', label: 'Dashboard' },
    { href: '/jobs', label: 'Job board' },
    { href: '/my/portfolio', label: 'Portfolio & resume' },
    { href: '/employer', label: 'Employer portal' },
    { href: '/orgs', label: 'Organizations' },
  ];
  if (user && hasRole(user, 'instructor')) menuLinks.push({ href: '/instructor', label: 'Instructor' });
  return (
    <header className="sticky top-0 z-40 glass">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow transition group-hover:scale-105">
            <span className="text-base font-bold">GI</span>
          </span>
          <span className="font-heading text-[19px] font-bold tracking-tight text-neutral-900">
            GI <span className="gradient-text">Internship</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 text-body-sm font-medium text-neutral-600 md:flex">
          <Link href="/internships" className="rounded-lg px-3 py-2 transition hover:bg-primary-50 hover:text-primary-700">Explore</Link>
          {user ? (
            <>
              <Link href="/my" className="rounded-lg px-3 py-2 transition hover:bg-primary-50 hover:text-primary-700">My Internships</Link>
              {hasRole(user, 'instructor') && (
                <Link href="/instructor" className="rounded-lg px-3 py-2 transition hover:bg-primary-50 hover:text-primary-700">Instructor</Link>
              )}
              <span className="ml-2"><UserMenu name={user.name} links={menuLinks} /></span>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 transition hover:bg-primary-50 hover:text-primary-700">Log in</Link>
              <Link href="/signup" className="btn-primary !h-10 px-5 text-body-sm">Get started</Link>
            </>
          )}
        </nav>
        <Link href={user ? '/my' : '/login'} className="btn-outline !h-9 px-4 text-body-sm md:hidden">
          {user ? user.name.split(' ')[0] : 'Log in'}
        </Link>
      </div>
    </header>
  );
}
