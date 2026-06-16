'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Params = Record<string, string | undefined>;
const KEYS = ['category', 'pricingType', 'deliveryMode', 'level', 'durationWeeks', 'language', 'q', 'sort'] as const;

const PRICING: [string, string][] = [['', 'All'], ['free', 'Free'], ['paid', 'Paid'], ['stipend', 'Stipend']];
const DELIVERY: [string, string][] = [['', 'All'], ['recorded', 'Recorded'], ['live', 'Live'], ['hybrid', 'Hybrid'], ['project_only', 'Project-only']];
const LEVEL: [string, string][] = [['', 'All'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']];
const DURATION: [string, string][] = [['', 'Any'], ['4', '≤ 4 weeks'], ['8', '≤ 8 weeks'], ['12', '≤ 12 weeks'], ['24', '≤ 24 weeks']];
const LANGUAGE: [string, string][] = [['', 'Any'], ['english', 'English'], ['hindi', 'Hindi']];

/** Sticky catalog filters. URL-driven (shareable), server re-renders on change. */
export function CatalogFilters({ categories, current }: { categories: { name: string; slug: string }[]; current: Params }): JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(current.q ?? '');

  const buildUrl = (updates: Record<string, string>): string => {
    const next = new URLSearchParams();
    for (const k of KEYS) { const v = current[k]; if (v) next.set(k, v); } // keep sort, drop page
    for (const [k, v] of Object.entries(updates)) { if (v) next.set(k, v); else next.delete(k); }
    const s = next.toString();
    return `/internships${s ? `?${s}` : ''}`;
  };
  const go = (updates: Record<string, string>): void => { router.push(buildUrl(updates)); };

  const activeCount = ['category', 'pricingType', 'deliveryMode', 'level', 'durationWeeks', 'language', 'q'].filter((k) => current[k]).length;

  const Group = ({ label, k, options }: { label: string; k: string; options: [string, string][] }): JSX.Element => (
    <div>
      <p className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="space-y-0.5">
        {options.map(([val, lbl]) => {
          const active = (current[k] ?? '') === val;
          return (
            <button key={val || 'all'} onClick={() => go({ [k]: val })}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-body-sm transition ${active ? 'bg-primary-50 font-medium text-primary-700' : 'text-neutral-700 hover:bg-neutral-100'}`}>
              <span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border ${active ? 'border-primary-600 bg-primary-600' : 'border-neutral-300'}`}>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <button onClick={() => setOpen((v) => !v)}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium lg:hidden">
        <span>Filters{activeCount > 0 ? ` · ${activeCount}` : ''}</span>
        <span className={`transition ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      <div className={`${open ? 'block' : 'hidden'} space-y-5 rounded-2xl border border-neutral-200 bg-white p-4 lg:block`}>
        <form onSubmit={(e) => { e.preventDefault(); go({ q: q.trim().length >= 2 ? q.trim() : '' }); }}>
          <p className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-neutral-500">Search</p>
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3">
            <span className="text-neutral-400">🔍</span>
            <input className="h-10 flex-1 bg-transparent text-body-sm outline-none" placeholder="Title, skill…" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <button type="button" onClick={() => { setQ(''); go({ q: '' }); }} className="text-neutral-400 hover:text-neutral-700">✕</button>}
          </div>
        </form>

        <Group label="Category" k="category" options={[['', 'All categories'], ...categories.map((c) => [c.slug, c.name] as [string, string])]} />
        <Group label="Pricing" k="pricingType" options={PRICING} />
        <Group label="Delivery mode" k="deliveryMode" options={DELIVERY} />
        <Group label="Level" k="level" options={LEVEL} />
        <Group label="Duration" k="durationWeeks" options={DURATION} />
        <Group label="Language" k="language" options={LANGUAGE} />

        {activeCount > 0 && (
          <button onClick={() => router.push('/internships')} className="btn-outline w-full !h-9 text-body-sm">Clear all filters</button>
        )}
      </div>
    </aside>
  );
}
