'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { StatCard, StatusBadge, Tabs, EmptyState, SkeletonCard, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function EarningsPage(): JSX.Element {
  const toast = useToast();
  const [summary, setSummary] = useState<Any | null>(null);
  const [ledger, setLedger] = useState<Any[] | null>(null);
  const [payouts, setPayouts] = useState<Any[] | null>(null);

  useEffect(() => {
    void api<Any>('/instructor/earnings/summary').then(({ data }) => setSummary(data)).catch(() => setSummary({}));
    void api<Any[]>('/instructor/earnings?limit=50').then(({ data }) => setLedger(data)).catch(() => setLedger([]));
    void api<Any[]>('/instructor/payouts?limit=50').then(({ data }) => setPayouts(data)).catch(() => setPayouts([]));
  }, []);

  const statement = async (id: number): Promise<void> => {
    try { const { data } = await api<{ url: string }>(`/instructor/payouts/${id}/statement`); window.open(data.url, '_blank', 'noopener'); }
    catch { toast('info', 'Statement not ready yet.'); }
  };

  const Ledger = (
    !ledger ? <SkeletonCard /> : ledger.length === 0 ? <EmptyState icon="📒" title="No earnings yet" message="Earnings appear when learners pay for your internships." />
    : (
      <div className="space-y-2">
        {ledger.map((e) => (
          <div key={e.id} className="card flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-neutral-800">{e.internshipTitle}</p>
              <p className="text-caption text-neutral-500">{e.orderNo} · {e.sharePercent}% of {inr(e.grossAmount)} · {new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${e.amount < 0 ? 'text-danger-700' : 'text-neutral-800'}`}>{inr(e.amount)}</p>
              <StatusBadge status={e.status} />
            </div>
          </div>
        ))}
      </div>
    )
  );

  const Payouts = (
    !payouts ? <SkeletonCard /> : payouts.length === 0 ? <EmptyState icon="🏦" title="No payouts yet" message="Settlements show here once finance processes them." />
    : (
      <div className="space-y-2">
        {payouts.map((p) => (
          <div key={p.id} className="card flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-neutral-800">{p.settlementNo ?? `Settlement #${p.id}`}</p>
              <p className="text-caption text-neutral-500">{new Date(p.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{inr(Number(p.netAmount ?? p.amount ?? 0))}</span>
              <StatusBadge status={p.status} />
              <Button size="sm" variant="ghost" onClick={() => statement(p.id)}>Statement</Button>
            </div>
          </div>
        ))}
      </div>
    )
  );

  return (
    <div>
      <h1 className="text-h1">Earnings</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Available" value={inr(Number(summary?.available ?? 0))} />
        <StatCard label="Pending" value={inr(Number(summary?.pending ?? 0))} />
        <StatCard label="Paid out" value={inr(Number(summary?.settled ?? summary?.paid ?? 0))} />
        <StatCard label="Lifetime" value={inr(Number(summary?.lifetime ?? 0))} />
      </div>
      <div className="mt-6">
        <Tabs tabs={[{ key: 'ledger', label: 'Earnings', content: Ledger }, { key: 'payouts', label: 'Payouts', content: Payouts }]} />
      </div>
    </div>
  );
}
