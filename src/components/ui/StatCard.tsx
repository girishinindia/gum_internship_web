import type { ReactNode } from 'react';

export function StatCard({ label, value, icon, hint }: { label: string; value: ReactNode; icon?: ReactNode; hint?: string }): JSX.Element {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-caption uppercase tracking-wide text-neutral-500">{label}</p>
        {icon && <span className="text-primary-500">{icon}</span>}
      </div>
      <p className="mt-1 text-h2 text-neutral-900">{value}</p>
      {hint && <p className="mt-0.5 text-caption text-neutral-400">{hint}</p>}
    </div>
  );
}
