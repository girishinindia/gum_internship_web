import { TopNav } from '@/components/layout/TopNav';
import { DashboardShell } from '@/components/layout/DashboardShell';
import type { NavItem } from '@/components/layout/SidebarNav';

/** Instructor nav — grows in W7 (review queue, earnings, authoring). */
const INSTRUCTOR_NAV: NavItem[] = [
  { href: '/instructor', label: 'Overview', icon: '📊' },
  { href: '/instructor/internships', label: 'Internships', icon: '📚' },
  { href: '/instructor/reviews', label: 'Review queue', icon: '✅' },
  { href: '/instructor/earnings', label: 'Earnings', icon: '💰' },
  { href: '/instructor/mentorship', label: 'Mentorship slots', icon: '🧑‍🏫' },
];

export default function InstructorLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <TopNav />
      <main className="pb-10"><DashboardShell items={INSTRUCTOR_NAV}>{children}</DashboardShell></main>
    </>
  );
}
