'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { ApiError } from '@/lib/types';
import { BottomSheet, Skeleton } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function MobileJobDetail(): JSX.Element {
  const { jobId } = useParams<{ jobId: string }>();
  const jid = Number(jobId);
  const toast = useToast();
  const [job, setJob] = useState<Any | null>(null);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => { void api<Any>(`/jobs/${jid}`).then(({ data }) => setJob(data)).catch(() => setJob({ error: true })); }, [jid]);

  const apply = async (): Promise<void> => {
    setBusy(true);
    try {
      const { data } = await api<Any>(`/jobs/${jid}/apply`, { method: 'POST', body: JSON.stringify({ coverNote: note || undefined }) });
      setApplied(true); setOpen(false);
      toast('success', data.resumeAttached ? 'Applied — portfolio + resume attached!' : 'Applied!');
    } catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not apply.'); }
    finally { setBusy(false); }
  };

  const stipend = job && (job.stipendMin || job.stipendMax)
    ? (job.stipendMin && job.stipendMax ? `${inr(Number(job.stipendMin))}–${inr(Number(job.stipendMax))}` : inr(Number(job.stipendMin ?? job.stipendMax)))
    : 'Unpaid / TBD';

  return (
    <>
      <AppBar variant="brand" leading="back" backHref="/m/jobs" title={job?.title ?? 'Job'} />
      {!job ? <div className="p-4"><Skeleton count={3} /></div>
      : job.error ? <div className="p-8 text-center text-danger-700">Job not found.</div>
      : (
        <div className="p-4 pb-28">
          <p className="text-body-sm text-neutral-600">{job.company} · {job.location ?? 'Anywhere'}</p>
          <p className="mt-1 font-medium text-neutral-900">{stipend}</p>
          <span className="pill mt-2 inline-block bg-primary-50 capitalize text-primary-700">{job.workMode} · {String(job.employmentType).replace('_', ' ')}</span>
          {(job.skills as string[])?.length > 0 && <p className="mt-3 flex flex-wrap gap-1.5">{(job.skills as string[]).map((s) => <span key={s} className="pill bg-neutral-100 text-neutral-600">{s}</span>)}</p>}
          <p className="mt-4 whitespace-pre-line text-body-sm text-neutral-700">{job.description}</p>
          {job.companyAbout && <div className="mt-4 rounded-2xl bg-neutral-50 p-3"><p className="text-body-sm font-semibold">About {job.company}</p><p className="mt-1 text-body-sm text-neutral-600">{job.companyAbout}</p></div>}
        </div>
      )}
      {job && !job.error && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur-xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
          <button onClick={() => setOpen(true)} disabled={applied} className="h-12 w-full rounded-xl bg-brand-gradient font-medium text-white disabled:bg-neutral-200 disabled:text-neutral-400">{applied ? 'Applied ✓' : 'Apply with my portfolio'}</button>
        </div>
      )}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Apply">
        <div className="px-5 pb-5">
          <p className="text-body-sm text-neutral-600">Your portfolio + resume attach automatically.</p>
          <textarea className="input mt-3 min-h-[90px] py-2" placeholder="Short note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} />
          <button onClick={apply} disabled={busy} className="mt-3 h-12 w-full rounded-xl bg-brand-gradient font-medium text-white">{busy ? 'Submitting…' : 'Submit application'}</button>
        </div>
      </BottomSheet>
    </>
  );
}
