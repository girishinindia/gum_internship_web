import Link from 'next/link';
import { apiGet } from '@/lib/serverApi';
import { inr } from '@/lib/format';
import { MobileEmpty } from '@/components/MobileUI';
import { HomeSearch } from '@/components/MobileHomeSearch';
import { AppBar } from '@/components/mobile/AppBar';
import type { InternshipSummary } from '@/lib/types';

export const revalidate = 60;

export default async function Explore({ searchParams }: { searchParams: Record<string, string | undefined> }): Promise<JSX.Element> {
  const qs = new URLSearchParams();
  for (const k of ['q', 'category', 'pricingType', 'sort']) if (searchParams[k]) qs.set(k, searchParams[k] as string);
  const [list, categories] = await Promise.all([
    apiGet<InternshipSummary[]>(`/catalog/internships?${qs}`, { revalidate: 60 }),
    apiGet<{ name: string; slug: string }[]>('/catalog/categories', { revalidate: 3600 }),
  ]);
  const active = searchParams.category;

  return (
    <>
      <AppBar title="Explore" />
      <div className="space-y-3 p-4">
        <HomeSearch categories={categories.data} />
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <Link href="/m/explore" className={`pill shrink-0 ${!active ? 'bg-primary-600 text-white' : 'border border-neutral-300 bg-white text-neutral-700'}`}>All</Link>
          {categories.data.map((c) => (
            <Link key={c.slug} href={`/m/explore?category=${c.slug}`} className={`pill shrink-0 ${active === c.slug ? 'bg-primary-600 text-white' : 'border border-neutral-300 bg-white text-neutral-700'}`}>{c.name}</Link>
          ))}
        </div>

        {list.data.length === 0 ? <MobileEmpty title="No matches" body="Try removing a filter." />
        : list.data.map((i) => (
          <Link key={i.id} href={`/m/internships/${i.slug}`} className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft active:scale-[0.99]">
            <div className="relative aspect-[16/7] bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {i.thumbnailUrl && <img src={i.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
              <span className={`pill absolute right-2 top-2 ${i.deliveryMode === 'live' ? 'bg-danger-50 text-danger-700' : 'bg-white/90 text-neutral-700'}`}>{i.deliveryMode}</span>
            </div>
            <div className="p-3">
              <p className="line-clamp-2 font-medium text-neutral-900">{i.title}</p>
              <p className="mt-1 text-body-sm text-neutral-600">{i.instructorName} · {i.durationWeeks ?? '—'} weeks</p>
              <p className="mt-1.5 font-heading text-h3">{i.pricingType === 'free' ? <span className="text-success-700">FREE</span> : inr(i.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
