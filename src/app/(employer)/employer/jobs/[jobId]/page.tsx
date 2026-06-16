'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Avatar, StatusBadge, Select, EmptyState, SkeletonCard } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const STAGES = ['applied', 'shortlisted', 'interview', 'offered', 'rejected'];

export default function ApplicantsPage(): JSX.Element {
  const { jobId } = useParams<{ jobId: string }>();
  const jid = Number(jobId);
  const toast = useToast();
  const [apps, setApps] = useState<Any[] | null>(null);

  const load = async (): Promise<void> => { const { data } = await api<Any[]>(`/employer/jobs/${jid}/applicants`); setApps(data); };
  useEffect(() => { void load().catch(() => setApps([])); }, [jid]);

  const setStatus = async (appId: number, status: string): Promise<void> => {
    try {
      await api(`/employer/applications/${appId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setApps((prev) => prev?.map((a) => (a.id === appId ? { ...a, status } : a)) ?? prev);
    } catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not update.'); }
  };

  if (!apps) return <div className="space-y-4"><h1 className="text-h1">Applicants</h1><SkeletonCard /></div>;

  return (
    <div>
      <Link href="/employer/jobs" className="text-body-sm text-neutral-500 hover:text-neutral-800">‹ Jobs</Link>
      <h1 className="mt-2 text-h1">Applicants</h1>
      {apps.length === 0 ? (
        <EmptyState icon="📭" title="No applicants yet" message="Applications appear here as candidates apply." />
      ) : (
        <ul className="mt-6 space-y-3">
          {apps.map((a) => (
            <li key={a.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={a.applicant} size="md" />
                  <div>
                    <p className="font-medium text-neutral-800">{a.applicant}</p>
                    <p className="text-caption text-neutral-500">{a.email} · applied {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  <Select label="" value={a.status} onChange={(e) => setStatus(a.id, e.target.value)} className="!h-9 w-auto py-0 text-body-sm">
                    {STAGES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </Select>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-body-sm">
                {a.portfolioHandle && <a href={`/u/${a.portfolioHandle}`} target="_blank" rel="noopener" className="text-primary-700 hover:underline">Portfolio ↗</a>}
                {a.resumeUrl && <a href={a.resumeUrl} target="_blank" rel="noopener" className="text-primary-700 hover:underline">Resume ↗</a>}
              </div>
              {a.coverNote && <p className="mt-2 rounded-xl bg-neutral-50 p-3 text-body-sm text-neutral-700">{a.coverNote}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
