import { InternshipCard } from '@/components/features/InternshipCard';
import { apiGet } from '@/lib/serverApi';
import { pageMetadata } from '@/lib/seo';
import type { InternshipSummary } from '@/lib/types';
import Link from 'next/link';

export const metadata = pageMetadata({
  title: 'Explore internships',
  description: 'Browse free and paid internships across Web Development, Flutter, Data Science, Digital Marketing and more.',
  path: '/internships',
});
export const revalidate = 300;

const FILTERS = ['category', 'pricingType', 'deliveryMode', 'level', 'q', 'sort', 'page'] as const;

/** Filters live in URL search params → links are shareable (SEO + UX). */
export default async function CatalogPage({ searchParams }: { searchParams: Record<string, string | undefined> }): Promise<JSX.Element> {
  const qs = new URLSearchParams();
  for (const k of FILTERS) if (searchParams[k]) qs.set(k, searchParams[k] as string);
  const [list, categories] = await Promise.all([
    apiGet<InternshipSummary[]>(`/catalog/internships?${qs.toString()}`, { revalidate: 60 }),
    apiGet<{ name: string; slug: string }[]>('/catalog/categories', { revalidate: 3600 }),
  ]);
  const total = list.meta?.pagination?.total ?? list.data.length;
  const link = (k: string, v: string | null): string => {
    const next = new URLSearchParams(qs);
    if (v === null) next.delete(k); else next.set(k, v);
    next.delete('page');
    const s = next.toString();
    return `/internships${s ? `?${s}` : ''}`;
  };
  return (
    <div className="hero-surface">
      <div className="container-page py-10 md:py-14">
        <span className="eyebrow">Catalog</span>
        <h1 className="mt-3 text-h1">Explore internships</h1>
        <p className="mt-1.5 text-body-lg text-neutral-500">{total} programs · every filter is a shareable link</p>

        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Link href={link('category', null)} className={`chip ${!searchParams.category ? 'chip-active' : ''}`}>All</Link>
            {categories.data.map((c) => (
              <Link key={c.slug} href={link('category', c.slug)} className={`chip ${searchParams.category === c.slug ? 'chip-active' : ''}`}>{c.name}</Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['free', 'paid'] as const).map((p) => (
              <Link key={p} href={link('pricingType', searchParams.pricingType === p ? null : p)} className={`chip ${searchParams.pricingType === p ? 'chip-active' : ''}`}>{p === 'free' ? 'Free' : 'Paid'}</Link>
            ))}
            <span className="mx-1 hidden h-5 w-px bg-neutral-200 md:block" />
            <span className="text-caption text-neutral-400">Sort</span>
            {(['popular', 'newest', 'price_asc', 'price_desc'] as const).map((s) => (
              <Link key={s} href={link('sort', s)} className={`chip ${(searchParams.sort ?? 'newest') === s ? 'chip-active' : ''}`}>{s.replace('_', ' ')}</Link>
            ))}
          </div>
        </div>

        {list.data.length === 0 ? (
          <div className="card mt-10 flex flex-col items-center gap-3 p-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-2xl">🔍</span>
            <p className="text-h3">No internships match these filters</p>
            <Link href="/internships" className="btn-outline mt-1">Clear filters</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {list.data.map((i) => <InternshipCard key={i.id} i={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
