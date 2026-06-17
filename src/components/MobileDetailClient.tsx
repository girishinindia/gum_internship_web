'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomSheet } from './MobileUI';
import { inr } from '@/lib/format';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Batch = Record<string, any>;

/**
 * Mobile detail CTA: sticky bottom bar + batch/checkout bottom sheet.
 * This is the mobile LAYOUT of the web app (not a native app), so paid uses the
 * same Razorpay WEB checkout as desktop — checkout UI is built in session 3.6;
 * until then the paid CTA routes to the shared checkout entry (parity with the
 * desktop detail page). Free internships enroll in-app instantly.
 */
export function MobileDetailClient({ slug, internshipId, pricingType, totalWithGst, gstRate, batches }: {
  slug: string; internshipId: number; pricingType: string; totalWithGst: number; gstRate: number; batches: Batch[];
}): JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<number | null>(batches[0]?.id ?? null);
  const [enrolledId, setEnrolledId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    void api<{ enrollmentId: number; status: string } | null>(`/enrollments/mine/by-internship/${internshipId}`)
      .then(({ data }) => { if (alive && data && (data.status === 'active' || data.status === 'completed')) setEnrolledId(data.enrollmentId); })
      .catch(() => undefined); // anonymous → 401 → treat as not enrolled
    return () => { alive = false; };
  }, [internshipId]);

  const enrollFree = async (): Promise<void> => {
    setBusy(true); setError(null);
    try {
      const res = await api<{ id: number; status: string }>('/enrollments', {
        method: 'POST',
        body: JSON.stringify({ internshipId, batchId }),
      });
      if (res.data.status === 'waitlisted') { setError('Batch full — you have been added to the waitlist.'); return; }
      router.push('/m/learn');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { router.push(`/login?next=/m/internships/${slug}`); return; }
      setError(e instanceof ApiError ? e.message : 'Could not enroll');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="sticky bottom-0 z-20 border-t border-neutral-200 bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        {enrolledId ? (
          <div className="flex items-center gap-3">
            <div className="flex-1"><p className="font-medium text-success-700">✓ You’re already enrolled</p></div>
            <button onClick={() => router.push(`/m/classroom/${enrolledId}`)} className="h-12 rounded-lg bg-primary-600 px-6 font-medium text-white active:bg-primary-700">
              Go to classroom
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              {pricingType === 'free'
                ? <p className="font-heading text-h3 text-success-700">FREE</p>
                : <p className="font-heading text-h3">{inr(totalWithGst)}<span className="ml-1 text-caption font-normal text-neutral-500">incl. {gstRate}% GST</span></p>}
            </div>
            <button onClick={() => setOpen(true)} className="h-12 rounded-lg bg-primary-600 px-6 font-medium text-white active:bg-primary-700">
              {pricingType === 'free' ? 'Enroll free' : 'Enroll now'}
            </button>
          </div>
        )}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={pricingType === 'free' ? 'Choose a cohort' : 'Secure checkout'}>
        {pricingType !== 'free' ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-neutral-700">Total payable</span>
              <span className="font-heading text-h3">{inr(totalWithGst)}</span>
            </div>
            <p className="text-body-sm text-neutral-600">Pay securely by UPI, card or net-banking. A GST invoice is issued to your account.</p>
            <button
              onClick={() => router.push(`/login?next=/m/internships/${slug}`)}
              className="h-12 w-full rounded-lg bg-primary-600 font-medium text-white active:bg-primary-700">
              Proceed to secure checkout
            </button>
            <p className="text-center text-caption text-neutral-500">🔒 Razorpay · GST invoice · verifiable certificate</p>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.length === 0 && <p className="text-body-sm text-neutral-600">New cohort announcing soon.</p>}
            {batches.map((b) => (
              <button key={b.id} onClick={() => setBatchId(b.id)}
                className={`flex w-full items-center justify-between rounded-lg border p-3 text-left ${batchId === b.id ? 'border-primary-600 bg-primary-50' : 'border-neutral-300'}`}>
                <span>
                  <span className="block font-medium">{b.name}</span>
                  <span className="block text-body-sm text-neutral-600">{b.startDate} → {b.endDate}</span>
                </span>
                <span className={`text-body-sm font-medium ${b.seatsLeft <= 10 ? 'text-warning-700' : 'text-success-700'}`}>
                  {b.seatsLeft > 0 ? `${b.seatsLeft} left` : 'Waitlist'}
                </span>
              </button>
            ))}
            {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
            <button onClick={enrollFree} disabled={busy || (batches.length > 0 && !batchId)}
              className="h-12 w-full rounded-lg bg-primary-600 font-medium text-white active:bg-primary-700 disabled:bg-neutral-300">
              {busy ? 'Enrolling…' : 'Confirm free enrollment'}
            </button>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
