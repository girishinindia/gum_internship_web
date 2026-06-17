'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

const STATUS_COPY: Record<string, { title: string; body: string; tone: string }> = {
  submitted: { title: 'Application under review', body: 'Thanks! Our team is reviewing your application. We’ll email you once it’s approved.', tone: 'text-primary-700' },
  pending: { title: 'Application received', body: 'Your application is in the queue for review.', tone: 'text-primary-700' },
  approved: { title: 'You’re an approved instructor 🎉', body: 'Head to your instructor area to create and manage internships.', tone: 'text-success-700' },
};

export default function BecomeInstructorPage(): JSX.Element {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstin, setGstin] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api<Any>('/users/instructor-application');
        setStatus(data.kycStatus ?? null);
        setRejectionReason(data.rejectionReason ?? null);
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 404)) setError('Could not load your application status.');
      } finally { setLoading(false); }
    })();
  }, []);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true); setError(null);
    const expertiseList = expertise.split(',').map((s) => s.trim()).filter(Boolean);
    if (expertiseList.length === 0) { setError('Add at least one area of expertise.'); setBusy(false); return; }
    try {
      await api('/users/instructor-application', {
        method: 'POST',
        body: JSON.stringify({
          bio, expertise: expertiseList,
          ...(linkedinUrl ? { linkedinUrl } : {}),
          ...(websiteUrl ? { websiteUrl } : {}),
          panNumber: panNumber.toUpperCase(),
          ...(gstin ? { gstin: gstin.toUpperCase() } : {}),
          bankAccountName,
          bankAccountNumber,
          bankIfsc: bankIfsc.toUpperCase(),
        }),
      });
      toast('success', 'Application submitted — we’ll review it shortly.');
      setStatus('submitted');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit your application. Please check the fields and try again.');
    } finally { setBusy(false); }
  };

  const showForm = !loading && (status === null || status === 'rejected');
  const copy = status ? STATUS_COPY[status] : undefined;

  return (
    <div className="container-page max-w-2xl py-10 md:py-14">
      <span className="eyebrow">Teach on GI Internship</span>
      <h1 className="mt-3 text-h1">Become an instructor</h1>
      <p className="mt-1.5 text-body-lg text-neutral-500">Share your expertise, mentor real project work, and earn from paid programs.</p>

      {loading && <p className="mt-8 text-neutral-500">Loading…</p>}

      {!loading && copy && status !== 'rejected' && (
        <div className="card mt-8 p-6">
          <h2 className={`text-h3 ${copy.tone}`}>{copy.title}</h2>
          <p className="mt-2 text-body text-neutral-700">{copy.body}</p>
          {status === 'approved' && <Link href="/instructor" className="btn-primary mt-4 inline-flex">Go to instructor area →</Link>}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="card mt-8 space-y-5 p-6">
          {status === 'rejected' && (
            <div className="rounded-xl bg-warning-50 px-4 py-3 text-body-sm text-warning-800">
              Your previous application was not approved{rejectionReason ? `: ${rejectionReason}` : ''}. You can update the details below and re-apply.
            </div>
          )}

          <Field label="About you" hint="Min 30 characters — your background and what you’d teach.">
            <textarea className="input min-h-[110px] py-2" value={bio} onChange={(e) => setBio(e.target.value)} minLength={30} required />
          </Field>
          <Field label="Areas of expertise" hint="Comma-separated, e.g. React, Node.js, System Design.">
            <input className="input" value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="React, Node.js, MongoDB" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="LinkedIn (optional)"><input className="input" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/…" /></Field>
            <Field label="Website (optional)"><input className="input" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://…" /></Field>
          </div>

          <div className="border-t border-neutral-100 pt-5">
            <h2 className="text-h3">KYC & payout details</h2>
            <p className="mt-1 text-caption text-neutral-500">Stored securely (PAN and account number are encrypted). Needed to pay you for paid programs.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="PAN"><input className="input uppercase" value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} required /></Field>
            <Field label="GSTIN (optional)"><input className="input uppercase" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} maxLength={15} /></Field>
          </div>
          <Field label="Bank account holder name"><input className="input" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bank account number"><input className="input" inputMode="numeric" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))} required /></Field>
            <Field label="IFSC"><input className="input uppercase" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} placeholder="HDFC0001234" maxLength={11} required /></Field>
          </div>

          {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</button>
        </form>
      )}

      {error && !showForm && !loading && <p className="mt-6 rounded-xl bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }): JSX.Element {
  return (
    <label className="block">
      <span className="mb-1 block text-body-sm font-medium text-neutral-800">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-caption text-neutral-500">{hint}</span>}
    </label>
  );
}
