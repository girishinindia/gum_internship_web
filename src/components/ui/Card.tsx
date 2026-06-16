import type { ReactNode } from 'react';

export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }): JSX.Element {
  return <div className={`card ${hover ? 'card-hover' : ''} ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
      <div>
        <h3 className="text-h3">{title}</h3>
        {subtitle && <p className="mt-0.5 text-body-sm text-neutral-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }): JSX.Element {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
