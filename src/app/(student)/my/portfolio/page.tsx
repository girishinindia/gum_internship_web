'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mine = Record<string, any>;

const VISIBILITY = [
  { v: 'private', label: 'Private', hint: 'Only you can see it' },
  { v: 'unlisted', label: 'Unlisted', hint: 'Anyone with the link' },
  { v: 'public', label: 'Public', hint: 'Shareable + indexable' },
] as const;

export default function PortfolioSettingsPage(): JSX.Element {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Mine | null>(null);

  const [handle, setHandle] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'unlisted' | 'public'>('private');
  const [showCertificates, setShowCertificates] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [links, setLinks] = useState({ github: '', linkedin: '', website: '', twitter: '' });

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api<Mine>('/users/me/portfolio');
        setStats(data.stats);
        setPublicUrl(data.publicUrl ?? null);
        const p = data.portfolio;
        if (p) {
          setHandle(p.handle ?? '');
          setHeadline(p.headline ?? '');
          setBio(p.bio ?? '');
          setLocation(p.location ?? '');
          setVisibility(p.visibility ?? 'private');
          setShowCertificates(p.showCertificates ?? true);
          setShowProjects(p.showProjects ?? true);
          setShowContact(p.showContact ?? false);
          setLinks({ github: '', linkedin: '', website: '', twitter: '', ...(p.links ?? {}) });
        }
      } catch {
        setError('Could not load your portfolio.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true); setError(null);
    const cleanLinks = Object.fromEntries(Object.entries(links).filter(([, v]) => v.trim() !== ''));
    try {
      const { data } = await api<Mine>('/users/me/portfolio', {
        method: 'PUT',
        body: JSON.stringify({
          handle: handle.trim().toLowerCase(),
          headline: headline || undefined,
          bio: bio || undefined,
          location: location || undefined,
          visibility,
          showCertificates, showProjects, showContact,
          links: Object.keys(cleanLinks).length ? cleanLinks : undefined,
        }),
      });
      setPublicUrl(data.publicUrl ?? null);
      toast('success', 'Portfolio saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const downloadResume = async (): Promise<void> => {
    try {
      const { data } = await api<{ url: string }>('/users/me/resume');
      window.open(data.url, '_blank', 'noopener');
    } catch {
      toast('danger','Could not generate resume.');
    }
  };

  if (loading) return <div className="card mt-8 p-10 text-center text-neutral-500">Loading…</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1">Portfolio & resume</h1>
        <button onClick={downloadResume} className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-4 text-body-sm font-medium text-neutral-700 hover:bg-neutral-50">Download resume PDF</button>
      </div>

      {stats && (
        <p className="mt-2 text-body-sm text-neutral-600">
          {stats.completedInternships} internships · {stats.certificates} certificates · {stats.projectsShipped} projects shipped
        </p>
      )}

      {publicUrl && visibility !== 'private' && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-primary-50 px-4 py-3 text-body-sm">
          <span className="truncate text-primary-700">{publicUrl}</span>
          <Link href={publicUrl.replace(/^https?:\/\/[^/]+/, '')} className="font-medium text-primary-700 hover:underline">View ↗</Link>
        </div>
      )}

      <form onSubmit={save} className="mt-6 space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-body-sm font-medium text-neutral-700">Public handle</span>
          <div className="flex items-center gap-1 rounded-xl border border-neutral-200 px-3 focus-within:border-primary-400">
            <span className="text-body-sm text-neutral-400">/u/</span>
            <input className="h-11 flex-1 bg-transparent outline-none" value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="your-name" minLength={4} maxLength={40} required />
          </div>
          <span className="mt-1 block text-caption text-neutral-400">4–40 chars: lowercase letters, numbers, hyphens.</span>
        </label>

        <Field label="Headline" value={headline} onChange={setHeadline} placeholder="Aspiring data analyst" maxLength={160} />
        <label className="block">
          <span className="mb-1.5 block text-body-sm font-medium text-neutral-700">Bio</span>
          <textarea className="input min-h-[96px] py-2" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={2000} placeholder="A short intro for visitors." />
        </label>
        <Field label="Location" value={location} onChange={setLocation} placeholder="Ahmedabad, India" maxLength={120} />

        <fieldset>
          <legend className="mb-1.5 text-body-sm font-medium text-neutral-700">Visibility</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {VISIBILITY.map((o) => (
              <button type="button" key={o.v} onClick={() => setVisibility(o.v)}
                className={`rounded-xl border p-3 text-left ${visibility === o.v ? 'border-primary-500 bg-primary-50' : 'border-neutral-200'}`}>
                <span className="block text-body-sm font-medium text-neutral-800">{o.label}</span>
                <span className="block text-caption text-neutral-500">{o.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-body-sm font-medium text-neutral-700">Show on public page</legend>
          <Toggle label="Verified certificates" checked={showCertificates} onChange={setShowCertificates} />
          <Toggle label="Completed internships & projects" checked={showProjects} onChange={setShowProjects} />
          <Toggle label="Contact email" checked={showContact} onChange={setShowContact} />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-1.5 text-body-sm font-medium text-neutral-700">Links</legend>
          {(['github', 'linkedin', 'website', 'twitter'] as const).map((k) => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)} value={links[k]} type="url"
              onChange={(v) => setLinks((s) => ({ ...s, [k]: v }))} placeholder={`https://…`} />
          ))}
        </fieldset>

        {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save portfolio'}</button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', ...rest }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'>): JSX.Element {
  return (
    <label className="block">
      <span className="mb-1.5 block text-body-sm font-medium text-neutral-700">{label}</span>
      <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }): JSX.Element {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2">
      <span className="text-body-sm text-neutral-700">{label}</span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-primary-600' : 'bg-neutral-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}
