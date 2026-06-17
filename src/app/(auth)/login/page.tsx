'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useToast } from '@/components/ui/Toast';

function LoginForm(): JSX.Element {
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/my';
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } | null };
    setBusy(false);
    if (!body.success) {
      const friendly: Record<string, string> = {
        INVALID_CREDENTIALS: 'That email/phone and password combination is incorrect.',
        VERIFICATION_PENDING: 'Verify your email or phone first — check your inbox/SMS.',
        ACCOUNT_SUSPENDED: 'This account is suspended. Contact support.',
        RATE_LIMITED: 'Too many attempts — wait a minute and try again.',
      };
      setError(friendly[body.error?.code ?? ''] ?? body.error?.message ?? 'Login failed');
      return;
    }
    toast('success', 'Welcome back!');
    router.push(next);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-h2">Log in</h1>
      <label className="block">
        <span className="mb-1 block text-body-sm font-medium text-neutral-800">Email or phone</span>
        <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required />
      </label>
      <label className="block">
        <span className="mb-1 flex items-center justify-between text-body-sm font-medium text-neutral-800">
          Password
          <a href="/forgot-password" className="text-body-sm font-medium text-primary-700 hover:underline">Forgot password?</a>
        </span>
        <div className="relative">
          <input className="input pr-16" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 px-3 text-body-sm font-medium text-primary-700">
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>
      </label>
      {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      <p className="text-center text-body-sm text-neutral-600">
        New here? <a href="/signup" className="font-medium text-primary-700">Create an account</a>
      </p>
    </form>
  );
}

export default function LoginPage(): JSX.Element {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
