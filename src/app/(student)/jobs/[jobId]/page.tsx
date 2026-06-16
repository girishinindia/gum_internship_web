'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { ApiError } from '@/lib/types';
import { Badge, Button, Modal, Textarea, Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function JobDetailPage(): JSX.Element {
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
      toast('success', data.resumeAttached ? 'Applied — your portfolio + resume were attached!' : 'Applied! Tip: add a resume in your portfolio.');
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not apply.');
    } finally { setBusy(false); }
  };

  if (!job) return <div className="flex justify-center p-12"><Spinner /></div>;
  if (job.error) return <p className="card p-8 text-center text-danger-700">Job not found or no longer open.</p>;

  const stipend = job.stipendMin || job.stipendMax
    ? (job.stipendMin && job.stipendMax ? `${inr(Number(job.stipendMin))}–${inr(Number(job.stipendMax))}` : inr(Number(job.stipendMin ?? job.stipendMax)))
    : 'Unpaid / TBD';

  return (
    <div className="max-w-2xl">
      <Link href="/jobs" className="text-body-sm text-neutral-500 hover:text-neutral-800">‹ Job board</Link>
      <div className="card mt-3 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-h2">{job.title}</h1>
            <p className="mt-1 text-body-sm text-neutral-600">{job.company} · {job.location ?? 'Anywhere'}</p>
          </div>
          <Badge tone="primary" className="capitalize">{job.workMode} · {String(job.employmentType).replace('_', ' ')}</Badge>
        </div>
        <p className="mt-3 text-body font-medium text-neutral-800">{stipend}</p>
        {(job.skills as string[])?.length > 0 && (
          <p className="mt-3 flex flex-wrap gap-1.5">{(job.skills as string[]).map((s) => <span key={s} className="badge bg-neutral-100 text-neutral-600">{s}</span>)}</p>
        )}
        <div className="mt-4 whitespace-pre-line text-body text-neutral-700">{job.description}</div>

        {job.companyAbout && (
          <div className="mt-5 rounded-xl bg-neutral-50 p-4">
            <p className="text-body-sm font-semibold text-neutral-800">About {job.company}</p>
            <p className="mt-1 text-body-sm text-neutral-600">{job.companyAbout}</p>
            {job.website && <a href={job.website} target="_blank" rel="noopener" className="mt-1 inline-block text-body-sm text-primary-700 hover:underline">{job.website}</a>}
          </div>
        )}

        <Button className="mt-6" onClick={() => setOpen(true)} disabled={applied}>{applied ? 'Applied ✓' : 'Apply with my portfolio'}</Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Apply"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={apply}>Submit application</Button></>}>
        <p className="text-body-sm text-neutral-600">Your public portfolio handle and resume are attached automatically. Add a short note (optional):</p>
        <div className="mt-3"><Textarea label="Cover note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} placeholder="Why you're a great fit…" /></div>
      </Modal>
    </div>
  );
}
