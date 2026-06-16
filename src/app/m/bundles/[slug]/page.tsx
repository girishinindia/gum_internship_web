'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { ApiError } from '@/lib/types';
import { Skeleton } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true); s.onerror = () => resolve(false); document.body.appendChild(s);
  });
}

export default function MobileBundleDetail(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const toast = useToast();
  const [b, setB] = useState<Any | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void api<Any>(`/bundles/${slug}`).then(({ data }) => setB(data)).catch(() => setB({ error: true })); }, [slug]);

  const confirmPaid = async (pay: Any): Promise<void> => {
    const liveKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const isDev = !liveKey || String(pay.razorpayOrderId).startsWith('order_dev_');
    const finish = async (pid: string, sig: string): Promise<void> => {
      await api(`/bundles/${slug}/confirm`, { method: 'POST', body: JSON.stringify({ razorpayOrderId: pay.razorpayOrderId, razorpayPaymentId: pid, signature: sig }) });
      toast('success', 'Enrolled into the whole track! 🎉'); router.push('/m/learn');
    };
    if (!isDev && (await loadRazorpay())) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({ key: pay.keyId ?? liveKey, order_id: pay.razorpayOrderId, amount: Math.round(pay.amount * 100), currency: pay.currency ?? 'INR', name: 'GI Internship', description: b?.name, theme: { color: '#0284c7' }, handler: (r: Any) => { void finish(r.razorpay_payment_id, r.razorpay_signature); } });
      rzp.open();
    } else { await finish('pay_dev', 'dev_ok'); }
  };
  const purchase = async (): Promise<void> => {
    setBusy(true);
    try {
      const { data } = await api<Any>(`/bundles/${slug}/purchase`, { method: 'POST' });
      if (data.status === 'enrolled') { toast('success', `Enrolled into ${data.enrolledCount} internships!`); router.push('/m/learn'); }
      else if (data.payment) await confirmPaid(data.payment);
    } catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not purchase.'); }
    finally { setBusy(false); }
  };

  if (!b) return <div className="p-4"><Skeleton count={3} /></div>;
  if (b.error) return <div className="p-8 text-center text-danger-700">Bundle not found.</div>;

  return (
    <>
      <AppBar variant="brand" leading="back" backHref="/m/bundles" title={b.name} />
      <div className="p-4 pb-28">
        <div className="flex items-center justify-between gap-2">
          <p className="text-h3 font-heading">{b.name}</p>
          <span className="font-heading text-primary-700">{Number(b.price) > 0 ? inr(Number(b.price)) : 'Free'}</span>
        </div>
        {b.description && <p className="mt-1 text-body-sm text-neutral-600">{b.description}</p>}
        <p className="mt-4 font-medium">Includes {(b.internships as Any[]).length} internships</p>
        <div className="mt-2 space-y-2">
          {(b.internships as Any[]).map((i) => (
            <Link key={i.id} href={`/m/internships/${i.slug}`} className="block rounded-xl border border-neutral-200 bg-white p-3 active:bg-neutral-50">{i.title}</Link>
          ))}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur-xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
        <button onClick={purchase} disabled={busy} className="h-12 w-full rounded-xl bg-brand-gradient font-medium text-white transition active:scale-[0.99] disabled:bg-neutral-200 disabled:text-neutral-400">
          {busy ? 'Processing…' : Number(b.price) > 0 ? `Buy · ${inr(Number(b.price))}` : 'Enroll in all (free)'}
        </button>
      </div>
    </>
  );
}
