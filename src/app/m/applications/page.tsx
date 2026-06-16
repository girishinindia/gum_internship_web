'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MobileEmpty, Skeleton } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const TONE: Record<string, string> = { applied: 'bg-neutral-100 text-neutral-700', shortlisted: 'bg-primary-50 text-primary-700', interview: 'bg-primary-50 text-primary-700', offered: 'bg-success-50 text-success-700', rejected: 'bg-danger-50 text-danger-700', withdrawn: 'bg-neutral-100 text-neutral-500' };

export default function MobileApplications(): JSX.Element {
  const toast = useToast();
  const [apps, setApps] = useState<Any[] | null>(null);
  const load = async (): Promise<void> => { const { data } = await api<Any[]>('/me/applications'); setApps(data); };
  useEffect(() => { void load().catch(() => setApps([])); }, []);

  const withdraw = async (id: number): Promise<void> => {
    try { await api(`/me/applications/${id}/withdraw`, { method: 'POST' }); toast('success', 'Withdrawn.'); void load(); }
    catch { toast('danger', 'Could not withdraw.'); }
  };

  return (
    <>
      <AppBar title="My applications" />
      {!apps ? <div className="p-4"><Skeleton count={3} /></div>
      : apps.length === 0 ? <MobileEmpty title="No applications yet" body="Apply from the job board." cta={<Link href="/m/jobs" className="pill bg-primary-600 text-white">Browse jobs</Link>} />
      : (
        <div className="space-y-3 p-4">
          {apps.map((a) => (
            <div key={a.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/m/jobs/${a.jobId}`} className="line-clamp-1 font-medium text-neutral-900">{a.title}</Link>
                <span className={`pill shrink-0 capitalize ${TONE[a.status] ?? 'bg-neutral-100'}`}>{a.status}</span>
              </div>
              <p className="text-body-sm text-neutral-600">{a.company} · {a.workMode}</p>
              {!['rejected', 'withdrawn', 'offered'].includes(a.status) && (
                <button onClick={() => withdraw(a.id)} className="mt-2 text-body-sm font-medium text-danger-600">Withdraw</button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
