import Link from 'next/link';
import { apiGet } from '@/lib/serverApi';
import { MobileEmpty } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';
import { Fab } from '@/components/mobile/Fab';

export const metadata = { title: 'My Learning' };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Enrollment = Record<string, any>;

export default async function Learn(): Promise<JSX.Element> {
  const { data } = await apiGet<Enrollment[]>('/enrollments/me', { auth: true });
  return (
    <>
      <AppBar title="My learning" actions={[{ icon: 'bell', label: 'Notifications', href: '/m/notifications', badge: true }]} />
      {data.length === 0 ? (
        <MobileEmpty title="Nothing yet" body="Enroll in an internship to start." cta={<Link href="/m/explore" className="pill bg-primary-600 text-white">Explore</Link>} />
      ) : (
        <div className="space-y-3 p-4">
          {data.map((e) => {
            const pct = Math.round(Number(e.progressPercent));
            return (
              <Link key={e.id} href={`/m/classroom/${e.id}`} className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft active:scale-[0.99]">
                <div className="flex items-center justify-between">
                  <span className={`pill ${e.status === 'active' ? 'bg-success-50 text-success-700' : e.status === 'completed' ? 'bg-primary-50 text-primary-700' : 'bg-neutral-100 text-neutral-700'}`}>{e.status}</span>
                  <span className="text-body-sm font-medium text-neutral-600">{pct}%</span>
                </div>
                <p className="mt-2 line-clamp-2 font-medium text-neutral-900">{e.internship?.title}</p>
                {e.batch && <p className="text-caption text-neutral-500">{e.batch.name}</p>}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                  <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-body-sm font-medium text-primary-700">Continue learning →</span>
                  {e.offerLetterNo && <span className="pill bg-warning-50 text-warning-700">Offer ✓</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <Fab icon="compass" label="Explore" href="/m/explore" />
    </>
  );
}
