import Link from 'next/link';

export function Footer(): JSX.Element {
  return (
    <footer className="mt-20 hidden border-t border-neutral-200 bg-white md:block">
      <div className="container-page py-12">
        <div className="grid grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
                <span className="text-base font-bold">GI</span>
              </span>
              <span className="font-heading text-[18px] font-bold tracking-tight">GI <span className="gradient-text">Internship</span></span>
            </div>
            <p className="mt-3 max-w-xs text-body-sm text-neutral-500">Learn by doing — real projects, mentor reviews, verifiable certificates.</p>
          </div>
          <FooterCol title="Learn" links={[['Explore internships', '/internships'], ['Verify a certificate', '/verify'], ['Become an instructor', '/become-instructor']]} />
          <FooterCol title="Company" links={[['About', '/pages/about'], ['Contact', '/pages/contact']]} />
          <FooterCol title="Legal" links={[['Refund policy', '/pages/refund-policy'], ['Terms', '/pages/terms'], ['Privacy', '/pages/privacy']]} />
        </div>
        <div className="mt-10 flex items-center justify-between border-t border-neutral-100 pt-6 text-caption text-neutral-400">
          <p>© {new Date().getFullYear()} GI Internship · Made in India 🇮🇳</p>
          <p>Surat, Gujarat</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }): JSX.Element {
  return (
    <div>
      <p className="mb-3 text-caption font-semibold uppercase tracking-wider text-neutral-400">{title}</p>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-body-sm text-neutral-600 transition hover:text-primary-700">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
