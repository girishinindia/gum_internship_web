import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { apiGet } from '@/lib/serverApi';
import { pageMetadata } from '@/lib/seo';
import { inr } from '@/lib/format';
import { ApiError } from '@/lib/types';
import { Markdown } from '@/components/ui/Markdown';

export const revalidate = 300;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Instructor = Record<string, any>;
interface MiniInternship {
  slug: string;
  title: string;
  pricingType: 'free' | 'paid' | 'stipend';
  price: number | string;
  deliveryMode: string;
  thumbnailUrl: string | null;
  enrollmentCount: number;
}

async function getInstructor(id: string): Promise<Instructor | null> {
  if (!/^\d+$/.test(id)) return null;
  try {
    const res = await apiGet<Instructor>(`/catalog/instructors/${id}`, { revalidate: 300 });
    return res.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const i = await getInstructor(params.id);
  if (!i) return { title: 'Instructor not found' };
  return pageMetadata({
    title: `${i.name} — mentor on GI Internship`,
    description: typeof i.bio === 'string' && i.bio ? String(i.bio).slice(0, 155) : `Internships mentored by ${i.name}.`,
    path: `/instructors/${params.id}`,
    image: i.avatarUrl ?? undefined,
  });
}

const TYPE_LABEL: Record<string, string> = { internal: 'In-house mentor', external: 'Industry mentor' };

export default async function InstructorPage({ params }: { params: { id: string } }): Promise<JSX.Element> {
  const i = await getInstructor(params.id);
  if (!i) notFound();
  const internships = (i.internships as MiniInternship[] | undefined) ?? [];

  return (
    <div className="hero-surface">
      <div className="container-page py-10 md:py-14">
        <Link href="/internships" className="text-body-sm text-neutral-500 hover:text-primary-700">‹ Back to catalog</Link>

        <header className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {i.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={i.avatarUrl} alt={i.name} className="h-24 w-24 rounded-2xl object-cover shadow-soft" />
          ) : (
            <span className="grid h-24 w-24 place-items-center rounded-2xl bg-brand-gradient text-3xl font-bold text-white shadow-glow">
              {String(i.name).slice(0, 1)}
            </span>
          )}
          <div>
            {i.instructorType && <span className="eyebrow mb-2">{TYPE_LABEL[i.instructorType] ?? i.instructorType}</span>}
            <h1 className="text-h1">{i.name}</h1>
            {Array.isArray(i.expertise) && i.expertise.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(i.expertise as string[]).map((e) => (
                  <span key={e} className="chip">{e}</span>
                ))}
              </div>
            )}
            {(i.linkedinUrl || i.websiteUrl) && (
              <div className="mt-3 flex gap-4 text-body-sm">
                {i.linkedinUrl && <a href={i.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-primary-700 hover:underline">LinkedIn ↗</a>}
                {i.websiteUrl && <a href={i.websiteUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-primary-700 hover:underline">Website ↗</a>}
              </div>
            )}
          </div>
        </header>

        {typeof i.bio === 'string' && i.bio.trim() && (
          <section className="card mt-8 max-w-3xl p-6">
            <h2 className="text-h3">About</h2>
            <div className="mt-3 text-body text-neutral-700"><Markdown>{i.bio}</Markdown></div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-h2">Internships by {i.name}</h2>
          {internships.length === 0 ? (
            <p className="mt-3 text-body text-neutral-500">No published internships yet.</p>
          ) : (
            <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {internships.map((x) => (
                <Link key={x.slug} href={`/internships/${x.slug}`} className="card card-hover group flex flex-col overflow-hidden">
                  <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary-100 to-primary-50">
                    {x.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={x.thumbnailUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <h3 className="line-clamp-2 text-h3 text-neutral-900 transition group-hover:text-primary-700">{x.title}</h3>
                    <div className="mt-auto flex items-end justify-between pt-2">
                      <span className="text-body font-semibold text-neutral-900">
                        {x.pricingType === 'free' ? 'Free' : inr(Number(x.price))}
                      </span>
                      <span className="text-caption text-neutral-500">{x.enrollmentCount} enrolled</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
