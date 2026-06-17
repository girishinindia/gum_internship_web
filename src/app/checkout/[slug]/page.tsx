'use client';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { ApiError } from '@/lib/types';
import { Button, Field, Select, Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

const STATES = ['Gujarat', 'Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Kerala'];

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function CheckoutPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const batchId = search.get('batch') ? Number(search.get('batch')) : undefined;

  const [d, setD] = useState<Any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [polling, setPolling] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Gujarat');
  const [gstin, setGstin] = useState('');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [det, me] = await Promise.all([
          api<Any>(`/catalog/internships/${slug}`),
          api<Any>('/users/me').catch(() => null),
        ]);
        setD(det.data);
        if (me?.data) { setName(me.data.fullName ?? ''); setEmail(me.data.email ?? ''); setPhone(me.data.phone ?? ''); }
        if (det.data.pricingType !== 'paid') { router.replace(`/internships/${slug}`); }
      } catch {
        setErr('Could not load this internship.');
      }
    })();
  }, [slug, router]);

  const subtotal = d ? Number(d.price) : 0;
  const taxable = Math.max(0, subtotal - discount);
  const gst = d ? Math.round(taxable * (Number(d.gstRate) / 100) * 100) / 100 : 0;
  const total = Math.round((taxable + gst) * 100) / 100;

  const applyCoupon = async (): Promise<void> => {
    if (!coupon.trim() || !d) return;
    try {
      const { data } = await api<Any>('/coupons/validate', {
        method: 'POST', body: JSON.stringify({ code: coupon.trim().toUpperCase(), internshipId: d.id }),
      });
      if (data.valid) { setDiscount(Number(data.discountAmount)); setCouponMsg(`Applied — you save ${inr(Number(data.discountAmount))}`); }
      else { setDiscount(0); setCouponMsg(data.reason ?? 'Invalid coupon'); }
    } catch (e) {
      setDiscount(0);
      setCouponMsg(e instanceof ApiError ? e.message : 'Could not validate coupon');
    }
  };

  const pollPaid = async (orderId: number): Promise<void> => {
    setPolling(true);
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const { data } = await api<Any>(`/orders/${orderId}`);
        if (data.status === 'paid') {
          toast('success', 'Payment confirmed — you are enrolled! 🎉');
          router.push('/my');
          return;
        }
        if (['cancelled', 'refunded'].includes(data.status)) { toast('danger', 'Payment was not completed.'); setPolling(false); return; }
      } catch { /* keep polling */ }
    }
    setPolling(false);
    toast('info', 'Still waiting for confirmation. You can check Orders shortly.');
  };

  // Confirm the payment synchronously via the Checkout handler signature — no
  // dependence on the webhook, so the success page appears at once. Falls back
  // to polling (the webhook backup) only if the verify call itself hiccups.
  const confirmAndGo = async (orderId: number, paymentId: string, signature: string): Promise<void> => {
    setPolling(true);
    try {
      const { data } = await api<Any>(`/orders/${orderId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ razorpayPaymentId: paymentId, razorpaySignature: signature }),
      });
      if (data.status === 'paid') {
        toast('success', 'Payment confirmed — you are enrolled! 🎉');
        router.push('/my');
        return;
      }
      await pollPaid(orderId);
    } catch {
      await pollPaid(orderId);
    }
  };

  const pay = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!d) return;
    setBusy(true); setErr(null);
    try {
      const { data } = await api<Any>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          internshipId: d.id, ...(batchId ? { batchId } : {}),
          billingName: name, billingEmail: email, billingPhone: phone, billingState: state,
          ...(gstin ? { billingGstin: gstin } : {}),
          ...(coupon && discount > 0 ? { couponCode: coupon.trim().toUpperCase() } : {}),
        }),
      });
      const orderId = data.order.id as number;
      // Follow the SERVER's mode. In dry-run there is no real gateway → simulate
      // the confirm. Otherwise open the real Razorpay modal with the key the
      // server returned (no reliance on a NEXT_PUBLIC build-time key).
      const rzpKey = (data.razorpayKeyId as string | undefined) ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const isDev = Boolean(data.devMode) || String(data.razorpayOrderId).startsWith('order_dev_');

      if (!isDev && rzpKey && (await loadRazorpay())) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay({
          key: rzpKey,
          order_id: data.razorpayOrderId,
          amount: data.amountPaise,
          currency: data.currency ?? 'INR',
          name: 'GI Internship',
          description: d.title,
          prefill: data.prefill,
          theme: { color: '#0284c7' },
          handler: (resp: Any) => {
            void confirmAndGo(orderId, String(resp?.razorpay_payment_id ?? ''), String(resp?.razorpay_signature ?? ''));
          },
          modal: { ondismiss: () => { setBusy(false); toast('info', 'Checkout closed. Your order is saved under Orders.'); } },
        });
        rzp.open();
      } else {
        // Dev/dry-run: no real modal — confirm with the dev token so enrolment completes.
        toast('info', 'Dev mode: confirming simulated payment…');
        void confirmAndGo(orderId, `pay_dev_${orderId}`, 'dev_ok');
      }
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : 'Could not start checkout. Please try again.');
      setBusy(false);
    }
  };

  if (err) return <Shell><p className="card p-8 text-center text-danger-700">{err}</p></Shell>;
  if (!d) return <Shell><div className="flex justify-center p-12"><Spinner /></div></Shell>;

  return (
    <Shell>
      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <form onSubmit={pay} className="card space-y-4 p-6">
          <h1 className="text-h2">Checkout</h1>
          <p className="text-body-sm text-neutral-600">Billing details (for your GST invoice).</p>
          <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Billing state" value={state} onChange={(e) => setState(e.target.value)}>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Field label="GSTIN (optional)" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} maxLength={15} />
          </div>
          {err && <p className="rounded-xl bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{err}</p>}
          <Button type="submit" fullWidth loading={busy || polling}>
            {polling ? 'Confirming payment…' : `Pay ${inr(total)}`}
          </Button>
          <p className="text-center text-caption text-neutral-500">🔒 Razorpay secure · GST invoice · refund window applies</p>
        </form>

        <aside className="card h-fit space-y-3 p-6">
          <p className="font-heading text-h3">{d.title}</p>
          {batchId && (
            <p className="text-body-sm text-neutral-500">{batchLabel(d, batchId)}</p>
          )}
          <div className="space-y-1.5 border-t border-neutral-100 pt-3 text-body-sm">
            <Row label="Price" value={inr(subtotal)} />
            {discount > 0 && <Row label="Discount" value={`− ${inr(discount)}`} good />}
            <Row label={`GST (${d.gstRate}%)`} value={inr(gst)} />
            <div className="flex justify-between border-t border-neutral-100 pt-2 text-body font-semibold">
              <span>Total</span><span>{inr(total)}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <input className="input flex-1" placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
            <Button type="button" variant="outline" size="sm" onClick={applyCoupon}>Apply</Button>
          </div>
          {couponMsg && <p className={`text-caption ${discount > 0 ? 'text-success-700' : 'text-danger-600'}`}>{couponMsg}</p>}
        </aside>
      </div>
    </Shell>
  );
}

/** Friendly batch label: real name → start-date → generic. Never the raw id. */
function batchLabel(d: Any, batchId: number): string {
  const pool: Any[] = [...((d.batches as Any[] | undefined) ?? []), ...((d.upcomingBatches as Any[] | undefined) ?? [])];
  const b = pool.find((x) => Number(x.id) === batchId);
  if (b?.name && String(b.name).trim()) return String(b.name).trim();
  if (b?.startDate) {
    const dt = new Date(b.startDate);
    if (!Number.isNaN(dt.getTime())) return `Batch starting ${dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return 'Selected batch';
}

function Row({ label, value, good }: { label: string; value: string; good?: boolean }): JSX.Element {
  return <div className="flex justify-between"><span className="text-neutral-600">{label}</span><span className={good ? 'text-success-700' : 'text-neutral-800'}>{value}</span></div>;
}

function Shell({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="glass sticky top-0 z-30">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" className="font-heading text-[19px] font-bold">GI <span className="gradient-text">Internship</span></Link>
          <Link href="/internships" className="text-body-sm text-neutral-500 hover:text-neutral-800">‹ Back to catalog</Link>
        </div>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
