import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="hero-surface flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div aria-hidden className="blob animate-floaty pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-primary-300" />
      <div aria-hidden className="blob animate-floaty pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-primary-200" style={{ animationDelay: '2s' }} />
      <Link href="/" className="relative mb-6 flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
          <span className="text-base font-bold">GI</span>
        </span>
        <span className="font-heading text-h2 font-bold tracking-tight text-neutral-900">GI <span className="gradient-text">Internship</span></span>
      </Link>
      <div className="card relative w-full max-w-md p-7 shadow-card">{children}</div>
    </div>
  );
}
