import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiGet } from '@/lib/serverApi';
import { pageMetadata } from '@/lib/seo';
import { ApiError } from '@/lib/types';

export const revalidate = 120;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Wallet = Record<string, any>;

async function loadWallet(handle: string): Promise<Wallet | null> {
  try {
    const { data } = await apiGet<Wallet>(`/p/${encodeURIComponent(handle)}`, { revalidate: 120 });
    return data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: { handle: string } }): Promise<ReturnType<typeof pageMetadata>> {
  const w = await loadWallet(params.handle);
  if (!w) return pageMetadata({ title: 'Profile not found', description: 'This profile is unavailable.', path: `/u/${params.handle}` });
  return pageMetadata({
    title: `${w.fullName} — verified credentials`,
    description: w.headline ?? `${w.fullName}'s verified internships and certificates on GI Internship.`,
    path: `/u/${params.handle}`,
    image: w.avatarUrl,
  });
}

export default async function WalletPage({ params }: { params: { handle: string } }): Promise<JSX.Element> {
  const w = await loadWallet(params.handle);
  if (!w) notFound();

  const initials = String(w.fullName)
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="container-page py-10">
      {/* Header card */}
      <div className="card overflow-hidden shadow-e1">
        <div className="h-24 bg-brand-gradient" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            {w.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={w.avatarUrl} alt={w.fullName} className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-e1" />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-white bg-primary-600 text-h2 font-semibold text-white shadow-e1">
                {initials}
              </div>
            )}
            <div className="pb-1">
              <h1 className="text-h2">{w.fullName}</h1>
              {w.headline && <p className="text-body-sm text-neutral-600">{w.headline}</p>}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-neutral-600">
            {w.track && <span>🎯 {w.track}</span>}
            {w.location && <span>📍 {w.location}</span>}
            {w.contact?.email && <a href={`mailto:${w.contact.email}`} className="text-primary-700 hover:underline">✉ {w.contact.email}</a>}
          </div>

          {w.bio && <p className="mt-4 max-w-2xl text-body text-neutral-700">{w.bio}</p>}

          {/* Links */}
          {w.links && Object.keys(w.links).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(w.links as Record<string, string>).map(([k, url]) => (
                <a key={k} href={url} target="_blank" rel="noopener noreferrer nofollow"
                   className="badge bg-neutral-100 capitalize text-neutral-700 hover:bg-neutral-200">{k} ↗</a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Internships" value={w.stats.completedInternships} />
        <Stat label="Certificates" value={w.stats.certificates} />
        <Stat label="Projects shipped" value={w.stats.projectsShipped} />
        <Stat label="Avg score" value={w.stats.averageScore ?? '—'} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Certificates */}
        {w.certificates.length > 0 && (
          <section className="card p-6">
            <h2 className="text-h3">Verified certificates</h2>
            <ul className="mt-4 space-y-3">
              {w.certificates.map((c: Wallet) => (
                <li key={c.certificateNo} className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-neutral-800">{c.internshipTitle}</p>
                    <p className="text-caption text-neutral-500">
                      {c.grade ? `Grade ${c.grade} · ` : ''}{c.certificateNo} · {new Date(c.issuedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <Link href={`/verify/${c.certificateNo}`} className="badge shrink-0 bg-success-50 text-success-700 hover:bg-success-100">Verify ✓</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Completed internships */}
        {w.completedInternships.length > 0 && (
          <section className="card p-6">
            <h2 className="text-h3">Completed internships</h2>
            <ul className="mt-4 space-y-3">
              {w.completedInternships.map((i: Wallet) => (
                <li key={i.internshipId} className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                  <Link href={`/internships/${i.slug}`} className="font-medium text-neutral-800 hover:text-primary-700">{i.title}</Link>
                  <p className="text-caption text-neutral-500">
                    {[i.category, i.level, i.durationWeeks ? `${i.durationWeeks} weeks` : null, i.projectScore !== null ? `score ${i.projectScore}` : null].filter(Boolean).join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {w.certificates.length === 0 && w.completedInternships.length === 0 && (
        <div className="card mt-6 p-10 text-center text-neutral-600">
          This learner hasn’t made any achievements public yet.
        </div>
      )}

      <p className="mt-8 text-center text-caption text-neutral-400">
        Credentials verified against GI Internship records · <Link href="/" className="hover:underline">grow up more</Link>
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }): JSX.Element {
  return (
    <div className="card p-4 text-center">
      <p className="text-h2 text-primary-700">{value}</p>
      <p className="text-caption text-neutral-500">{label}</p>
    </div>
  );
}
