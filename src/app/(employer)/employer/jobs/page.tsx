'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Button, Field, Textarea, Select, Modal, StatusBadge, EmptyState, SkeletonCard } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function EmployerJobsPage(): JSX.Element {
  const toast = useToast();
  const [jobs, setJobs] = useState<Any[] | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', description: '', location: '', workMode: 'remote', employmentType: 'internship', stipendMin: '', stipendMax: '', skills: '' });
  const [busy, setBusy] = useState(false);

  const load = async (): Promise<void> => { const { data } = await api<Any[]>('/employer/jobs'); setJobs(data); };
  useEffect(() => { void load().catch(() => setJobs([])); }, []);

  const create = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault(); setBusy(true);
    try {
      await api('/jobs', { method: 'POST', body: JSON.stringify({
        title: f.title, description: f.description, location: f.location || undefined,
        workMode: f.workMode, employmentType: f.employmentType,
        stipendMin: f.stipendMin ? Number(f.stipendMin) : undefined, stipendMax: f.stipendMax ? Number(f.stipendMax) : undefined,
        skills: f.skills.split(',').map((s) => s.trim()).filter(Boolean),
      }) });
      toast('success', 'Draft job created.');
      setOpen(false); setF({ title: '', description: '', location: '', workMode: 'remote', employmentType: 'internship', stipendMin: '', stipendMax: '', skills: '' });
      void load();
    } catch (err) {
      toast('danger', err instanceof ApiError ? err.message : 'Could not create job.');
    } finally { setBusy(false); }
  };

  const submit = async (id: number): Promise<void> => {
    try { await api(`/jobs/${id}/submit`, { method: 'POST' }); toast('success', 'Submitted for review.'); void load(); }
    catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not submit (is your company verified?).'); }
  };
  const close = async (id: number): Promise<void> => {
    try { await api(`/jobs/${id}/close`, { method: 'POST' }); toast('success', 'Job closed.'); void load(); }
    catch { toast('danger', 'Could not close.'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1">Jobs</h1>
        <Button size="sm" onClick={() => setOpen(true)}>Post a job</Button>
      </div>

      {!jobs ? <div className="mt-6"><SkeletonCard /></div>
      : jobs.length === 0 ? <EmptyState icon="💼" title="No jobs yet" message="Post your first role. It goes live after admin review." />
      : (
        <div className="mt-6 space-y-3">
          {jobs.map((j) => (
            <div key={j.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2"><span className="font-medium text-neutral-800">{j.title}</span><StatusBadge status={j.status} /></div>
                <p className="text-caption text-neutral-500 capitalize">{j.workMode} · {String(j.employmentType).replace('_', ' ')} · {j.applicants} applicant{j.applicants === 1 ? '' : 's'}</p>
              </div>
              <div className="flex items-center gap-2">
                {j.applicants > 0 && <Link href={`/employer/jobs/${j.id}`} className="text-body-sm font-medium text-primary-700 hover:underline">Applicants</Link>}
                {['draft', 'rejected'].includes(j.status) && <Button size="sm" onClick={() => submit(j.id)}>Submit</Button>}
                {j.status === 'published' && <Button size="sm" variant="ghost" onClick={() => close(j.id)}>Close</Button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Post a job"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={(e) => create(e as unknown as React.FormEvent)}>Create draft</Button></>}>
        <form onSubmit={create} className="space-y-3">
          <Field label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required minLength={3} />
          <Textarea label="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required minLength={10} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Work mode" value={f.workMode} onChange={(e) => setF({ ...f, workMode: e.target.value })}>
              <option value="remote">Remote</option><option value="onsite">Onsite</option><option value="hybrid">Hybrid</option>
            </Select>
            <Select label="Type" value={f.employmentType} onChange={(e) => setF({ ...f, employmentType: e.target.value })}>
              <option value="internship">Internship</option><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="contract">Contract</option>
            </Select>
          </div>
          <Field label="Location (optional)" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Stipend min (₹)" type="number" value={f.stipendMin} onChange={(e) => setF({ ...f, stipendMin: e.target.value })} />
            <Field label="Stipend max (₹)" type="number" value={f.stipendMax} onChange={(e) => setF({ ...f, stipendMax: e.target.value })} />
          </div>
          <Field label="Skills (comma-separated)" value={f.skills} onChange={(e) => setF({ ...f, skills: e.target.value })} placeholder="node, react, sql" />
        </form>
      </Modal>
    </div>
  );
}
