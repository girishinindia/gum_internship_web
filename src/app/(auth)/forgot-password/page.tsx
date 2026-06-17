'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function ForgotPasswordPage(): JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestCode = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await api('/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase() }) });
      toast('success', 'If that email exists, a 6-digit reset code is on its way.');
      setStep('reset');
    } catch (err) {
      // Don't leak which emails exist — show the same friendly note.
      toast('success', 'If that email exists, a 6-digit reset code is on its way.');
      setStep('reset');
      void err;
    } finally { setBusy(false); }
  };

  const reset = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await api('/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim(), newPassword }),
      });
      toast('success', 'Password updated — please log in.');
      router.push('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset your password. Check the code and try again.');
    } finally { setBusy(false); }
  };

  if (step === 'request') {
    return (
      <form onSubmit={requestCode} className="space-y-4">
        <h1 className="text-h2">Reset your password</h1>
        <p className="text-body-sm text-neutral-600">Enter your account email and we’ll send a 6-digit reset code.</p>
        <label className="block">
          <span className="mb-1 block text-body-sm font-medium text-neutral-800">Email</span>
          <input className="input" type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} autoComplete="email" required />
        </label>
        {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Send reset code'}</button>
        <p className="text-center text-body-sm text-neutral-600">
          Remembered it? <a href="/login" className="font-medium text-primary-700">Back to log in</a>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={reset} className="space-y-4">
      <h1 className="text-h2">Enter your reset code</h1>
      <p className="text-body-sm text-neutral-600">We sent a 6-digit code to <strong>{email}</strong>. It expires shortly.</p>
      <label className="block">
        <span className="mb-1 block text-body-sm font-medium text-neutral-800">6-digit code</span>
        <input className="input tracking-[0.4em]" inputMode="numeric" maxLength={6} value={code}
          onChange={(ev) => setCode(ev.target.value.replace(/\D/g, ''))} required />
      </label>
      <label className="block">
        <span className="mb-1 block text-body-sm font-medium text-neutral-800">New password</span>
        <div className="relative">
          <input className="input pr-16" type={show ? 'text' : 'password'} value={newPassword}
            onChange={(ev) => setNewPassword(ev.target.value)} autoComplete="new-password" minLength={8} required />
          <button type="button" onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-body-sm font-medium text-primary-700">
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        <span className="mt-1 block text-caption text-neutral-500">At least 8 characters, with a letter and a number.</span>
      </label>
      {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Updating…' : 'Set new password'}</button>
      <p className="text-center text-body-sm text-neutral-600">
        <button type="button" onClick={() => setStep('request')} className="font-medium text-primary-700">Use a different email</button>
      </p>
    </form>
  );
}
