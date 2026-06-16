import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiGet } from '@/lib/serverApi';
import { ApiError } from '@/lib/types';
import { MobileDetailClient } from '@/components/MobileDetailClient';

export const revalidate = 300;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Detail = Record<string, any>;

async function get(slug: string): Promise<Detail | null> {
  try {
    return (await apiGet<Detail>(`/catalog/internships/${slug}`, { revalidate: 300 })).data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export default async function MobileDetail({ params }: { params: { slug: string } }): Promise<JSX.Element> {
  const d = await get(params.slug);
  if (!d) notFound();
  return (
    <div className="app-screen">
      {/* Collapsing-style hero (image + overlaid title) */}
      <div className="app-body">
        <div className="relative">
          <div className="aspect-[16/10] bg-neutral-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {d.thumbnailUrl && <img src={d.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <Link href="/m" className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg shadow-e1">‹</Link>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-900/80 to-transparent p-4">
            <div className="mb-1 flex gap-2">
              <span className="pill bg-white/90 text-neutral-800">{d.category.name}</span>
              <span className={`pill ${d.deliveryMode === 'live' ? 'bg-danger-600 text-white' : 'bg-white/90 text-neutral-800'}`}>{d.deliveryMode}</span>
            </div>
            <h1 className="font-heading text-h2 text-white">{d.title}</h1>
          </div>
        </div>

        <div className="space-y-5 p-4 pb-4">
          <p className="text-neutral-700">{d.shortDescription}</p>
          <p className="text-body-sm text-neutral-600">⏱ {d.durationWeeks ?? '—'} weeks · 🗣 {(d.languages as string[]).join(', ')} · 👤 {d.instructor.name}</p>

          <section>
            <h2 className="mb-2 font-heading text-h3">What you&apos;ll learn</h2>
            <ul className="space-y-1.5">
              {(d.outcomes as string[]).map((o) => <li key={o} className="flex gap-2 text-body-sm"><span className="text-success-600">✓</span>{o}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-h3">Curriculum</h2>
            <div className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200">
              {(d.curriculum as Detail[]).map((sec) => (
                <details key={sec.id} className="group bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-medium">
                    {sec.title}<span className="text-neutral-400 transition group-open:rotate-90">›</span>
                  </summary>
                  <ul className="bg-neutral-50">
                    {(sec.lessons as Detail[]).map((l) => (
                      <li key={l.id} className="flex items-center justify-between px-4 py-2.5 text-body-sm">
                        <span>{l.type === 'video' ? '▶' : l.type === 'live' ? '◉' : l.type === 'quiz' ? '?' : '🗎'} {l.title}</span>
                        <span className="text-neutral-500">{l.isPreview ? 'Preview' : l.durationMinutes ? `${l.durationMinutes}m` : '🔒'}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Sticky bottom CTA + batch/checkout bottom sheet */}
      <MobileDetailClient
        slug={d.slug}
        internshipId={d.id}
        pricingType={d.pricingType}
        totalWithGst={d.totalWithGst}
        gstRate={d.gstRate}
        batches={d.upcomingBatches}
      />
    </div>
  );
}
