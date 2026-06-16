import { InternshipCard } from '@/components/features/InternshipCard';
import { CatalogFilters } from '@/components/features/CatalogFilters';
import { CatalogSort } from '@/components/features/CatalogSort';
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

const FILTERS = ['category', 'pricingType', 'deliveryMode', 'level', 'durationWeeks', 'language', 'q', 'sort', 'page'] as const;
const PER_PAGE = 12;

/** Filters live in URL search params → links are shareable (SEO + UX). */
export default async function CatalogPage({ searchParams }: { searchParams: Record<string, string | undefined> }): Promise<JSX.Element> {
  const qs = new URLSearchParams();
  for (const k of FILTERS) if (searchParams[k]) qs.set(k, searchParams[k] as string);
  qs.set('limit', String(PER_PAGE));
  const [list, categories] = await Promise.all([
    apiGet<InternshipSummary[]>(`/catalog/internships?${qs.toString()}`, { revalidate: 60 }),
    apiGet<{ name: string; slug: string }[]>('/catalog/categories', { revalidate: 3600 }),
  ]);
  const pg = list.meta?.pagination;
  const total = pg?.total ?? list.data.length;
  const page = pg?.page ?? 1;
  const totalPages = pg?.totalPages ?? 1;

  const pageLink = (p: number): string => {
    const next = new URLSearchParams();
    for (const k of FILTERS) if (searchParams[k] && k !== 'page') next.set(k, searchParams[k] as string);
    next.set('page', String(p));
    return `/internships?${next.toString()}`;
  };
  const from = Math.max(1, page - 2);
  const to = Math.min(totalPages, page + 2);
  const windowPages: number[] = [];
  for (let p = from; p <= to; p += 1) windowPages.push(p);

  return (
    <div className="hero-surface">
      <div className="container-page py-10 md:py-14">
        <span className="eyebrow">Catalog</span>
        <h1 className="mt-3 text-h1">Explore internships</h1>
        <p className="mt-1.5 text-body-lg text-neutral-500">{total} program{total === 1 ? '' : 's'} · every filter is a shareable link</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <CatalogFilters categories={categories.data} current={searchParams} />

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-body-sm text-neutral-500">{total === 0 ? 'No matches' : `Showing ${list.data.length} of ${total}`}</p>
              <CatalogSort current={searchParams} />
            </div>

            {list.data.length === 0 ? (
              <div className="card flex flex-col items-center gap-3 p-16 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-2xl">🔍</span>
                <p className="text-h3">No internships match these filters</p>
                <Link href="/internships" className="btn-outline mt-1">Clear filters</Link>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {list.data.map((i) => <InternshipCard key={i.id} i={i} />)}
                </div>

                {totalPages > 1 && (
                  <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
                    {page > 1 && <Link href={pageLink(page - 1)} className="chip">← Prev</Link>}
                    {from > 1 && (
                      <>
                        <Link href={pageLink(1)} className="chip">1</Link>
                        {from > 2 && <span className="px-1 text-neutral-400">…</span>}
                      </>
                    )}
                    {windowPages.map((p) => (
                      <Link key={p} href={pageLink(p)} className={`chip ${p === page ? 'chip-active' : ''}`}>{p}</Link>
                    ))}
                    {to < totalPages && (
                      <>
                        {to < totalPages - 1 && <span className="px-1 text-neutral-400">…</span>}
                        <Link href={pageLink(totalPages)} className="chip">{totalPages}</Link>
                      </>
                    )}
                    {page < totalPages && <Link href={pageLink(page + 1)} className="chip">Next →</Link>}
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
