'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function PrivacyPage(): JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');

  const downloadData = async (): Promise<void> => {
    setBusy(true);
    try {
      const { data } = await api<Record<string, unknown>>('/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'gum-data-export.json'; a.click();
      URL.revokeObjectURL(url);
      toast('success', 'Your data export has downloaded.');
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not export your data.');
    } finally { setBusy(false); }
  };

  const deleteAccount = async (): Promise<void> => {
    setBusy(true);
    try {
      await api('/me/account/deletion', { method: 'POST', body: JSON.stringify({ password, confirm: 'DELETE' }) });
      await fetch('/api/session', { method: 'DELETE' }).catch(() => undefined);
      toast('success', 'Your account has been deleted.');
      router.push('/');
      router.refresh();
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not delete your account.');
      setBusy(false);
    }
  };

  return (
    <div className="container-page max-w-2xl space-y-6 py-6">
      <div>
        <h1 className="text-h1">Privacy &amp; your data</h1>
        <p className="mt-1 text-body-sm text-neutral-600">Exercise your data rights. We process your data per our Privacy Policy.</p>
      </div>

      <section className="card space-y-3 p-5">
        <h2 className="text-h3">Download your data</h2>
        <p className="text-body-sm text-neutral-700">Get a machine-readable (JSON) copy of your profile, enrolments, orders, certificates, posts, and more.</p>
        <button onClick={downloadData} disabled={busy} className="btn-primary px-4">{busy ? 'Preparing…' : 'Download my data'}</button>
      </section>

      <section className="card space-y-3 border-danger-200 p-5">
        <h2 className="text-h3 text-danger-700">Delete your account</h2>
        <p className="text-body-sm text-neutral-700">
          This permanently anonymises your personal data and signs you out everywhere. Records we must keep for legal reasons
          (e.g. tax invoices) are retained but de-identified. This cannot be undone.
        </p>
        {!confirmOpen ? (
          <button onClick={() => setConfirmOpen(true)} className="btn-outline px-4 !text-danger-700">Delete my account…</button>
        ) : (
          <div className="space-y-3 rounded-lg border border-danger-200 bg-danger-50/40 p-4">
            <p className="text-body-sm text-neutral-800">Type <strong>DELETE</strong> and your password to confirm.</p>
            <input className="input" placeholder="DELETE" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
            <input className="input" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={deleteAccount} disabled={busy || confirmText !== 'DELETE' || !password}
                className="btn-primary !bg-danger-600 px-4 disabled:opacity-50">{busy ? 'Deleting…' : 'Permanently delete'}</button>
              <button onClick={() => { setConfirmOpen(false); setConfirmText(''); setPassword(''); }} className="btn-outline px-4">Cancel</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
