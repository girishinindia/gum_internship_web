'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { ApiError } from '@/lib/types';
import { Button, Spinner } from '@/components/ui';
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

export default function BundleDetailPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const toast = useToast();
  const [b, setB] = useState<Any | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void api<Any>(`/bundles/${slug}`).then(({ data }) => setB(data)).catch(() => setB({ error: true })); }, [slug]);

  const confirmPaid = async (pay: Any): Promise<void> => {
    const liveKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const isDev = !liveKey || String(pay.razorpayOrderId).startsWith('order_dev_');
    const finish = async (paymentId: string, signature: string): Promise<void> => {
      await api(`/bundles/${slug}/confirm`, { method: 'POST', body: JSON.stringify({ razorpayOrderId: pay.razorpayOrderId, razorpayPaymentId: paymentId, signature }) });
      toast('success', 'Enrolled into the whole track! 🎉'); router.push('/my');
    };
    if (!isDev && (await loadRazorpay())) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key: pay.keyId ?? liveKey, order_id: pay.razorpayOrderId, amount: Math.round(pay.amount * 100), currency: pay.currency ?? 'INR',
        name: 'GI Internship', description: b?.name, theme: { color: '#0284c7' },
        handler: (r: Any) => { void finish(r.razorpay_payment_id, r.razorpay_signature); },
      });
      rzp.open();
    } else {
      await finish('pay_dev', 'dev_ok');
    }
  };

  const purchase = async (): Promise<void> => {
    setBusy(true);
    try {
      const { data } = await api<Any>(`/bundles/${slug}/purchase`, { method: 'POST' });
      if (data.status === 'enrolled') { toast('success', `Enrolled into ${data.enrolledCount} internships! 🎉`); router.push('/my'); }
      else if (data.status === 'pending_payment' && data.payment) await confirmPaid(data.payment);
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not purchase this bundle.');
    } finally { setBusy(false); }
  };

  if (!b) return <div className="flex justify-center p-12"><Spinner /></div>;
  if (b.error) return <p className="card p-8 text-center text-danger-700">Bundle not found.</p>;

  return (
    <div className="max-w-2xl">
      <Link href="/bundles" className="text-body-sm text-neutral-500 hover:text-neutral-800">‹ Bundles</Link>
      <div className="card mt-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-h2">{b.name}</h1>
          <span className="font-heading text-h2 text-primary-700">{Number(b.price) > 0 ? inr(Number(b.price)) : 'Free'}</span>
        </div>
        {b.description && <p className="mt-2 text-body text-neutral-700">{b.description}</p>}
        <h2 className="mt-5 text-h3">Includes {(b.internships as Any[]).length} internships</h2>
        <ul className="mt-3 space-y-2">
          {(b.internships as Any[]).map((i) => (
            <li key={i.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2">
              <Link href={`/internships/${i.slug}`} className="text-body-sm font-medium text-neutral-800 hover:text-primary-700">{i.title}</Link>
              <span className="text-caption text-neutral-400 capitalize">{i.pricingType}</span>
            </li>
          ))}
        </ul>
        <Button className="mt-6" fullWidth loading={busy} onClick={purchase}>
          {Number(b.price) > 0 ? `Buy bundle · ${inr(Number(b.price))}` : 'Enroll in all (free)'}
        </Button>
      </div>
    </div>
  );
}
