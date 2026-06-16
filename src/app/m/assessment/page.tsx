'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { MobileEmpty, Skeleton } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const EMOJI: Record<string, string> = { ready: '🚀', developing: '📈', foundational: '🌱' };

export default function MobileAssessment(): JSX.Element {
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
    try { const { data } = await api<Any>(`/assessment/${t}`); setQuestions(data.questions); }
    catch { toast('danger', 'Could not load.'); }
  };
  const submit = async (): Promise<void> => {
    if (!track || !questions) return; setBusy(true);
    try {
      const payload = questions.map((q) => ({ questionId: q.id, selectedIndex: answers[q.id] ?? -1 }));
      const { data } = await api<Any>('/assessment/submit', { method: 'POST', body: JSON.stringify({ track, answers: payload }) });
      setResult(data);
    } catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not score.'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <AppBar leading="back" backHref="/m/profile" title="Skill check" />
      <div className="p-4">
        {!tracks ? <Skeleton count={3} />
        : result ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
              <p className="text-5xl">{EMOJI[result.readiness] ?? '🎯'}</p>
              <p className="mt-2 text-h2 text-primary-700">{result.score}%</p>
              <p className="text-body-sm text-neutral-600">{result.correctCount}/{result.questionCount} · {result.readiness}</p>
              <p className="mt-2 text-body-sm text-neutral-700">{result.message}</p>
            </div>
            {(result.recommendations as Any[])?.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium">Recommended</p>
                {(result.recommendations as Any[]).map((r) => (
                  <Link key={r.id} href={`/m/internships/${r.slug}`} className="block rounded-xl border border-neutral-200 bg-white p-3 active:bg-neutral-50">{r.title}</Link>
                ))}
              </div>
            )}
            <button onClick={() => { setTrack(null); setQuestions(null); setResult(null); }} className="h-11 w-full rounded-xl border border-neutral-200 font-medium">Try another track</button>
          </div>
        ) : !track ? (
          tracks.length === 0 ? <MobileEmpty title="No tracks" /> : (
            <>
              <p className="text-body-sm text-neutral-600">Pick a track:</p>
              <div className="mt-3 flex flex-wrap gap-2">{tracks.map((t) => <button key={t} onClick={() => begin(t)} className="pill bg-neutral-100 capitalize text-neutral-700">{t}</button>)}</div>
            </>
          )
        ) : !questions ? <Skeleton count={3} />
        : (
          <div className="space-y-3">
            <button onClick={() => { setTrack(null); setQuestions(null); }} className="text-body-sm font-medium text-primary-600">‹ Choose another track</button>
            {questions.map((q, i) => (
              <div key={q.id} className="rounded-xl border border-neutral-200 bg-white p-3">
                <p className="font-medium">{i + 1}. {q.question}</p>
                <div className="mt-2 space-y-2">
                  {(q.options as string[]).map((opt, idx) => {
                    const sel = answers[q.id] === idx;
                    return <button key={idx} onClick={() => setAnswers((a) => ({ ...a, [q.id]: idx }))} className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-body-sm ${sel ? 'border-primary-400 bg-primary-50 text-primary-800' : 'border-neutral-200'}`}><span className={`grid h-4 w-4 place-items-center rounded-full border ${sel ? 'border-primary-600 bg-primary-600 text-white' : 'border-neutral-300'}`}>{sel ? '✓' : ''}</span>{opt}</button>;
                  })}
                </div>
              </div>
            ))}
            <button onClick={submit} disabled={busy || Object.keys(answers).length < questions.length} className="h-12 w-full rounded-xl bg-primary-600 font-medium text-white disabled:bg-neutral-200 disabled:text-neutral-400">{busy ? 'Scoring…' : 'See result'}</button>
          </div>
        )}
      </div>
    </>
  );
}
