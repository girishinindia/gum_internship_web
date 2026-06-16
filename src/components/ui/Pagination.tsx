'use client';

export function Pagination({ page, totalPages, onChange }:
  { page: number; totalPages: number; onChange: (page: number) => void }): JSX.Element | null {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-2 text-body-sm">
      <button
        onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="rounded-lg border border-neutral-200 px-3 py-1.5 disabled:opacity-40 enabled:hover:bg-neutral-50"
      >‹ Prev</button>
      <span className="px-2 text-neutral-600">Page {page} of {totalPages}</span>
      <button
        onClick={() => onChange(page + 1)} disabled={page >= totalPages}
        className="rounded-lg border border-neutral-200 px-3 py-1.5 disabled:opacity-40 enabled:hover:bg-neutral-50"
      >Next ›</button>
    </div>
  );
}
