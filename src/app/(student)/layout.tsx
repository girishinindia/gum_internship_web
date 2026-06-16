import { TopNav } from '@/components/layout/TopNav';
import { BottomTabs } from '@/components/layout/BottomTabs';
import { DashboardShell } from '@/components/layout/DashboardShell';
import type { NavItem } from '@/components/layout/SidebarNav';

/** Student dashboard nav — items grow as later web phases (W2+) add pages. */
const STUDENT_NAV: NavItem[] = [
  { href: '/my', label: 'Dashboard', icon: '🏠' },
  { href: '/achievements', label: 'Achievements', icon: '🏅' },
  { href: '/forum', label: 'Doubt forum', icon: '💬' },
  { href: '/jobs', label: 'Job board', icon: '💼' },
  { href: '/applications', label: 'My applications', icon: '📨' },
  { href: '/bundles', label: 'Bundles', icon: '🎁' },
  { href: '/cpd', label: 'CPD hours', icon: '⏱️' },
  { href: '/mentorship', label: 'Mentorship', icon: '🧑‍🏫' },
  { href: '/assessment', label: 'Skill check', icon: '🎯' },
  { href: '/interview', label: 'Mock interview', icon: '🤖' },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/orders', label: 'Orders & invoices', icon: '🧾' },
  { href: '/my/portfolio', label: 'Portfolio & resume', icon: '🎯' },
];

/** Student app shell — desktop: top nav + section sidebar; mobile: bottom tabs. */
export default function StudentLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <TopNav />
      <main className="pb-24 md:pb-10">
        <DashboardShell items={STUDENT_NAV}>{children}</DashboardShell>
      </main>
      <BottomTabs />
    </>
  );
}
