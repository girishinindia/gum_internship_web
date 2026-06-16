'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function OrgBrandingPage(): JSX.Element {
  const { orgId } = useParams<{ orgId: string }>();
  const toast = useToast();
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ brandName: '', logoUrl: '', primaryColor: '#0284c7', supportEmail: '', customDomain: '' });
  const set = (k: keyof typeof f, v: string): void => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    void api<Any>(`/orgs/${orgId}/branding`).then(({ data }) => {
      if (data) setF({
        brandName: data.brandName ?? '', logoUrl: data.logoUrl ?? '',
        primaryColor: data.primaryColor ?? '#0284c7', supportEmail: data.supportEmail ?? '',
        customDomain: data.customDomain ?? '',
      });
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [orgId]);

  const save = async (): Promise<void> => {
    setBusy(true);
    try {
      await api(`/orgs/${orgId}/branding`, { method: 'PATCH', body: JSON.stringify(f) });
      toast('success', 'Branding saved.');
    } catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not save branding.'); }
    finally { setBusy(false); }
  };

  if (!loaded) return <div className="container-page py-6 text-neutral-500">Loading…</div>;

  return (
    <div className="container-page max-w-3xl space-y-5 py-6">
      <Link href={`/orgs/${orgId}`} className="text-body-sm text-primary-700 hover:underline">‹ Back to organisation</Link>
      <div>
        <h1 className="text-h1">White-label branding</h1>
        <p className="mt-1 text-body-sm text-neutral-600">Customise how the platform looks for your organisation.</p>
      </div>

      {/* Live preview */}
      <div className="overflow-hidden rounded-xl border border-neutral-200">
        <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: f.primaryColor || '#0284c7' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {f.logoUrl ? <img src={f.logoUrl} alt="" className="h-7 w-auto" /> : <span className="grid h-7 w-7 place-items-center rounded bg-white/20 text-white">●</span>}
          <span className="font-heading font-semibold text-white">{f.brandName || 'Your brand'}</span>
        </div>
        <div className="bg-white px-4 py-3 text-body-sm text-neutral-500">Preview of your branded header.</div>
      </div>

      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Brand name</span>
          <input className="input" value={f.brandName} onChange={(e) => set('brandName', e.target.value)} placeholder="Acme Learning" /></label>
        <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Support email</span>
          <input className="input" value={f.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} placeholder="help@acme.com" /></label>
        <label className="block sm:col-span-2"><span className="mb-1 block text-caption font-medium text-neutral-700">Logo URL</span>
          <input className="input" value={f.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://…/logo.png" /></label>
        <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Primary colour</span>
          <span className="flex items-center gap-2">
            <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(f.primaryColor) ? f.primaryColor : '#0284c7'} onChange={(e) => set('primaryColor', e.target.value)} className="h-10 w-12 rounded border border-neutral-200" />
            <input className="input" value={f.primaryColor} onChange={(e) => set('primaryColor', e.target.value)} placeholder="#0284c7" />
          </span></label>
        <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Custom domain</span>
          <input className="input" value={f.customDomain} onChange={(e) => set('customDomain', e.target.value.toLowerCase())} placeholder="learn.acme.com" /></label>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-primary px-5">{busy ? 'Saving…' : 'Save branding'}</button>
        <p className="text-caption text-neutral-500">Custom-domain routing requires a DNS CNAME + TLS at your proxy (see ops runbook).</p>
      </div>
    </div>
  );
}
