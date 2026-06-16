import Link from 'next/link';
export default function NotFound(): JSX.Element {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-h1">404</h2>
      <p className="text-neutral-700">This page does not exist or is no longer available.</p>
      <Link href="/internships" className="btn-primary">Browse internships</Link>
    </div>
  );
}
