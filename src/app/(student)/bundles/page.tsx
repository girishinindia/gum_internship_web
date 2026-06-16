'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { EmptyState, SkeletonCard } from '@/components/ui';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function BundlesPage(): JSX.Element {
  const [bundles, setBundles] = useState<Any[] | null>(null);
  useEffect(() => { void api<Any[]>('/bundles').then(({ data }) => setBundles(data)).catch(() => setBundles([])); }, []);

  return (
    <div>
      <h1 className="text-h1">Career-track bundles</h1>
      <p className="mt-1 text-body-sm text-neutral-600">Multi-internship paths at a bundle price — one purchase, several enrollments.</p>
      {!bundles ? <div className="mt-6 grid gap-4 md:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>
      : bundles.length === 0 ? <EmptyState icon="🎁" title="No bundles yet" message="Curated career tracks will appear here." />
      : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {bundles.map((b) => (
            <Link key={b.slug} href={`/bundles/${b.slug}`} className="card card-hover p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-h3">{b.name}</h2>
                <span className="font-heading text-h3 text-primary-700">{Number(b.price) > 0 ? inr(Number(b.price)) : 'Free'}</span>
              </div>
              {b.description && <p className="mt-1 text-body-sm text-neutral-600">{b.description}</p>}
              <p className="mt-3 text-caption text-neutral-500">{(b.internships as Any[])?.length ?? 0} internships</p>
              <p className="mt-2 flex flex-wrap gap-1">{(b.internships as Any[])?.slice(0, 4).map((i) => <span key={i.id} className="badge bg-neutral-100 text-neutral-600">{i.title}</span>)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
