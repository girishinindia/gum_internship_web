'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BottomSheet, SegmentedControl } from './MobileUI';

/** Search bar that opens a native-style filter bottom sheet. */
export function HomeSearch({ categories }: { categories: { name: string; slug: string }[] }): JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [pricing, setPricing] = useState<'all' | 'free' | 'paid'>('all');
  const [category, setCategory] = useState<string>('');

  const apply = (): void => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (pricing !== 'all') params.set('pricingType', pricing);
    if (category) params.set('category', category);
    setOpen(false);
    router.push(`/m/explore${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex w-full items-center gap-2 rounded-xl bg-white/95 px-4 py-3 text-left text-neutral-500 active:bg-white">
        <span>🔍</span> Search internships…
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Find your internship">
        <div className="space-y-4">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Keyword (e.g. Flutter)"
            className="h-11 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-primary-600" />
          <div>
            <p className="mb-1.5 text-body-sm font-medium text-neutral-700">Price</p>
            <SegmentedControl
              value={pricing}
              onChange={setPricing}
              options={[{ value: 'all', label: 'All' }, { value: 'free', label: 'Free' }, { value: 'paid', label: 'Paid' }]}
            />
          </div>
          <div>
            <p className="mb-1.5 text-body-sm font-medium text-neutral-700">Category</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCategory('')} className={`pill border ${category === '' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-neutral-300 text-neutral-700'}`}>Any</button>
              {categories.map((c) => (
                <button key={c.slug} onClick={() => setCategory(c.slug)} className={`pill border ${category === c.slug ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-neutral-300 text-neutral-700'}`}>{c.name}</button>
              ))}
            </div>
          </div>
          <button onClick={apply} className="h-12 w-full rounded-lg bg-primary-600 font-medium text-white active:bg-primary-700">Show results</button>
        </div>
      </BottomSheet>
    </>
  );
}
