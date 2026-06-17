'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Button, Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function QuizPage(): JSX.Element {
  const { enrollmentId, quizId } = useParams<{ enrollmentId: string; quizId: string }>();
  const eid = Number(enrollmentId);
  const qid = Number(quizId);
  const toast = useToast();

  const [meta, setMeta] = useState<Any | null>(null);
  const [attempt, setAttempt] = useState<Any | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<Any | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void api<Any>(`/quizzes/${qid}?enrollmentId=${eid}`).then(({ data }) => setMeta(data)).catch(() => setMeta({ error: true })); }, [qid, eid]);

  const start = async (): Promise<void> => {
    setBusy(true);
    try {
      const { data } = await api<Any>(`/quizzes/${qid}/attempts`, { method: 'POST', body: JSON.stringify({ enrollmentId: eid }) });
      setAttempt(data);
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not start the quiz.');
    } finally { setBusy(false); }
  };

  const toggle = (qId: number, option: string, multi: boolean): void => {
    setAnswers((prev) => {
      const key = String(qId);
      const cur = prev[key] ?? [];
      if (multi) return { ...prev, [key]: cur.includes(option) ? cur.filter((o) => o !== option) : [...cur, option] };
      return { ...prev, [key]: [option] };
    });
  };

  const submit = async (): Promise<void> => {
    if (!attempt) return;
    setBusy(true);
    try {
      await api(`/attempts/${attempt.attemptId}/answers`, { method: 'PUT', body: JSON.stringify({ answers }) });
      await api(`/attempts/${attempt.attemptId}/submit`, { method: 'POST' });
      const { data } = await api<Any>(`/attempts/${attempt.attemptId}/result`);
      setResult(data);
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not submit the quiz.');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="glass sticky top-0 z-30">
        <div className="container-page flex h-16 items-center gap-3">
          <Link href={`/classroom/${eid}`} className="text-body-sm text-neutral-500 hover:text-neutral-800">‹ Classroom</Link>
          <h1 className="font-heading text-body font-semibold">{meta?.title ?? 'Quiz'}</h1>
        </div>
      </header>
      <main className="container-page max-w-2xl py-8">
        {!meta ? <div className="flex justify-center p-12"><Spinner /></div>
        : meta.error ? <p className="card p-8 text-center text-danger-700">Quiz unavailable.</p>
        : result ? (
          <div className="card p-8 text-center">
            <p className="text-5xl">{result.passed ? '🎉' : '📚'}</p>
            <h2 className="mt-3 text-h2">{result.passed ? 'Passed!' : 'Not passed yet'}</h2>
            <p className="mt-1 text-h3 text-primary-700">{result.percent}%</p>
            <p className="mt-1 text-body-sm text-neutral-600">{result.score}/{result.maxScore} · pass mark {meta.passPercent}%</p>
            <Link href={`/classroom/${eid}`} className="btn-primary mt-5 inline-flex">Back to classroom</Link>
          </div>
        ) : !attempt ? (
          <div className="card p-8 text-center">
            <h2 className="text-h2">{meta.title}</h2>
            <p className="mt-2 text-body-sm text-neutral-600">
              {meta.questionCount} questions · pass {meta.passPercent}%
              {meta.timeLimitMinutes ? ` · ${meta.timeLimitMinutes} min` : ''} · attempt {Number(meta.attemptsUsed) + 1} of {meta.maxAttempts}
            </p>
            {Number(meta.attemptsUsed) >= Number(meta.maxAttempts)
              ? <p className="mt-4 text-danger-700">No attempts left.</p>
              : <Button className="mt-5" onClick={start} loading={busy}>Start quiz</Button>}
          </div>
        ) : (
          <div className="space-y-4">
            {attempt.expiresAt && <p className="text-caption text-neutral-500">Submit before {new Date(attempt.expiresAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}.</p>}
            {(attempt.questions as Any[]).map((q, i) => {
              const multi = q.questionType === 'multiple_choice';
              return (
                <div key={q.id} className="card p-5">
                  <p className="font-medium text-neutral-800">{i + 1}. {q.questionText} {multi && <span className="text-caption text-neutral-400">(select all that apply)</span>}</p>
                  <div className="mt-3 space-y-2">
                    {(q.options as Any[]).map((rawOpt) => {
                      // Options are {id,text} objects; tolerate plain strings too. Answers are graded by id.
                      const optId = typeof rawOpt === 'string' ? rawOpt : String(rawOpt.id);
                      const optText = typeof rawOpt === 'string' ? rawOpt : String(rawOpt.text);
                      const selected = (answers[String(q.id)] ?? []).includes(optId);
                      return (
                        <button key={optId} type="button" onClick={() => toggle(q.id, optId, multi)}
                          className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-body-sm transition ${selected ? 'border-primary-400 bg-primary-50 text-primary-800' : 'border-neutral-200 hover:bg-neutral-50'}`}>
                          <span className={`grid h-4 w-4 place-items-center rounded-${multi ? 'sm' : 'full'} border ${selected ? 'border-primary-600 bg-primary-600 text-white' : 'border-neutral-300'}`}>{selected ? '✓' : ''}</span>
                          {optText}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <Button fullWidth onClick={submit} loading={busy}>Submit quiz</Button>
          </div>
        )}
      </main>
    </div>
  );
}
