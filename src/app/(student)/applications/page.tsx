'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatusBadge, Button, EmptyState, SkeletonCard } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function ApplicationsPage(): JSX.Element {
  const toast = useToast();
  const [apps, setApps] = useState<Any[] | null>(null);

  const load = async (): Promise<void> => { const { data } = await api<Any[]>('/me/applications'); setApps(data); };
  useEffect(() => { void load().catch(() => setApps([])); }, []);

  const withdraw = async (id: number): Promise<void> => {
    try { await api(`/me/applications/${id}/withdraw`, { method: 'POST' }); toast('success', 'Application withdrawn.'); void load(); }
    catch { toast('danger', 'Could not withdraw.'); }
  };

  if (!apps) return <div className="space-y-4"><h1 className="text-h1">My applications</h1><SkeletonCard /></div>;

  return (
    <div>
      <h1 className="text-h1">My applications</h1>
      {apps.length === 0 ? (
        <EmptyState icon="📨" title="No applications yet" message="Apply to roles on the job board with your portfolio." action={<Link href="/jobs" className="btn-primary">Browse jobs</Link>} />
      ) : (
        <ul className="mt-6 space-y-3">
          {apps.map((a) => (
            <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2"><span className="font-medium text-neutral-800">{a.title}</span><StatusBadge status={a.status} /></div>
                <p className="text-caption text-neutral-500">{a.company} · {a.workMode} · applied {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/jobs/${a.jobId}`} className="text-body-sm text-primary-700 hover:underline">View job</Link>
                {!['rejected', 'withdrawn', 'offered'].includes(a.status) && <Button size="sm" variant="ghost" onClick={() => withdraw(a.id)}>Withdraw</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
