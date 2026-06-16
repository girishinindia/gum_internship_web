'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Button, Field, Textarea, StatusBadge, Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function EmployerHomePage(): JSX.Element {
  const toast = useToast();
  const [employer, setEmployer] = useState<Any | null | undefined>(undefined); // undefined=loading, null=none
  const [form, setForm] = useState({ companyName: '', website: '', about: '', contactEmail: '', contactPhone: '', gstin: '' });
  const [busy, setBusy] = useState(false);

  const load = async (): Promise<void> => {
    try { const { data } = await api<Any>('/employers/me'); setEmployer(data); }
    catch (e) { if (e instanceof ApiError && e.status === 404) setEmployer(null); else setEmployer(null); }
  };
  useEffect(() => { void load(); }, []);

  const register = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault(); setBusy(true);
    try {
      await api('/employers/register', { method: 'POST', body: JSON.stringify({
        companyName: form.companyName, website: form.website || undefined, about: form.about || undefined,
        contactEmail: form.contactEmail || undefined, contactPhone: form.contactPhone || undefined, gstin: form.gstin || undefined,
      }) });
      toast('success', 'Employer profile created!');
      await load();
    } catch (err) {
      toast('danger', err instanceof ApiError ? err.message : 'Could not register.');
    } finally { setBusy(false); }
  };

  const submitKyc = async (): Promise<void> => {
    try { await api('/employers/me/submit', { method: 'POST' }); toast('success', 'Submitted for verification.'); await load(); }
    catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not submit.'); }
  };

  if (employer === undefined) return <div className="flex justify-center p-12"><Spinner /></div>;

  if (employer === null) {
    return (
      <div className="max-w-xl">
        <h1 className="text-h1">Become an employer</h1>
        <p className="mt-1 text-body-sm text-neutral-600">Post roles and hire from GI Internship&apos;s verified talent.</p>
        <form onSubmit={register} className="card mt-6 space-y-4 p-5">
          <Field label="Company name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required minLength={2} />
          <Field label="Website" type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" />
          <Textarea label="About (optional)" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} maxLength={4000} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            <Field label="Contact phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </div>
          <Field label="GSTIN (optional)" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} maxLength={15} />
          <Button type="submit" loading={busy}>Create employer profile</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-h1">{employer.companyName}</h1>
        <StatusBadge status={employer.kycStatus} />
      </div>
      {employer.website && <a href={employer.website} target="_blank" rel="noopener" className="text-body-sm text-primary-700 hover:underline">{employer.website}</a>}
      {employer.about && <p className="mt-3 text-body text-neutral-700">{employer.about}</p>}

      {employer.kycStatus === 'pending' && (
        <div className="card mt-6 p-5">
          <p className="text-body-sm text-neutral-700">Submit your company for verification to publish jobs.</p>
          <Button className="mt-3" onClick={submitKyc}>Submit for verification</Button>
        </div>
      )}
      {employer.kycStatus === 'submitted' && <p className="mt-6 rounded-xl bg-warning-50 p-4 text-body-sm text-warning-700">⏳ Verification pending — our team will review shortly.</p>}
      {employer.kycStatus === 'rejected' && <p className="mt-6 rounded-xl bg-danger-50 p-4 text-body-sm text-danger-700">Verification was declined{employer.rejectionReason ? `: ${employer.rejectionReason}` : ''}.</p>}
      {employer.kycStatus === 'verified' && <p className="mt-6 rounded-xl bg-success-50 p-4 text-body-sm text-success-700">✓ Verified — you can publish jobs.</p>}

      <Link href="/employer/jobs" className="btn-primary mt-6 inline-flex">Manage jobs →</Link>
    </div>
  );
}
