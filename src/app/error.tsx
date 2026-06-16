'use client';
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }): JSX.Element {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-h2">Something went wrong</h2>
      <p className="max-w-md text-neutral-700">{error.message || 'An unexpected error occurred.'}</p>
      <button className="btn-primary" onClick={reset}>Try again</button>
    </div>
  );
}
