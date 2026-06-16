import Link from 'next/link';
import { apiGet } from '@/lib/serverApi';
import { inr } from '@/lib/format';
import { HomeSearch } from '@/components/MobileHomeSearch';
import { AppBar } from '@/components/mobile/AppBar';
import { Fab } from '@/components/mobile/Fab';
import type { InternshipSummary } from '@/lib/types';

export const revalidate = 120;

export default async function MobileHome(): Promise<JSX.Element> {
  const [popular, categories] = await Promise.all([
    apiGet<InternshipSummary[]>('/catalog/internships?sort=popular&limit=8', { revalidate: 120 }),
    apiGet<{ name: string; slug: string }[]>('/catalog/categories', { revalidate: 3600 }),
  ]);
  return (
    <>
      <AppBar variant="large" title="Learn by doing" subtitle="Namaste 👋" actions={[{ icon: 'bell', label: 'Notifications', href: '/m/notifications', badge: true }]}>
        <div className="mt-3"><HomeSearch categories={categories.data} /></div>
      </AppBar>

      {/* Category chips — horizontal scroll, native feel */}
      <div className="flex gap-2 overflow-x-auto px-4 py-4 [scrollbar-width:none]">
        {categories.data.map((c) => (
          <Link key={c.slug} href={`/m/explore?category=${c.slug}`} className="pill shrink-0 border border-neutral-300 bg-white text-neutral-700">
            {c.name}
          </Link>
        ))}
      </div>

      <h2 className="px-4 pb-2 font-heading text-h3">Popular now</h2>
      <div className="space-y-3 px-4 pb-6">
        {popular.data.map((i) => (
          <Link key={i.id} href={`/m/internships/${i.slug}`} className="block overflow-hidden rounded-xl border border-neutral-200 bg-white active:scale-[0.99]">
            <div className="relative aspect-[16/7] bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {i.thumbnailUrl && <img src={i.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
              <span className={`pill absolute right-2 top-2 ${i.deliveryMode === 'live' ? 'bg-danger-50 text-danger-700' : 'bg-white/90 text-neutral-700'}`}>{i.deliveryMode}</span>
            </div>
            <div className="p-3">
              <p className="line-clamp-2 font-medium">{i.title}</p>
              <p className="mt-1 text-body-sm text-neutral-600">{i.instructorName} · {i.durationWeeks ?? '—'} weeks</p>
              <p className="mt-1.5 font-heading text-h3">{i.pricingType === 'free' ? <span className="text-success-700">FREE</span> : inr(i.price)}</p>
            </div>
          </Link>
        ))}
      </div>
      <Fab icon="compass" label="Explore" href="/m/explore" />
    </>
  );
}
