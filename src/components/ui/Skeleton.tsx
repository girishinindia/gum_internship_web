export function Skeleton({ className = '' }: { className?: string }): JSX.Element {
  return <div className={`animate-pulse rounded-lg bg-neutral-200/70 ${className}`} />;
}

export function SkeletonCard(): JSX.Element {
  return (
    <div className="card space-y-3 p-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export function Spinner({ className = 'h-5 w-5' }: { className?: string }): JSX.Element {
  return <span className={`inline-block animate-spin rounded-full border-2 border-primary-500 border-t-transparent ${className}`} aria-label="Loading" />;
}
