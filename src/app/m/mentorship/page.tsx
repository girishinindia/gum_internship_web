'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { ApiError } from '@/lib/types';
import { SegmentedControl, MobileEmpty, Skeleton } from '@/components/MobileUI';
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
const fmt = (d: string): string => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function MobileMentorship(): JSX.Element {
  const toast = useToast();
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [slots, setSlots] = useState<Any[] | null>(null);
  const [bookings, setBookings] = useState<Any[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const loadSlots = async (): Promise<void> => { const { data } = await api<Any[]>('/mentorship/slots'); setSlots(data); };
  const loadBookings = async (): Promise<void> => { const { data } = await api<Any[]>('/mentorship/bookings/mine'); setBookings(data); };
  useEffect(() => { void loadSlots().catch(() => setSlots([])); void loadBookings().catch(() => setBookings([])); }, []);

  const confirmPaid = async (bookingId: number, pay: Any): Promise<void> => {
    const liveKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const isDev = !liveKey || String(pay.razorpayOrderId).startsWith('order_dev_');
    const finish = async (pid: string, sig: string): Promise<void> => {
      await api(`/mentorship/bookings/${bookingId}/confirm`, { method: 'POST', body: JSON.stringify({ razorpayPaymentId: pid, signature: sig }) });
      toast('success', 'Session booked! 🎉'); void loadSlots(); void loadBookings();
    };
    if (!isDev && (await loadRazorpay())) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({ key: pay.keyId ?? liveKey, order_id: pay.razorpayOrderId, amount: Math.round(pay.amount * 100), currency: pay.currency ?? 'INR', name: 'GI Internship', description: 'Mentorship', theme: { color: '#0284c7' }, handler: (r: Any) => { void finish(r.razorpay_payment_id, r.razorpay_signature); } });
      rzp.open();
    } else { await finish('pay_dev', 'dev_ok'); }
  };

  const book = async (s: Any): Promise<void> => {
    setBusy(s.id);
    try {
      const { data } = await api<Any>('/mentorship/bookings', { method: 'POST', body: JSON.stringify({ slotId: s.id }) });
      if (data.status === 'confirmed') { toast('success', 'Session booked! 🎉'); void loadSlots(); void loadBookings(); }
      else if (data.payment) await confirmPaid(data.bookingId, data.payment);
    } catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not book.'); }
    finally { setBusy(null); }
  };
  const cancel = async (id: number): Promise<void> => {
    try { await api(`/mentorship/bookings/${id}`, { method: 'DELETE' }); toast('success', 'Cancelled.'); void loadSlots(); void loadBookings(); }
    catch { toast('danger', 'Could not cancel.'); }
  };

  return (
    <>
      <AppBar variant="large" leading="back" backHref="/m/profile" title="Mentorship" subtitle="Book a 1:1 with a mentor" />
      <div className="p-4">
        <SegmentedControl options={[{ value: 'browse', label: 'Browse' }, { value: 'mine', label: 'My bookings' }]} value={tab} onChange={setTab} />
        <div className="mt-4 space-y-3">
          {tab === 'browse' ? (
            !slots ? <Skeleton count={3} /> : slots.length === 0 ? <MobileEmpty title="No open slots" body="Check back soon." />
            : slots.map((s) => (
              <div key={s.id} className="rounded-xl border border-neutral-200 bg-white p-3">
                <p className="font-medium">{s.topic ?? '1:1 mentorship'}</p>
                <p className="text-body-sm text-neutral-600">{s.mentorName} · {fmt(s.startsAt)} · {s.durationMinutes} min</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-medium">{Number(s.price) > 0 ? inr(Number(s.price)) : 'Free'}</span>
                  <button onClick={() => book(s)} disabled={busy === s.id} className="pill bg-primary-600 px-4 text-white">{busy === s.id ? '…' : 'Book'}</button>
                </div>
              </div>
            ))
          ) : (
            !bookings ? <Skeleton count={3} /> : bookings.length === 0 ? <MobileEmpty title="No bookings" body="Book a slot to get started." />
            : bookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-neutral-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 font-medium">{b.topic ?? '1:1 mentorship'}</p>
                  <span className="pill shrink-0 bg-neutral-100 capitalize text-neutral-700">{b.status.replace('_', ' ')}</span>
                </div>
                <p className="text-body-sm text-neutral-600">{b.mentorName} · {fmt(b.startsAt)}</p>
                <div className="mt-2 flex gap-2">
                  {b.status === 'confirmed' && b.joinUrl && <a href={b.joinUrl} target="_blank" rel="noopener" className="pill bg-primary-600 px-4 text-white">Join</a>}
                  {['confirmed', 'pending_payment'].includes(b.status) && <button onClick={() => cancel(b.id)} className="pill bg-neutral-100 px-4 text-neutral-700">Cancel</button>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
