import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Instructor dashboard | GUM Internships' };

export default function InstructorDashboard(): JSX.Element {
  const raw = cookies().get('gum_user')?.value;
  const roles = raw ? (JSON.parse(raw) as { roles: string[] }).roles : [];
  if (!roles.includes('instructor') && !roles.includes('super_admin')) redirect('/my');
  return (
    <div>
      <h1 className="text-h1">Instructor dashboard</h1>
      <p className="mt-2 text-neutral-700">Manage your <a href="/instructor/mentorship" className="text-primary-700 hover:underline">mentorship slots</a> from the sidebar. The review queue, earnings and content builder arrive in a later phase.</p>
    </div>
  );
}
