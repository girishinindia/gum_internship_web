import { TopNav } from '@/components/layout/TopNav';
import { DashboardShell } from '@/components/layout/DashboardShell';
import type { NavItem } from '@/components/layout/SidebarNav';

const EMPLOYER_NAV: NavItem[] = [
  { href: '/employer', label: 'Company', icon: '🏢' },
  { href: '/employer/jobs', label: 'Jobs', icon: '💼' },
];

export default function EmployerLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <TopNav />
      <main className="pb-10"><DashboardShell items={EMPLOYER_NAV}>{children}</DashboardShell></main>
    </>
  );
}
