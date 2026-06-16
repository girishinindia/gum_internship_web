'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Button, Field, Textarea, Badge, EmptyState, SkeletonCard, Modal } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function ReviewQueuePage(): JSX.Element {
  const toast = useToast();
  const [items, setItems] = useState<Any[] | null>(null);
  const [active, setActive] = useState<Any | null>(null);

  const load = async (): Promise<void> => {
    const { data } = await api<Any[]>('/instructor/review-queue?limit=50');
    setItems(data);
  };
  useEffect(() => { void load().catch(() => setItems([])); }, []);

  if (!items) return <div className="space-y-4"><h1 className="text-h1">Review queue</h1><SkeletonCard /></div>;

  return (
    <div>
      <h1 className="text-h1">Review queue</h1>
      <p className="mt-1 text-body-sm text-neutral-600">Submitted project work awaiting your rubric review.</p>
      {items.length === 0 ? (
        <EmptyState icon="✅" title="All caught up" message="No submissions waiting for review." />
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((s) => (
            <li key={s.submissionId} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-800">{s.taskTitle}</span>
                  {s.isLate && <Badge tone="warning">Late</Badge>}
                  <Badge tone="neutral">v{s.version}</Badge>
                </div>
                <p className="text-caption text-neutral-500">{s.studentName} · {s.internshipTitle} · submitted {new Date(s.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              </div>
              <div className="flex items-center gap-2">
                {s.urlValue && <a href={s.urlValue} target="_blank" rel="noopener" className="text-body-sm text-primary-700 hover:underline">Open work ↗</a>}
                <Button size="sm" onClick={() => setActive(s)}>Review</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {active && <ReviewModal submission={active} onClose={() => setActive(null)} onDone={() => { setActive(null); void load(); }} />}
    </div>
  );

  function ReviewModal({ submission, onClose, onDone }: { submission: Any; onClose: () => void; onDone: () => void }): JSX.Element {
    const rubric: Any[] = Array.isArray(submission.rubric) ? submission.rubric : [];
    const [scores, setScores] = useState<Record<string, number>>(Object.fromEntries(rubric.map((r) => [r.criterion, 0])));
    const [decision, setDecision] = useState<'approved' | 'resubmit'>('approved');
    const [feedback, setFeedback] = useState('');
    const [busy, setBusy] = useState(false);
    const total = Object.values(scores).reduce((s, n) => s + (Number(n) || 0), 0);

    const submit = async (): Promise<void> => {
      setBusy(true);
      try {
        const rubricScores = rubric.length
          ? rubric.map((r) => ({ criterion: r.criterion, points: Number(scores[r.criterion]) || 0 }))
          : [{ criterion: 'Overall', points: total }];
        await api(`/submissions/${submission.submissionId}/review`, {
          method: 'POST', body: JSON.stringify({ decision, rubricScores, feedback: feedback || undefined }),
        });
        toast('success', decision === 'approved' ? 'Approved!' : 'Sent back for changes.');
        onDone();
      } catch (e) {
        toast('danger', e instanceof ApiError ? e.message : 'Could not submit review.');
        setBusy(false);
      }
    };

    return (
      <Modal open onClose={onClose} title={`Review · ${submission.taskTitle}`}
        footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={submit}>Submit review</Button></>}>
        <div className="space-y-4">
          {submission.urlValue && <a href={submission.urlValue} target="_blank" rel="noopener" className="block text-body-sm text-primary-700 hover:underline">Open submitted work ↗</a>}
          {submission.notes && <p className="rounded-xl bg-neutral-50 p-3 text-body-sm text-neutral-700">{submission.notes}</p>}

          {rubric.length > 0 ? (
            <div className="space-y-2">
              <p className="text-body-sm font-medium text-neutral-700">Rubric · {total}/{submission.maxScore}</p>
              {rubric.map((r) => (
                <label key={r.criterion} className="flex items-center justify-between gap-3">
                  <span className="text-body-sm text-neutral-700">{r.criterion} <span className="text-caption text-neutral-400">/ {r.max_points}</span></span>
                  <input type="number" min={0} max={r.max_points} value={scores[r.criterion] ?? 0}
                    onChange={(e) => setScores((s) => ({ ...s, [r.criterion]: Math.min(Number(e.target.value), r.max_points) }))}
                    className="input !h-9 w-24" />
                </label>
              ))}
            </div>
          ) : (
            <Field label={`Score / ${submission.maxScore}`} type="number" value={String(total)} onChange={(e) => setScores({ Overall: Number(e.target.value) })} />
          )}

          <div className="flex gap-2">
            <button type="button" onClick={() => setDecision('approved')} className={`chip ${decision === 'approved' ? 'chip-active' : ''}`}>Approve</button>
            <button type="button" onClick={() => setDecision('resubmit')} className={`chip ${decision === 'resubmit' ? 'chip-active' : ''}`}>Request changes</button>
          </div>
          <Textarea label="Feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={4000} placeholder="What was great, what to improve…" />
        </div>
      </Modal>
    );
  }
}
