'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/types';

interface Batch { id: number; name: string; startDate: string; seatsLeft: number }
type Enrolled = { enrollmentId: number; status: string } | null | undefined;

/**
 * Enrol call-to-action. Free internships enrol in place (with a batch picker for
 * cohorts); paid internships route to /checkout. Unauthenticated users are sent
 * to /login first (middleware also guards the protected routes).
 *
 * If the signed-in viewer already has a live enrolment, the CTA becomes a
 * "Go to classroom" link instead — so the button reflects their real state.
 */
export function EnrollCTA({ internshipId, slug, pricingType, paceType, batches, loggedIn, compact }:
  { internshipId: number; slug: string; pricingType: 'free' | 'paid' | 'stipend'; paceType: string; batches: Batch[]; loggedIn: boolean; compact?: boolean }): JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const isCohort = paceType === 'batch';
  const open = batches.filter((b) => b.seatsLeft > 0);
  const [batchId, setBatchId] = useState<number | ''>(open[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  // undefined = still checking (logged in); null = not enrolled / anon
  const [enrolled, setEnrolled] = useState<Enrolled>(loggedIn ? undefined : null);

  useEffect(() => {
    if (!loggedIn) { setEnrolled(null); return; }
    let alive = true;
    void api<Enrolled>(`/enrollments/mine/by-internship/${internshipId}`)
      .then(({ data }) => { if (alive) setEnrolled(data ?? null); })
      .catch(() => { if (alive) setEnrolled(null); });
    return () => { alive = false; };
  }, [loggedIn, internshipId]);

  const label = pricingType === 'free' ? 'Enroll for free' : 'Enroll now';

  const go = async (): Promise<void> => {
    if (!loggedIn) { router.push(`/login?next=/internships/${slug}`); return; }
    if (isCohort && !batchId) { toast('warning', 'Please pick a batch first.'); return; }
    if (pricingType === 'free') {
      setBusy(true);
      try {
        const { data } = await api<{ id: number }>('/enrollments', {
          method: 'POST',
          body: JSON.stringify({ internshipId, ...(batchId ? { batchId } : {}) }),
        });
        toast('success', 'Enrolled! Taking you to your classroom…');
        router.push(`/classroom/${data.id}`);
      } catch (e) {
        toast('danger', e instanceof ApiError ? e.message : 'Could not enroll. Please try again.');
      } finally { setBusy(false); }
    } else {
      const q = batchId ? `?batch=${batchId}` : '';
      router.push(`/checkout/${slug}${q}`);
    }
  };

  // Already enrolled → straight to the classroom.
  if (enrolled && (enrolled.status === 'active' || enrolled.status === 'completed')) {
    return (
      <div className={compact ? 'flex w-full items-center gap-2' : 'space-y-2'}>
        <Link href={`/classroom/${enrolled.enrollmentId}`} className="btn-primary w-full whitespace-nowrap text-center">
          Go to classroom →
        </Link>
        {!compact && <p className="text-center text-caption font-medium text-success-700">✓ You’re already enrolled</p>}
      </div>
    );
  }

  return (
    <div className={compact ? 'flex w-full items-center gap-2' : 'space-y-3'}>
      {isCohort && open.length > 0 && !compact && (
        <select className="input" value={batchId} onChange={(e) => setBatchId(Number(e.target.value))}>
          {open.map((b) => (
            <option key={b.id} value={b.id}>{(b.name && b.name.trim()) || 'Batch'} · starts {b.startDate} · {b.seatsLeft} seats</option>
          ))}
        </select>
      )}
      <button onClick={go} disabled={busy} className="btn-primary w-full whitespace-nowrap">
        {busy ? 'Enrolling…' : label}
      </button>
    </div>
  );
}
