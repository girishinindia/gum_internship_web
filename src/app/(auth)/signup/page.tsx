'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

/** Friendly mapping for API error codes (mirrors login). */
function friendly(code?: string, fallback?: string): string {
  const map: Record<string, string> = {
    CONFLICT: 'That email or phone is already registered. Try logging in.',
    VALIDATION_ERROR: 'Please check the highlighted fields and try again.',
    OTP_INVALID: 'That code is incorrect. Check it and try again.',
    OTP_EXPIRED: 'That code expired — request a fresh one.',
    OTP_ATTEMPTS_EXHAUSTED: 'Too many wrong attempts. Request a new code.',
    RATE_LIMITED: 'Too many requests — please wait a minute and retry.',
  };
  return map[code ?? ''] ?? fallback ?? 'Something went wrong. Please try again.';
}

interface RegisterResult {
  success: boolean;
  data?: { userId: number; verificationRequired: boolean };
  error?: { code: string; message: string };
  meta?: { dev?: { otp?: { email?: string; phone?: string } } };
}

export default function SignupPage(): JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // step 1 fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  // step 2
  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = (): void => {
    setCooldown(60);
    const t = setInterval(() => setCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const register = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/proxy/auth/register', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password }),
      });
      const body = (await res.json()) as RegisterResult;
      if (!body.success) { setError(friendly(body.error?.code, body.error?.message)); return; }
      setDevOtp(body.meta?.dev?.otp?.email ?? null); // shown only in dev (NOTIFY_DRY_RUN)
      setStep(2);
      startCooldown();
      toast('success', `We sent a 6-digit code to ${email}`);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const v = await fetch('/api/proxy/auth/otp/verify', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ destination: email, purpose: 'email_verify', code }),
      });
      const vb = (await v.json()) as RegisterResult;
      if (!vb.success) { setError(friendly(vb.error?.code, vb.error?.message)); return; }
      // verified → log in (sets httpOnly session cookies) → dashboard
      const s = await fetch('/api/session', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });
      const sb = (await s.json()) as { success: boolean };
      toast('success', 'Account verified — welcome aboard! 🎉');
      if (sb.success) { router.push('/my'); router.refresh(); }
      else router.push('/login');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async (): Promise<void> => {
    if (cooldown > 0) return;
    setError(null);
    const res = await fetch('/api/proxy/auth/otp/request', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ destination: email, channel: 'email', purpose: 'email_verify' }),
    });
    const body = (await res.json()) as RegisterResult;
    if (body.success) { setDevOtp(body.meta?.dev?.otp?.email ?? null); startCooldown(); toast('info', 'New code sent.'); }
    else setError(friendly(body.error?.code, body.error?.message));
  };

  return (
    <div>
      {/* stepper */}
      <div className="mb-6 flex items-center gap-2">
        {[1, 2].map((n) => (
          <div key={n} className="flex flex-1 items-center gap-2">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-caption font-semibold ${step >= n ? 'bg-brand-gradient text-white' : 'bg-neutral-100 text-neutral-400'}`}>
              {step > n ? '✓' : n}
            </span>
            <span className={`text-body-sm font-medium ${step >= n ? 'text-neutral-800' : 'text-neutral-400'}`}>{n === 1 ? 'Details' : 'Verify'}</span>
            {n === 1 && <span className={`h-px flex-1 ${step > 1 ? 'bg-primary-400' : 'bg-neutral-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <form onSubmit={register} className="space-y-4">
          <h1 className="text-h2">Create your account</h1>
          <Field label="Full name" value={fullName} onChange={setFullName} autoComplete="name" required />
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="10-digit mobile" inputMode="numeric" autoComplete="tel" required />
          <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" hint="Min 8 chars, with a letter and a number" required />
          {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
          <p className="text-center text-body-sm text-neutral-500">
            Already have an account? <a href="/login" className="font-medium text-primary-700 hover:underline">Log in</a>
          </p>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <h1 className="text-h2">Verify your email</h1>
          <p className="text-body-sm text-neutral-500">
            Enter the 6-digit code we sent to <span className="font-medium text-neutral-800">{email}</span>.
          </p>
          {devOtp && (
            <p className="rounded-xl bg-primary-50 px-3 py-2 text-body-sm text-primary-700">
              Dev mode code: <span className="font-mono font-semibold tracking-widest">{devOtp}</span>
            </p>
          )}
          <input
            className="input text-center font-mono text-2xl tracking-[0.5em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder="••••••"
            maxLength={6}
            autoFocus
          />
          {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
          <button className="btn-primary w-full" disabled={busy || code.length !== 6}>{busy ? 'Verifying…' : 'Verify & continue'}</button>
          <div className="flex items-center justify-between text-body-sm">
            <button type="button" onClick={() => { setStep(1); setError(null); }} className="text-neutral-500 hover:text-neutral-800">‹ Edit details</button>
            <button type="button" onClick={resend} disabled={cooldown > 0} className="font-medium text-primary-700 disabled:text-neutral-400">
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', hint, ...rest }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'>): JSX.Element {
  return (
    <label className="block">
      <span className="mb-1.5 block text-body-sm font-medium text-neutral-700">{label}</span>
      <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
      {hint && <span className="mt-1 block text-caption text-neutral-400">{hint}</span>}
    </label>
  );
}
