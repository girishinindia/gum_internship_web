'use client';
import { useRef, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Button, Field, Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
interface Turn { role: 'q' | 'a' | 'feedback'; text: string }
const PRESETS = ['Backend Developer', 'Frontend Developer', 'Data Analyst', 'Flutter Developer', 'Digital Marketer'];

export default function InterviewPage(): JSX.Element {
  const toast = useToast();
  const [track, setTrack] = useState('');
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [qNum, setQNum] = useState(0);
  const [total, setTotal] = useState(5);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Any | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns, busy]);

  const start = async (): Promise<void> => {
    if (!track.trim()) { toast('warning', 'Pick or type a role first.'); return; }
    setBusy(true);
    try {
      const { data } = await api<Any>('/ai/interview', { method: 'POST', body: JSON.stringify({ track: track.trim() }) });
      setAttemptId(data.attemptId); setQNum(data.questionNumber); setTotal(data.totalQuestions);
      setTurns([{ role: 'q', text: data.question }]);
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not start the interview.');
    } finally { setBusy(false); }
  };

  const send = async (): Promise<void> => {
    if (!answer.trim() || !attemptId) return;
    const a = answer.trim(); setAnswer('');
    setTurns((t) => [...t, { role: 'a', text: a }]);
    setBusy(true);
    try {
      const { data } = await api<Any>(`/ai/interview/${attemptId}/answer`, { method: 'POST', body: JSON.stringify({ answer: a }) });
      if (data.done) {
        if (data.feedback) setTurns((t) => [...t, { role: 'feedback', text: data.feedback }]);
        setResult(data);
      } else {
        setTurns((t) => [...t, ...(data.feedback ? [{ role: 'feedback' as const, text: data.feedback }] : []), { role: 'q', text: data.question }]);
        setQNum(data.questionNumber);
      }
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not submit your answer.');
      setAnswer(a);
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-h1">AI Mock Interview</h1>
      <p className="mt-1 text-body-sm text-neutral-600">Practice a track-specific interview and get scored feedback.</p>

      {!attemptId ? (
        <div className="card mt-6 space-y-4 p-6">
          <Field label="Role / track" value={track} onChange={(e) => setTrack(e.target.value)} placeholder="e.g. Backend Developer" />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p} type="button" onClick={() => setTrack(p)} className={`chip ${track === p ? 'chip-active' : ''}`}>{p}</button>
            ))}
          </div>
          <Button onClick={start} loading={busy}>Start interview</Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {turns.map((t, i) => (
            <div key={i} className={t.role === 'a' ? 'flex justify-end' : ''}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                t.role === 'a' ? 'bg-brand-gradient text-white'
                : t.role === 'feedback' ? 'border border-neutral-200 bg-neutral-50 text-body-sm text-neutral-600'
                : 'card'}`}>
                {t.role === 'q' && <span className="mb-1 block text-caption font-semibold text-primary-700">Interviewer</span>}
                {t.role === 'feedback' && <span className="mb-1 block text-caption font-semibold text-neutral-500">Feedback</span>}
                <p className="whitespace-pre-line">{t.text}</p>
              </div>
            </div>
          ))}
          {busy && <div className="card inline-flex items-center gap-2 px-4 py-3 text-body-sm text-neutral-500"><Spinner className="h-4 w-4" /> …</div>}
          <div ref={endRef} />

          {result ? (
            <div className="card p-6 text-center">
              <p className="text-4xl">{result.score >= 70 ? '🎉' : '📈'}</p>
              <p className="mt-2 text-h2 text-primary-700">{result.score}/100</p>
              <p className="mt-1 text-body-sm text-neutral-600">Interview complete</p>
              <Button className="mt-4" variant="outline" onClick={() => { setAttemptId(null); setTurns([]); setResult(null); setTrack(''); }}>New interview</Button>
            </div>
          ) : (
            <div className="sticky bottom-0 bg-neutral-50 py-2">
              <p className="mb-1 text-caption text-neutral-500">Question {qNum} of {total}</p>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Type your answer…" value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={busy}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} />
                <Button onClick={send} loading={busy} disabled={!answer.trim()}>Send</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
