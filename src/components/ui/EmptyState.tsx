import type { ReactNode } from 'react';

export function EmptyState({ icon = '✨', title, message, action }:
  { icon?: ReactNode; title: string; message?: string; action?: ReactNode }): JSX.Element {
  return (
    <div className="card flex flex-col items-center gap-3 p-12 text-center">
      <span className="text-4xl" aria-hidden>{icon}</span>
      <p className="text-h3">{title}</p>
      {message && <p className="max-w-md text-body-sm text-neutral-600">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
