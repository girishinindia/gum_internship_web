'use client';
import { useState } from 'react';
import type { ReactNode } from 'react';

export interface TabItem { key: string; label: string; content: ReactNode }

export function Tabs({ tabs, initial }: { tabs: TabItem[]; initial?: string }): JSX.Element {
  const [active, setActive] = useState(initial ?? tabs[0]?.key ?? '');
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  return (
    <div>
      <div className="flex gap-1 border-b border-neutral-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-body-sm font-medium transition ${
              active === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-5">{current?.content}</div>
    </div>
  );
}
