import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { apiGet } from '@/lib/serverApi';
import { pageMetadata } from '@/lib/seo';
import { inr, MODE_LABEL } from '@/lib/format';
import { ApiError } from '@/lib/types';
import { getSessionUser } from '@/lib/session';
import { EnrollCTA } from '@/components/features/EnrollCTA';

export const revalidate = 300;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Detail = Record<string, any>;

async function getDetail(slug: string): Promise<Detail | null> {
  try {
    const res = await apiGet<Detail>(`/catalog/internships/${slug}`, { revalidate: 300 });
    return res.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const d = await getDetail(params.slug);
  if (!d) return { title: 'Internship not found' };
  return pageMetadata({
    title: `${d.title} — ${d.pricingType === 'free' ? 'Free' : 'Paid'} ${d.category.name} internship`,
    description: d.shortDescription ?? d.title,
    path: `/internships/${d.slug}`,
    image: d.thumbnailUrl,
  });
}

export default async function InternshipDetailPage({ params }: { params: { slug: string } }): Promise<JSX.Element> {
  const d = await getDetail(params.slug);
  if (!d) notFound();
  const loggedIn = getSessionUser() !== null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: d.title,
    description: d.shortDescription ?? d.title,
    provider: { '@type': 'Organization', name: 'GUM Internships' },
    offers: {
      '@type': 'Offer',
      price: d.pricingType === 'free' ? 0 : d.totalWithGst,
      priceCurrency: 'INR',
      availability: (d.upcomingBatches as Detail[]).some((b) => b.seatsLeft > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
    },
    hasCourseInstance: (d.upcomingBatches as Detail[]).map((b) => ({
      '@type': 'CourseInstance',
      courseMode: d.deliveryMode === 'recorded' ? 'online' : 'blended',
      startDate: b.startDate,
      endDate: b.endDate,
    })),
  };

  const lessonsCount = (d.curriculum as Detail[]).reduce((s, sec) => s + sec.lessons.length, 0);
  const firstBatch = (d.upcomingBatches as Detail[])[0];

  const EnrollPanel = ({ compact }: { compact?: boolean }): JSX.Element => (
    <div className={compact ? 'flex items-center justify-between gap-3' : 'space-y-4'}>
      <div>
        {d.pricingType === 'free' ? (
          <p className="font-heading text-h2 text-success-700">FREE</p>
        ) : (
          <p className="font-heading text-h2">
            {inr(d.totalWithGst)}
            <span className="ml-2 align-middle text-caption font-normal text-neutral-500">incl. {d.gstRate}% GST</span>
          </p>
        )}
        {firstBatch && !compact && (
          <p className="mt-1 text-body-sm text-neutral-700">
            Next cohort: {firstBatch.name} · starts {firstBatch.startDate}
            {firstBatch.seatsLeft <= 10 && (
              <span className="ml-2 font-medium text-warning-700">Only {firstBatch.seatsLeft} seats left</span>
            )}
          </p>
        )}
      </div>
      <EnrollCTA
        internshipId={d.id}
        slug={d.slug}
        pricingType={d.pricingType}
        paceType={d.paceType}
        batches={(d.upcomingBatches as Detail[]).map((b) => ({ id: b.id, name: b.name, startDate: b.startDate, seatsLeft: b.seatsLeft }))}
        loggedIn={loggedIn}
        compact={compact}
      />
      {!compact && (
        <p className="text-caption text-neutral-500">🔒 Razorpay secure · GST invoice · verifiable certificate</p>
      )}
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* MOBILE ORDER: hero/CTA first, curriculum second. DESKTOP: 2-col with sticky enroll card. */}
      <section className="hero-surface">
        <div className="container-page grid gap-8 py-8 md:grid-cols-3 md:py-12">
          <div className="space-y-4 md:col-span-2">
            <div className="flex flex-wrap gap-2">
              <span className="badge bg-primary-50 text-primary-700">{d.category.name}</span>
              <span className={`badge ${d.deliveryMode === 'live' ? 'bg-danger-50 text-danger-700' : 'bg-white text-neutral-700 border border-neutral-300'}`}>
                {MODE_LABEL[d.deliveryMode] ?? d.deliveryMode}
              </span>
              {d.level && <span className="badge border border-neutral-300 bg-white text-neutral-700">{d.level}</span>}
            </div>
            <h1 className="text-h1">{d.title}</h1>
            <p className="max-w-2xl text-body-lg text-neutral-700">{d.shortDescription}</p>
            <p className="text-body-sm text-neutral-700">
              ⏱ {d.durationWeeks ? `${d.durationWeeks} weeks` : 'Self-paced'} · 🗣 {(d.languages as string[]).join(', ')} · 🎓 certificate included · {d.enrollmentCount} enrolled
            </p>
            <p className="text-body-sm font-medium text-neutral-800">
              Mentor:{' '}
              <Link href={`/instructors/${d.instructor.id}`} className="text-primary-700 hover:underline">
                {d.instructor.name}
              </Link>
            </p>
          </div>

          {/* Desktop sticky enroll card */}
          <aside className="hidden md:block">
            <div className="card sticky top-24 space-y-4 p-5 shadow-e2">
              {d.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.thumbnailUrl} alt="" className="aspect-video w-full rounded-md object-cover" />
              )}
              <EnrollPanel />
            </div>
          </aside>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 md:grid-cols-3">
        <div className="space-y-10 md:col-span-2">
          <section>
            <h2 className="text-h2">What you&apos;ll learn</h2>
            <ul className="mt-4 grid gap-2 md:grid-cols-2">
              {(d.outcomes as string[]).map((o) => (
                <li key={o} className="flex gap-2 text-neutral-800"><span className="text-success-600">✓</span>{o}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-h2">Curriculum</h2>
            <p className="mt-1 text-body-sm text-neutral-600">{(d.curriculum as Detail[]).length} sections · {lessonsCount} lessons</p>
            <div className="mt-4 space-y-3">
              {(d.curriculum as Detail[]).map((sec) => (
                <details key={sec.id} className="card group p-0" open={(d.curriculum as Detail[])[0]?.id === sec.id}>
                  <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-medium">
                    {sec.title}
                    <span className="text-neutral-500 transition group-open:rotate-180">▾</span>
                  </summary>
                  <ul className="border-t border-neutral-200">
                    {(sec.lessons as Detail[]).map((l) => (
                      <li key={l.id} className="flex items-center justify-between px-4 py-2.5 text-body-sm">
                        <span className="flex items-center gap-2 text-neutral-800">
                          <span aria-hidden>{l.type === 'video' ? '▶' : l.type === 'live' ? '◉' : l.type === 'quiz' ? '?' : '🗎'}</span>
                          {l.title}
                        </span>
                        <span className="text-neutral-500">
                          {l.isPreview ? <span className="font-medium text-primary-700">Preview</span> : l.durationMinutes ? `${l.durationMinutes} min` : '🔒'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-h2">Upcoming batches</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(d.upcomingBatches as Detail[]).map((b) => (
                <div key={b.id} className="card p-4">
                  <p className="font-medium">{b.name}</p>
                  <p className="mt-1 text-body-sm text-neutral-700">{b.startDate} → {b.endDate}</p>
                  <p className={`mt-2 text-body-sm font-medium ${b.seatsLeft <= 10 ? 'text-warning-700' : 'text-success-700'}`}>
                    {b.seatsLeft > 0 ? `${b.seatsLeft} of ${b.seatsTotal} seats left` : b.waitlistEnabled ? 'Waitlist open' : 'Batch full'}
                  </p>
                </div>
              ))}
              {(d.upcomingBatches as Detail[]).length === 0 && (
                <p className="text-neutral-600">New cohort announcing soon.</p>
              )}
            </div>
          </section>

          {(d.faqs as Detail[]).length > 0 && (
            <section>
              <h2 className="text-h2">FAQs</h2>
              <div className="mt-4 space-y-3">
                {(d.faqs as { q: string; a: string }[]).map((f) => (
                  <details key={f.q} className="card p-4">
                    <summary className="cursor-pointer list-none font-medium">{f.q}</summary>
                    <p className="mt-2 text-neutral-700">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-h2">Your mentor</h2>
            <div className="card mt-4 flex gap-4 p-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-50 font-heading text-h3 text-primary-700">
                {String(d.instructor.name).slice(0, 1)}
              </div>
              <div>
                <p className="font-heading text-h3">{d.instructor.name}</p>
                <p className="mt-1 text-body-sm text-neutral-700">{d.instructor.bio}</p>
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {(d.instructor.expertise as string[]).map((e) => (
                    <span key={e} className="badge bg-neutral-100 text-neutral-700">{e}</span>
                  ))}
                </p>
              </div>
            </div>
          </section>
        </div>
        <div className="hidden md:block" />
      </div>

      {/* MOBILE sticky bottom CTA bar (replaces the desktop card) */}
      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-neutral-200 bg-white p-3 shadow-e2 md:hidden">
        <EnrollPanel compact />
      </div>
    </>
  );
}
