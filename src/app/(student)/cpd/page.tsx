'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { EmptyState, SkeletonCard } from '@/components/ui';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function CpdPage(): JSX.Element {
  const [data, setData] = useState<Any | null>(null);
  useEffect(() => { void api<Any>('/me/cpd').then(({ data: d }) => setData(d)).catch(() => setData({ totalHours: 0, entries: [] })); }, []);

  if (!data) return <div className="space-y-4"><h1 className="text-h1">CPD hours</h1><SkeletonCard /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-h1">CPD hours</h1>
      <p className="mt-1 text-body-sm text-neutral-600">Certified professional-development hours, logged automatically when you complete a certificate.</p>

      <div className="card mt-6 p-6 text-center">
        <p className="text-caption uppercase tracking-wide text-neutral-500">Total certified hours</p>
        <p className="mt-1 text-h1 text-primary-700">{data.totalHours}</p>
      </div>

      {(data.entries as Any[]).length === 0 ? (
        <EmptyState icon="⏱️" title="No CPD hours yet" message="Earn a certificate to start logging certified hours." />
      ) : (
        <ul className="mt-6 space-y-2">
          {(data.entries as Any[]).map((e) => (
            <li key={e.id} className="card flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-neutral-800">{e.internshipTitle}</p>
                {e.note && <p className="text-caption text-neutral-500">{e.note}</p>}
              </div>
              <span className="text-body font-semibold text-neutral-700">{e.hours} hrs</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
