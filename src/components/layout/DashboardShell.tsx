import type { ReactNode } from 'react';
import { SidebarNav } from './SidebarNav';
import type { NavItem } from './SidebarNav';

/**
 * Two-column dashboard layout: a sticky section sidebar + scrolling content.
 * On mobile the sidebar collapses to a horizontal scroller above the content.
 * Used by the student area now; instructor/employer/org areas reuse it in later
 * phases by passing their own nav items.
 */
export function DashboardShell({ items, children }: { items: NavItem[]; children: ReactNode }): JSX.Element {
  return (
    <div className="container-page grid gap-6 py-6 md:grid-cols-[220px_1fr] md:py-8">
      <aside className="md:sticky md:top-24 md:self-start">
        <SidebarNav items={items} />
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
