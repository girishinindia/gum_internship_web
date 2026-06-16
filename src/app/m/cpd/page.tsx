'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MobileEmpty, Skeleton } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function MobileCpd(): JSX.Element {
  const [data, setData] = useState<Any | null>(null);
  useEffect(() => { void api<Any>('/me/cpd').then(({ data: d }) => setData(d)).catch(() => setData({ totalHours: 0, entries: [] })); }, []);

  return (
    <>
      <AppBar variant="large" leading="back" backHref="/m/profile" title="CPD hours" subtitle="Continuing professional development" />
      <div className="p-4">
        {!data ? <Skeleton count={3} /> : (
          <>
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
              <p className="text-caption uppercase tracking-wide text-neutral-500">Total certified hours</p>
              <p className="mt-1 text-h1 text-primary-700">{data.totalHours}</p>
            </div>
            {(data.entries as Any[]).length === 0 ? <div className="mt-4"><MobileEmpty title="No CPD hours yet" body="Earn a certificate to start logging hours." /></div>
            : (
              <div className="mt-4 space-y-2">
                {(data.entries as Any[]).map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3">
                    <div><p className="font-medium">{e.internshipTitle}</p>{e.note && <p className="text-caption text-neutral-500">{e.note}</p>}</div>
                    <span className="font-semibold text-neutral-700">{e.hours} hrs</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
