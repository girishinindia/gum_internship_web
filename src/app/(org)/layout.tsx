import { TopNav } from '@/components/layout/TopNav';

export default function OrgLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <TopNav />
      <main className="container-page py-8">{children}</main>
    </>
  );
}
