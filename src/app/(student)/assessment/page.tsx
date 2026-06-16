'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Button, Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const READINESS: Record<string, { tone: string; emoji: string }> = {
  ready: { tone: 'text-success-700', emoji: '🚀' },
  developing: { tone: 'text-primary-700', emoji: '📈' },
  foundational: { tone: 'text-warning-700', emoji: '🌱' },
};

export default function AssessmentPage(): JSX.Element {
  const toast = useToast();
  const [tracks, setTracks] = useState<string[] | null>(null);
  const [track, setTrack] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Any[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<Any | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void api<{ tracks: string[] }>('/assessment/tracks').then(({ data }) => setTracks(data.tracks)).catch(() => setTracks([])); }, []);

  const begin = async (t: string): Promise<void> => {
    setTrack(t); setResult(null); setAnswers({}); setQuestions(null);
    try {
      const { data } = await api<Any>(`/assessment/${t}`);
      setQuestions(data.questions);
    } catch { toast('danger', 'Could not load the diagnostic.'); }
  };

  const submit = async (): Promise<void> => {
    if (!track || !questions) return;
    setBusy(true);
    try {
      const payload = questions.map((q) => ({ questionId: q.id, selectedIndex: answers[q.id] ?? -1 }));
      const { data } = await api<Any>('/assessment/submit', { method: 'POST', body: JSON.stringify({ track, answers: payload }) });
      setResult(data);
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not score the assessment.');
    } finally { setBusy(false); }
  };

  if (!tracks) return <div className="flex justify-center p-12"><Spinner /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-h1">Skill check</h1>
      <p className="mt-1 text-body-sm text-neutral-600">A quick diagnostic to gauge your readiness and recommend the right internship.</p>

      {result ? (
        <div className="mt-6 space-y-4">
          <div className="card p-6 text-center">
            <p className="text-5xl">{READINESS[result.readiness]?.emoji ?? '🎯'}</p>
            <p className={`mt-2 text-h2 ${READINESS[result.readiness]?.tone ?? ''}`}>{result.score}%</p>
            <p className="text-body-sm text-neutral-600">{result.correctCount}/{result.questionCount} correct · {result.readiness}</p>
            <p className="mt-2 text-body text-neutral-700">{result.message}</p>
          </div>
          {(result.recommendations as Any[])?.length > 0 && (
            <div>
              <h2 className="text-h3">Recommended for you</h2>
              <div className="mt-3 space-y-2">
                {(result.recommendations as Any[]).map((r) => (
                  <Link key={r.id} href={`/internships/${r.slug}`} className="card card-hover flex items-center justify-between p-4">
                    <span><span className="font-medium text-neutral-800">{r.title}</span><span className="ml-2 text-caption text-neutral-500">{r.category} · {r.level ?? ''}</span></span>
                    <span className="text-neutral-300">›</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <Button variant="outline" onClick={() => { setTrack(null); setQuestions(null); setResult(null); }}>Try another track</Button>
        </div>
      ) : !track ? (
        <div className="mt-6">
          <p className="text-body-sm font-medium text-neutral-700">Choose a track:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tracks.map((t) => <button key={t} onClick={() => begin(t)} className="chip capitalize">{t}</button>)}
          </div>
        </div>
      ) : !questions ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : (
        <div className="mt-6 space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="card p-5">
              <p className="font-medium text-neutral-800">{i + 1}. {q.question}</p>
              <div className="mt-3 space-y-2">
                {(q.options as string[]).map((opt, idx) => {
                  const sel = answers[q.id] === idx;
                  return (
                    <button key={idx} type="button" onClick={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-body-sm transition ${sel ? 'border-primary-400 bg-primary-50 text-primary-800' : 'border-neutral-200 hover:bg-neutral-50'}`}>
                      <span className={`grid h-4 w-4 place-items-center rounded-full border ${sel ? 'border-primary-600 bg-primary-600 text-white' : 'border-neutral-300'}`}>{sel ? '✓' : ''}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <Button fullWidth onClick={submit} loading={busy} disabled={Object.keys(answers).length < questions.length}>
            See my result
          </Button>
        </div>
      )}
    </div>
  );
}
