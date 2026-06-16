'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { ApiError } from '@/lib/types';
import { Button, Tabs, StatusBadge, EmptyState, SkeletonCard } from '@/components/ui';
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

function fmt(dt: string): string { return new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); }

export default function MentorshipPage(): JSX.Element {
  const toast = useToast();
  const [slots, setSlots] = useState<Any[] | null>(null);
  const [bookings, setBookings] = useState<Any[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const loadSlots = async (): Promise<void> => { const { data } = await api<Any[]>('/mentorship/slots'); setSlots(data); };
  const loadBookings = async (): Promise<void> => { const { data } = await api<Any[]>('/mentorship/bookings/mine'); setBookings(data); };
  useEffect(() => { void loadSlots().catch(() => setSlots([])); void loadBookings().catch(() => setBookings([])); }, []);

  const confirmPaid = async (bookingId: number, pay: Any): Promise<void> => {
    const liveKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const isDev = !liveKey || String(pay.razorpayOrderId).startsWith('order_dev_');
    const finish = async (paymentId: string, signature: string): Promise<void> => {
      await api(`/mentorship/bookings/${bookingId}/confirm`, { method: 'POST', body: JSON.stringify({ razorpayPaymentId: paymentId, signature }) });
      toast('success', 'Session booked! 🎉'); void loadSlots(); void loadBookings();
    };
    if (!isDev && (await loadRazorpay())) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key: pay.keyId ?? liveKey, order_id: pay.razorpayOrderId, amount: Math.round(pay.amount * 100), currency: pay.currency ?? 'INR',
        name: 'GI Internship', description: 'Mentorship session', theme: { color: '#0284c7' },
        handler: (r: Any) => { void finish(r.razorpay_payment_id, r.razorpay_signature); },
      });
      rzp.open();
    } else {
      await finish('pay_dev', 'dev_ok').catch(() => toast('danger', 'Could not confirm payment.'));
    }
  };

  const book = async (slot: Any): Promise<void> => {
    setBusy(slot.id);
    try {
      const { data } = await api<Any>('/mentorship/bookings', { method: 'POST', body: JSON.stringify({ slotId: slot.id }) });
      if (data.status === 'confirmed') { toast('success', 'Session booked! 🎉'); void loadSlots(); void loadBookings(); }
      else if (data.status === 'pending_payment' && data.payment) { await confirmPaid(data.bookingId, data.payment); }
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not book this slot.');
    } finally { setBusy(null); }
  };

  const cancel = async (id: number): Promise<void> => {
    try { await api(`/mentorship/bookings/${id}`, { method: 'DELETE' }); toast('success', 'Booking cancelled.'); void loadSlots(); void loadBookings(); }
    catch { toast('danger', 'Could not cancel.'); }
  };

  const Browse = (
    !slots ? <SkeletonCard /> : slots.length === 0 ? <EmptyState icon="🧑‍🏫" title="No open slots right now" message="Mentors publish 1:1 slots here — check back soon." />
    : (
      <div className="space-y-3">
        {slots.map((s) => (
          <div key={s.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-neutral-800">{s.topic ?? '1:1 mentorship'}</p>
              <p className="text-caption text-neutral-500">{s.mentorName} · {fmt(s.startsAt)} · {s.durationMinutes} min</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-body font-semibold">{Number(s.price) > 0 ? inr(Number(s.price)) : 'Free'}</span>
              <Button size="sm" loading={busy === s.id} onClick={() => book(s)}>Book</Button>
            </div>
          </div>
        ))}
      </div>
    )
  );

  const Mine = (
    !bookings ? <SkeletonCard /> : bookings.length === 0 ? <EmptyState icon="📅" title="No bookings yet" message="Booked sessions and their join links appear here." />
    : (
      <div className="space-y-3">
        {bookings.map((b) => (
          <div key={b.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="flex items-center gap-2"><span className="font-medium text-neutral-800">{b.topic ?? '1:1 mentorship'}</span><StatusBadge status={b.status} /></div>
              <p className="text-caption text-neutral-500">{b.mentorName} · {fmt(b.startsAt)} · {b.durationMinutes} min</p>
            </div>
            <div className="flex items-center gap-2">
              {b.status === 'confirmed' && b.joinUrl && <a href={b.joinUrl} target="_blank" rel="noopener" className="btn-primary !h-9 px-4 text-body-sm">Join</a>}
              {['confirmed', 'pending_payment'].includes(b.status) && <Button size="sm" variant="ghost" onClick={() => cancel(b.id)}>Cancel</Button>}
            </div>
          </div>
        ))}
      </div>
    )
  );

  return (
    <div>
      <h1 className="text-h1">Mentorship</h1>
      <p className="mt-1 text-body-sm text-neutral-600">Book 1:1 time with mentors for guidance, reviews, or mock interviews.</p>
      <div className="mt-6">
        <Tabs tabs={[{ key: 'browse', label: 'Browse slots', content: Browse }, { key: 'mine', label: 'My bookings', content: Mine }]} />
      </div>
    </div>
  );
}
