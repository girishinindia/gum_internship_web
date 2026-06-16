'use client';
import { useRouter } from 'next/navigation';

type Params = Record<string, string | undefined>;
const KEYS = ['category', 'pricingType', 'deliveryMode', 'level', 'durationWeeks', 'language', 'q'] as const;
const OPTIONS: [string, string][] = [
  ['newest', 'Newest'],
  ['popular', 'Most popular'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
];

/** Sort dropdown — preserves active filters, resets to page 1. */
export function CatalogSort({ current }: { current: Params }): JSX.Element {
  const router = useRouter();
  const change = (sort: string): void => {
    const next = new URLSearchParams();
    for (const k of KEYS) { const v = current[k]; if (v) next.set(k, v); }
    next.set('sort', sort);
    router.push(`/internships?${next.toString()}`);
  };
  return (
    <label className="flex items-center gap-2 whitespace-nowrap text-body-sm text-neutral-600">
      Sort by
      <select className="input !h-9 !w-auto py-0" value={current.sort ?? 'newest'} onChange={(e) => change(e.target.value)}>
        {OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
