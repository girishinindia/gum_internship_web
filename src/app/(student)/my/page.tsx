import Link from 'next/link';
import { apiGet } from '@/lib/serverApi';
import { getSessionUser } from '@/lib/session';
import { inr } from '@/lib/format';

export const metadata = { title: 'Dashboard | GI Internship' };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

async function safe<T>(path: string, fallback: T): Promise<T> {
  try { return (await apiGet<T>(path, { auth: true })).data; } catch { return fallback; }
}

export default async function DashboardPage(): Promise<JSX.Element> {
  const user = getSessionUser();
  const [enrollments, xp, certs, scholarships] = await Promise.all([
    safe<Any[]>('/enrollments/me', []),
    safe<Any>('/me/xp', { xp: 0, level: 1, currentStreak: 0, badges: [] }),
    safe<Any[]>('/certificates/me', []),
    safe<Any[]>('/me/scholarships', []),
  ]);
  const active = enrollments.filter((e) => e.status === 'active');
  const completed = enrollments.filter((e) => e.status === 'completed').length;
  const resume = active.sort((a, b) => Number(b.progressPercent) - Number(a.progressPercent))[0] ?? active[0];
  const unusedScholarships = scholarships.filter((s) => !s.used);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1">Hi {user?.name.split(' ')[0] ?? 'there'} 👋</h1>
        <p className="mt-1 text-body-sm text-neutral-600">Here&apos;s your learning at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Level" value={xp.level} hint={`${xp.xp} XP`} />
        <Stat label="Day streak" value={`${xp.currentStreak} 🔥`} />
        <Stat label="Completed" value={completed} hint="internships" />
        <Stat label="Certificates" value={certs.length} hint="earned" />
      </div>

      {/* Continue learning */}
      {resume && (
        <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-caption uppercase tracking-wide text-neutral-400">Continue learning</p>
            <h2 className="mt-1 text-h3">{resume.internship?.title}</h2>
            <div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full bg-brand-gradient" style={{ width: `${Math.round(Number(resume.progressPercent))}%` }} />
            </div>
            <p className="mt-1 text-caption text-neutral-500">{Math.round(Number(resume.progressPercent))}% complete</p>
          </div>
          <Link href={`/classroom/${resume.id}`} className="btn-primary shrink-0">Resume →</Link>
        </div>
      )}

      {/* Scholarships */}
      {unusedScholarships.length > 0 && (
        <div className="card border-primary-200 bg-primary-50/40 p-5">
          <p className="text-body-sm font-semibold text-primary-700">🎓 You have a scholarship</p>
          {unusedScholarships.map((s) => (
            <p key={s.code} className="mt-1 text-body-sm text-neutral-700">
              <strong>{s.discountType === 'percent' ? `${s.discountValue}% off` : `${inr(Number(s.discountValue))} off`}</strong>
              {s.internshipTitle ? ` on ${s.internshipTitle}` : ' (any internship)'} — code <span className="font-mono font-semibold">{s.code}</span>
              {s.eligibilityNote ? ` · ${s.eligibilityNote}` : ''}
            </p>
          ))}
        </div>
      )}

      {/* Enrollments */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-h2">My internships</h2>
          <Link href="/internships" className="text-body-sm font-medium text-primary-700 hover:underline">Explore more →</Link>
        </div>
        {enrollments.length === 0 ? (
          <div className="card mt-4 flex flex-col items-center gap-3 p-12 text-center">
            <p className="text-h3">Nothing here yet</p>
            <p className="text-neutral-600">Find an internship and start building real work.</p>
            <Link href="/internships" className="btn-primary">Explore internships</Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((e) => {
              const pct = Math.round(Number(e.progressPercent));
              return (
                <div key={e.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`badge ${e.status === 'active' ? 'bg-success-50 text-success-700' : e.status === 'completed' ? 'bg-primary-50 text-primary-700' : 'bg-neutral-100 text-neutral-700'}`}>{e.status}</span>
                      <h3 className="mt-2 line-clamp-2 text-h3">{e.internship?.title}</h3>
                      {e.batch && <p className="mt-1 text-body-sm text-neutral-600">{e.batch.name}</p>}
                    </div>
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-50 text-body-sm font-semibold text-primary-700">{pct}%</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/classroom/${e.id}`} className="btn-primary !h-10 flex-1 text-body-sm">Continue learning</Link>
                    {e.offerLetterNo && <span className="badge self-center bg-warning-50 text-warning-700">Offer ✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }): JSX.Element {
  return (
    <div className="card p-4">
      <p className="text-caption uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-h2 text-neutral-900">{value}</p>
      {hint && <p className="text-caption text-neutral-400">{hint}</p>}
    </div>
  );
}
