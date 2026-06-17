import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = { title: 'Instructor dashboard | GUM Internships' };

const CARDS: { href: string; icon: string; title: string; body: string }[] = [
  { href: '/instructor/internships', icon: '📚', title: 'Internships', body: 'Create programs, build the curriculum, run cohorts and schedule live sessions.' },
  { href: '/instructor/reviews', icon: '✅', title: 'Review queue', body: 'Score submitted project work against your rubric.' },
  { href: '/instructor/earnings', icon: '💰', title: 'Earnings', body: 'Track your share of paid enrolments and payouts.' },
  { href: '/instructor/mentorship', icon: '🧑‍🏫', title: 'Mentorship slots', body: 'Open 1:1 booking slots for your students.' },
];

export default function InstructorDashboard(): JSX.Element {
  const raw = cookies().get('gum_user')?.value;
  const parsed = raw ? (JSON.parse(raw) as { name?: string; roles: string[] }) : { roles: [] as string[] };
  if (!parsed.roles.includes('instructor') && !parsed.roles.includes('super_admin')) redirect('/my');

  return (
    <div>
      <h1 className="text-h1">Instructor dashboard</h1>
      <p className="mt-1 text-body-sm text-neutral-600">Welcome{parsed.name ? `, ${parsed.name.split(' ')[0]}` : ''}. Manage your programs, cohorts, live sessions and reviews.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="card card-hover flex items-start gap-3 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-xl">{c.icon}</span>
            <div>
              <p className="font-heading text-h3">{c.title}</p>
              <p className="mt-0.5 text-body-sm text-neutral-600">{c.body}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50/50 p-4 text-body-sm text-neutral-700">
        New here? Start by creating an internship under <Link href="/instructor/internships" className="font-medium text-primary-700 hover:underline">Internships</Link>, add a curriculum and a cohort, then schedule your first live session.
      </div>
    </div>
  );
}
