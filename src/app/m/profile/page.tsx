import Link from 'next/link';
import { cookies } from 'next/headers';
import { ProfileActions } from '@/components/MobileProfileActions';
import { ListRow } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';
import { Icon } from '@/components/mobile/Icon';
import type { IconName } from '@/components/mobile/Icon';

export const metadata = { title: 'Profile' };

export default function Profile(): JSX.Element {
  const raw = cookies().get('gum_user')?.value;
  const user = raw ? (JSON.parse(raw) as { name: string; roles: string[] }) : null;
  const roles = user?.roles ?? [];
  const has = (...r: string[]): boolean => roles.includes('super_admin') || r.some((x) => roles.includes(x));

  return (
    <>
      <AppBar title="Profile" actions={[{ icon: 'bell', label: 'Notifications', href: '/m/notifications', badge: true }]} />

      <div className="p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-brand-gradient p-4 text-white shadow-soft">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white/20 font-heading text-h3">{user?.name?.slice(0, 1).toUpperCase() ?? '?'}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{user?.name ?? 'Guest'}</p>
            <p className="text-caption capitalize opacity-90">{roles.join(' · ') || 'Not signed in'}</p>
          </div>
          {user && <Link href="/my/portfolio" className="rounded-full bg-white/20 px-3 py-1.5 text-caption font-medium">Portfolio</Link>}
        </div>
      </div>

      <Section title="Learning" />
      <Row href="/m/learn" icon="book" title="My internships" />
      <Row href="/m/bundles" icon="gift" title="Career bundles" />
      <Row href="/m/cpd" icon="clock" title="CPD hours" />

      <Section title="Grow" />
      <Row href="/m/achievements" icon="trophy" title="Achievements" />
      <Row href="/m/assessment" icon="target" title="Skill check" />
      <Row href="/m/interview" icon="robot" title="Mock interview" />

      <Section title="Careers" />
      <Row href="/m/jobs" icon="briefcase" title="Job board" />
      <Row href="/m/applications" icon="receipt" title="My applications" />

      <Section title="Account" />
      <Row href="/m/notifications" icon="bell" title="Notifications" />
      <Row href="/orders" icon="receipt" title="Orders & invoices" />
      <Row href="/my/portfolio" icon="user" title="Portfolio & resume" />

      {(has('instructor') || true) && <Section title="More" />}
      {has('instructor') && <Row href="/instructor" icon="dashboard" title="Instructor console" />}
      <Row href="/employer" icon="building" title="Employer portal" />
      <Row href="/orgs" icon="users" title="Organizations" />

      <ProfileActions signedIn={!!user} />
    </>
  );
}

function Section({ title }: { title: string }): JSX.Element {
  return <p className="px-4 pb-1 pt-5 text-caption font-semibold uppercase tracking-wide text-neutral-400">{title}</p>;
}
function Row({ href, icon, title }: { href: string; icon: IconName; title: string }): JSX.Element {
  return <ListRow href={href} icon={<Icon name={icon} size={20} />} title={title} />;
}
