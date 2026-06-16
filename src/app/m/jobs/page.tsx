'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { MobileEmpty, Skeleton } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';
import { Icon } from '@/components/mobile/Icon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const MODES = ['', 'remote', 'onsite', 'hybrid'];

function stipend(j: Any): string {
  if (!j.stipendMin && !j.stipendMax) return 'Unpaid / TBD';
  if (j.stipendMin && j.stipendMax) return `${inr(Number(j.stipendMin))}–${inr(Number(j.stipendMax))}`;
  return inr(Number(j.stipendMin ?? j.stipendMax));
}

export default function MobileJobs(): JSX.Element {
  const [jobs, setJobs] = useState<Any[] | null>(null);
  const [q, setQ] = useState('');
  const [mode, setMode] = useState('');

  const load = async (): Promise<void> => {
    setJobs(null);
    const p = new URLSearchParams({ limit: '30' });
    if (q) p.set('q', q); if (mode) p.set('workMode', mode);
    const { data } = await api<Any[]>(`/jobs?${p}`);
    setJobs(data);
  };
  useEffect(() => { void load().catch(() => setJobs([])); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <AppBar title="Jobs" actions={[{ icon: 'receipt', label: 'My applications', href: '/m/applications' }]} />
      <div className="space-y-3 p-4">
        <form onSubmit={(e) => { e.preventDefault(); void load(); }} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3">
          <Icon name="search" size={18} className="text-neutral-400" />
          <input className="h-11 flex-1 bg-transparent text-body-sm outline-none" placeholder="Search role or company" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {MODES.map((m) => <button key={m || 'all'} onClick={() => setMode(m)} className={`pill shrink-0 capitalize ${mode === m ? 'bg-primary-600 text-white' : 'border border-neutral-300 bg-white text-neutral-700'}`}>{m || 'All'}</button>)}
        </div>
        {!jobs ? <Skeleton count={4} />
        : jobs.length === 0 ? <MobileEmpty title="No jobs match" body="Try a different search or mode." />
        : jobs.map((j) => (
          <Link key={j.id} href={`/m/jobs/${j.id}`} className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft active:scale-[0.99]">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-1 font-medium text-neutral-900">{j.title}</p>
              <span className="pill shrink-0 bg-primary-50 capitalize text-primary-700">{j.workMode}</span>
            </div>
            <p className="text-body-sm text-neutral-600">{j.company} · {j.location ?? 'Anywhere'}</p>
            <p className="mt-1 text-body-sm font-medium text-neutral-700">{stipend(j)}</p>
            {(j.skills as string[])?.length > 0 && <p className="mt-2 flex flex-wrap gap-1">{(j.skills as string[]).slice(0, 4).map((s) => <span key={s} className="pill bg-neutral-100 text-neutral-600">{s}</span>)}</p>}
          </Link>
        ))}
      </div>
    </>
  );
}
