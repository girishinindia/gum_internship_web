'use client';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';

export function AppBar({ title, leading, trailing }: { title: string; leading?: React.ReactNode; trailing?: React.ReactNode }): JSX.Element {
  return (
    <header className="app-bar">
      {leading}
      <h1 className="flex-1 truncate font-heading text-[17px] font-semibold">{title}</h1>
      {trailing}
    </header>
  );
}

export function ListRow({ icon, title, subtitle, trailing, onClick, href }: { icon?: React.ReactNode; title: string; subtitle?: string; trailing?: React.ReactNode; onClick?: () => void; href?: string }): JSX.Element {
  const inner = (
    <>
      {icon && <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-50 text-primary-700">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        {subtitle && <span className="block truncate text-body-sm text-neutral-600">{subtitle}</span>}
      </span>
      {trailing ?? <span className="text-neutral-400">›</span>}
    </>
  );
  if (href) return <NextLink href={href} className="list-row border-b border-neutral-100">{inner}</NextLink>;
  return <button className="list-row border-b border-neutral-100" onClick={onClick}>{inner}</button>;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }): JSX.Element {
  return (
    <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md py-1.5 text-body-sm font-medium transition ${value === o.value ? 'bg-white text-primary-700 shadow-e1' : 'text-neutral-600'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Bottom sheet — slides up, backdrop, drag-grabber. Native-app pattern. */
export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }): JSX.Element | null {
  const [mounted, setMounted] = useState(open);
  useEffect(() => { if (open) setMounted(true); }, [open]);
  if (!mounted) return null;
  return (
    <div className={`absolute inset-0 z-40 ${open ? '' : 'pointer-events-none'}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-neutral-900/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} />
      <div
        onTransitionEnd={() => { if (!open) setMounted(false); }}
        className={`absolute inset-x-0 bottom-0 max-h-[85%] overflow-y-auto rounded-t-xl bg-white transition-transform duration-250 ${open ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="sheet-grabber" />
        {title && <h2 className="px-5 pb-2 pt-3 font-heading text-h3">{title}</h2>}
        <div className="px-5 pb-[max(20px,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}

export function Skeleton({ count = 4, height = 84 }: { count?: number; height?: number }): JSX.Element {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl bg-neutral-200" style={{ height }} />
      ))}
    </div>
  );
}

export function MobileEmpty({ title, body, cta }: { title: string; body?: string; cta?: React.ReactNode }): JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="flex gap-1.5">
        <span className="h-3.5 w-3.5 bg-primary-500" />
        <span className="h-3.5 w-3.5 rounded-full bg-success-500" />
        <span className="h-0 w-0 border-x-[7px] border-b-[12px] border-x-transparent border-b-warning-500" />
      </div>
      <p className="font-heading text-h3">{title}</p>
      {body && <p className="text-body-sm text-neutral-600">{body}</p>}
      {cta}
    </div>
  );
}
