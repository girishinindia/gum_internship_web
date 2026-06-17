'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge, EmptyState, SkeletonCard } from '@/components/ui';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const TONE: Record<string, 'neutral' | 'warning' | 'success' | 'danger'> = {
  draft: 'neutral', pending_review: 'warning', published: 'success', rejected: 'danger', archived: 'neutral',
};

export default function InstructorInternshipsPage(): JSX.Element {
  const [items, setItems] = useState<Any[] | null>(null);

  useEffect(() => {
    void api<Any[]>('/internships?limit=100')
      .then((r) => setItems(r.data))
      .catch(() => setItems([]));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1">My internships</h1>
          <p className="mt-1 text-body-sm text-neutral-600">Create programs, build the curriculum, run cohorts and schedule live sessions.</p>
        </div>
        <Link href="/instructor/internships/new" className="btn-primary px-4">+ New internship</Link>
      </div>

      <div className="mt-6 space-y-3">
        {!items ? <SkeletonCard />
        : items.length === 0 ? (
          <EmptyState icon="📚" title="No internships yet" message="Create your first internship to start building its curriculum and cohorts." />
        ) : items.map((i) => (
          <Link key={i.id} href={`/instructor/internships/${i.id}`} className="card card-hover flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-heading text-h3">{i.title}</p>
              <p className="text-body-sm text-neutral-500">
                {i.categoryName ?? i.category?.name} · {i.paceType === 'batch' ? 'Cohort' : 'Self-paced'} · {i.pricingType === 'free' ? 'Free' : i.pricingType}
                {' · '}{i.sectionCount ?? 0} sections · {i.lessonCount ?? 0} lessons · {i.enrollmentCount ?? 0} enrolled
              </p>
            </div>
            <Badge tone={TONE[i.status] ?? 'neutral'}>{String(i.status).replace('_', ' ')}</Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
