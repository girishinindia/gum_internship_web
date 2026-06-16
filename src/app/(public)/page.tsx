import Link from 'next/link';
import { InternshipCard } from '@/components/features/InternshipCard';
import { apiGet } from '@/lib/serverApi';
import { pageMetadata } from '@/lib/seo';
import type { InternshipSummary } from '@/lib/types';

export const metadata = pageMetadata({
  title: 'Internships that end in real work',
  description: 'Learn by doing: weekly real-world projects, mentor reviews, live cohorts and verifiable certificates. Free and paid internships for India.',
  path: '/',
});
export const revalidate = 300;

const STEPS = [
  { icon: '🎯', title: 'Enroll', body: 'Pick a free or paid internship and join a cohort.' },
  { icon: '🛠️', title: 'Build weekly', body: 'Real project briefs, submitted as files, GitHub or live URLs.' },
  { icon: '🧑‍🏫', title: 'Get reviewed', body: 'Mentors score your work against a rubric and give feedback.' },
  { icon: '🎓', title: 'Get certified', body: 'Earn a certificate anyone can verify online.' },
];

export default async function HomePage(): Promise<JSX.Element> {
  const [internships, categories] = await Promise.all([
    apiGet<InternshipSummary[]>('/catalog/internships?sort=popular&limit=6', { revalidate: 300 }),
    apiGet<{ name: string; slug: string }[]>('/catalog/categories', { revalidate: 3600 }),
  ]);
  return (
    <>
      {/* Hero */}
      <section className="hero-surface">
        <div aria-hidden className="blob animate-floaty pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary-300" />
        <div aria-hidden className="blob animate-floaty pointer-events-none absolute -right-16 top-32 h-80 w-80 rounded-full bg-primary-200" style={{ animationDelay: '2s' }} />
        <div className="container-page relative grid items-center gap-12 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div className="space-y-6">
            <span className="eyebrow">🚀 Learn by doing</span>
            <h1 className="text-h1 md:text-display">
              Internships that end in <span className="gradient-text">real work</span>, not just videos.
            </h1>
            <p className="max-w-xl text-body-lg text-neutral-600">
              Weekly project briefs, mentor rubric reviews, live cohorts, and a certificate anyone can verify — built for students and working professionals across India.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/internships" className="btn-primary">Explore internships →</Link>
              <Link href="/verify" className="btn-outline">Verify a certificate</Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-body-sm text-neutral-500">
              <span className="flex items-center gap-1.5"><span className="text-success-600">✓</span> Free &amp; paid tracks</span>
              <span className="flex items-center gap-1.5"><span className="text-success-600">✓</span> Mentor-reviewed projects</span>
              <span className="flex items-center gap-1.5"><span className="text-success-600">✓</span> GST invoice &amp; certificate</span>
            </div>
          </div>
          {/* Floating category cards */}
          <div className="relative hidden md:block">
            <div className="grid gap-3">
              {categories.data.slice(0, 4).map((c, idx) => (
                <Link
                  key={c.slug}
                  href={`/internships?category=${c.slug}`}
                  className="card card-hover flex items-center justify-between p-4"
                  style={{ marginLeft: `${(idx % 2) * 28}px` }}
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-700">{['💻', '📱', '📊', '📣'][idx] ?? '✨'}</span>
                    <span className="font-medium text-neutral-800">{c.name}</span>
                  </span>
                  <span className="text-primary-500">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-14 md:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-3 text-h1">From enrolled to certified</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card relative p-6">
              <span className="absolute right-5 top-5 font-heading text-h2 font-bold text-neutral-100">0{i + 1}</span>
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-2xl">{s.icon}</div>
              <h3 className="text-h3">{s.title}</h3>
              <p className="mt-1.5 text-body-sm text-neutral-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular */}
      <section className="container-page pb-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="eyebrow">Trending</span>
            <h2 className="mt-3 text-h1">Popular right now</h2>
          </div>
          <Link href="/internships" className="hidden text-body-sm font-medium text-primary-700 hover:underline sm:block">View all →</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {internships.data.map((i) => <InternshipCard key={i.id} i={i} />)}
        </div>
      </section>

      {/* CTA band */}
      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-brand-gradient px-8 py-12 text-center text-white shadow-glow md:py-16">
          <div aria-hidden className="blob pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/20" />
          <h2 className="relative text-h1 text-white">Start your internship journey today</h2>
          <p className="relative mx-auto mt-2 max-w-lg text-white/85">Join a free cohort and ship your first real-world project this week.</p>
          <Link href="/internships" className="relative mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-white px-7 font-semibold text-primary-700 shadow-soft transition hover:-translate-y-0.5">
            Browse internships
          </Link>
        </div>
      </section>
    </>
  );
}
