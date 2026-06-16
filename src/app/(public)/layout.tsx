import { Footer } from '@/components/layout/Footer';
import { TopNav } from '@/components/layout/TopNav';
import { BottomTabs } from '@/components/layout/BottomTabs';

/** Public shell: desktop top-nav + footer; mobile gets bottom tabs + padding for them. */
export default function PublicLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <TopNav />
      <main className="pb-20 md:pb-0">{children}</main>
      <Footer />
      <BottomTabs />
    </>
  );
}
