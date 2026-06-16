'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Button, StatusBadge, EmptyState, SkeletonCard, Field, Select, Textarea } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const URL_TYPES: Record<string, string> = { github_url: 'GitHub repo URL', live_url: 'Live/demo URL', video_url: 'Video URL' };

export default function ProjectsPage(): JSX.Element {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const eid = Number(enrollmentId);
  const toast = useToast();
  const [tasks, setTasks] = useState<Any[] | null>(null);
  const [openTask, setOpenTask] = useState<number | null>(null);

  const load = async (): Promise<void> => {
    const { data } = await api<Any[]>(`/enrollments/${eid}/tasks`);
    setTasks(data);
  };
  useEffect(() => { void load().catch(() => setTasks([])); }, [eid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tasks) return <div className="min-h-screen bg-neutral-50"><div className="container-page py-8 space-y-4"><SkeletonCard /><SkeletonCard /></div></div>;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="glass sticky top-0 z-30">
        <div className="container-page flex h-16 items-center gap-3">
          <Link href={`/classroom/${eid}`} className="text-body-sm text-neutral-500 hover:text-neutral-800">‹ Classroom</Link>
          <h1 className="font-heading text-body font-semibold">Project tasks</h1>
        </div>
      </header>
      <main className="container-page py-8">
        {tasks.length === 0 ? (
          <EmptyState icon="📋" title="No project tasks yet" message="Your mentor will add weekly real-world tasks here." />
        ) : (
          <div className="space-y-4">
            {tasks.map((t) => (
              <div key={t.taskId} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-caption uppercase tracking-wide text-neutral-400">Week {t.weekNumber}{t.isMandatory ? ' · mandatory' : ''}</p>
                    <h2 className="text-h3">{t.title}</h2>
                  </div>
                  {t.latestSubmission ? <StatusBadge status={t.latestSubmission.status} /> : <span className="badge bg-neutral-100 text-neutral-600">Not started</span>}
                </div>
                {t.instructions && <p className="mt-2 whitespace-pre-line text-body-sm text-neutral-700">{t.instructions}</p>}
                <p className="mt-2 text-caption text-neutral-500">Max score {t.maxScore}{t.deadline ? ` · due ${new Date(t.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''} · {t.resubmitsLeft} resubmits left</p>

                {t.latestSubmission?.review && (
                  <div className="mt-3 rounded-xl bg-neutral-50 p-3 text-body-sm">
                    <p className="font-medium text-neutral-800">
                      Mentor review: {t.latestSubmission.review.decision === 'approved' ? '✅ Approved' : '🔁 Changes requested'}
                      {t.latestSubmission.review.totalScore !== null && <> · {t.latestSubmission.review.totalScore}/{t.maxScore}</>}
                    </p>
                    {t.latestSubmission.review.feedback && <p className="mt-1 text-neutral-700">{t.latestSubmission.review.feedback}</p>}
                  </div>
                )}

                {(!t.latestSubmission || t.latestSubmission.review?.decision === 'resubmit') && t.resubmitsLeft > 0 && (
                  openTask === t.taskId
                    ? <SubmitForm task={t} eid={eid} onDone={() => { setOpenTask(null); void load(); }} onCancel={() => setOpenTask(null)} />
                    : <Button size="sm" className="mt-3" onClick={() => setOpenTask(t.taskId)}>{t.latestSubmission ? 'Resubmit work' : 'Submit work'}</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );

  function SubmitForm({ task, onDone, onCancel }: { task: Any; eid: number; onDone: () => void; onCancel: () => void }): JSX.Element {
    const urlTypes = (task.allowedSubmissionTypes as string[]).filter((x) => x !== 'file');
    const [type, setType] = useState(urlTypes[0] ?? 'github_url');
    const [url, setUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e: React.FormEvent): Promise<void> => {
      e.preventDefault(); setBusy(true);
      try {
        await api(`/tasks/${task.taskId}/submissions`, {
          method: 'POST',
          body: JSON.stringify({ enrollmentId: eid, submissionType: type, urlValue: url, notes: notes || undefined }),
        });
        toast('success', 'Submitted for review!');
        onDone();
      } catch (err) {
        toast('danger', err instanceof ApiError ? err.message : 'Submission failed.');
        setBusy(false);
      }
    };

    if (urlTypes.length === 0) return <p className="mt-3 text-caption text-neutral-500">This task accepts file uploads — use the mobile app or contact your mentor.</p>;

    return (
      <form onSubmit={submit} className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
        {urlTypes.length > 1 && (
          <Select label="Submission type" value={type} onChange={(e) => setType(e.target.value)}>
            {urlTypes.map((x) => <option key={x} value={x}>{URL_TYPES[x] ?? x}</option>)}
          </Select>
        )}
        <Field label={URL_TYPES[type] ?? 'URL'} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" required />
        <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={busy}>Submit</Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    );
  }
}
