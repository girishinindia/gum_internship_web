'use client';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

export function Modal({ open, onClose, title, children, footer }:
  { open: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode }): JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-lift sm:rounded-2xl"
        role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <h3 className="text-h3">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">✕</button>
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-neutral-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
