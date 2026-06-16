'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { Badge, EmptyState, Pagination, SkeletonCard } from '@/components/ui';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const MODES = ['', 'remote', 'onsite', 'hybrid'];

function stipend(j: Any): string {
  if (!j.stipendMin && !j.stipendMax) return 'Unpaid / TBD';
  if (j.stipendMin && j.stipendMax) return `${inr(Number(j.stipendMin))}–${inr(Number(j.stipendMax))}`;
  return inr(Number(j.stipendMin ?? j.stipendMax));
}

export default function JobsPage(): JSX.Element {
  const [jobs, setJobs] = useState<Any[] | null>(null);
  const [q, setQ] = useState('');
  const [mode, setMode] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (): Promise<void> => {
    setJobs(null);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (q) params.set('q', q);
    if (mode) params.set('workMode', mode);
    const { data, meta } = await api<Any[]>(`/jobs?${params.toString()}`);
    setJobs(data);
    setTotalPages((meta as Any)?.pagination?.totalPages ?? 1);
  };
  useEffect(() => { void load().catch(() => setJobs([])); }, [page, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1 className="text-h1">Job board</h1>
      <p className="mt-1 text-body-sm text-neutral-600">Roles from verified employers — apply with your GI portfolio in one click.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); void load(); }} className="flex flex-1 gap-2">
          <input className="input" placeholder="Search role or company…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-outline !h-11 px-4 text-body-sm">Search</button>
        </form>
        <div className="flex gap-1">
          {MODES.map((m) => (
            <button key={m || 'all'} onClick={() => { setMode(m); setPage(1); }} className={`chip capitalize ${mode === m ? 'chip-active' : ''}`}>{m || 'All'}</button>
          ))}
        </div>
      </div>

      {!jobs ? <div className="mt-6 space-y-3"><SkeletonCard /><SkeletonCard /></div>
      : jobs.length === 0 ? <EmptyState icon="💼" title="No jobs match" message="Try a different search or work mode." />
      : (
        <ul className="mt-6 space-y-3">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/jobs/${j.id}`} className="card card-hover flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-800">{j.title}</p>
                  <p className="text-caption text-neutral-500">{j.company} · {j.location ?? 'Anywhere'}</p>
                  {(j.skills as string[])?.length > 0 && (
                    <p className="mt-1 flex flex-wrap gap-1">{(j.skills as string[]).slice(0, 5).map((s) => <span key={s} className="badge bg-neutral-100 text-neutral-600">{s}</span>)}</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge tone="primary" className="capitalize">{j.workMode}</Badge>
                  <p className="mt-1 text-body-sm font-medium text-neutral-700">{stipend(j)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
