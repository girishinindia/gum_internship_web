'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { MobileEmpty, Skeleton } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function MobileBundles(): JSX.Element {
  const [bundles, setBundles] = useState<Any[] | null>(null);
  useEffect(() => { void api<Any[]>('/bundles').then(({ data }) => setBundles(data)).catch(() => setBundles([])); }, []);

  return (
    <>
      <AppBar variant="large" leading="back" backHref="/m/profile" title="Bundles" subtitle="Curated career tracks" />
      <div className="space-y-3 p-4">
        {!bundles ? <Skeleton count={3} /> : bundles.length === 0 ? <MobileEmpty title="No bundles yet" body="Curated career tracks will appear here." />
        : bundles.map((b) => (
          <Link key={b.slug} href={`/m/bundles/${b.slug}`} className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{b.name}</p>
              <span className="font-heading text-primary-700">{Number(b.price) > 0 ? inr(Number(b.price)) : 'Free'}</span>
            </div>
            {b.description && <p className="mt-1 text-body-sm text-neutral-600">{b.description}</p>}
            <p className="mt-2 text-caption text-neutral-500">{(b.internships as Any[])?.length ?? 0} internships</p>
          </Link>
        ))}
      </div>
    </>
  );
}
