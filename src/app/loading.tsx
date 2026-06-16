export default function Loading(): JSX.Element {
  return (
    <div className="container-page py-10">
      <div className="h-8 w-64 animate-pulse rounded-md bg-neutral-200" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-64 animate-pulse bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}
