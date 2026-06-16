'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { AppBar } from '@/components/mobile/AppBar';
import { Icon } from '@/components/mobile/Icon';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
interface Turn { role: 'q' | 'a' | 'feedback'; text: string }
const PRESETS = ['Backend Developer', 'Frontend Developer', 'Data Analyst', 'Flutter Developer', 'Digital Marketer'];

export default function MobileInterview(): JSX.Element {
  const toast = useToast();
  const [track, setTrack] = useState('');
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [qNum, setQNum] = useState(0); const [total, setTotal] = useState(5);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Any | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns, busy]);

  const start = async (): Promise<void> => {
    if (!track.trim()) { toast('warning', 'Pick a role.'); return; }
    setBusy(true);
    try { const { data } = await api<Any>('/ai/interview', { method: 'POST', body: JSON.stringify({ track: track.trim() }) }); setAttemptId(data.attemptId); setQNum(data.questionNumber); setTotal(data.totalQuestions); setTurns([{ role: 'q', text: data.question }]); }
    catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not start.'); }
    finally { setBusy(false); }
  };
  const send = async (): Promise<void> => {
    if (!answer.trim() || !attemptId) return; const a = answer.trim(); setAnswer('');
    setTurns((t) => [...t, { role: 'a', text: a }]); setBusy(true);
    try {
      const { data } = await api<Any>(`/ai/interview/${attemptId}/answer`, { method: 'POST', body: JSON.stringify({ answer: a }) });
      if (data.done) { if (data.feedback) setTurns((t) => [...t, { role: 'feedback', text: data.feedback }]); setResult(data); }
      else { setTurns((t) => [...t, ...(data.feedback ? [{ role: 'feedback' as const, text: data.feedback }] : []), { role: 'q', text: data.question }]); setQNum(data.questionNumber); }
    } catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not submit.'); setAnswer(a); }
    finally { setBusy(false); }
  };

  return (
    <>
      <AppBar variant="brand" leading="back" backHref="/m/profile" title={attemptId ? `Mock interview · ${track}` : 'Mock interview'} />
      <div className="p-4">
        {!attemptId ? (
          <div className="space-y-3">
            <input className="input" placeholder="Role, e.g. Backend Developer" value={track} onChange={(e) => setTrack(e.target.value)} />
            <div className="flex flex-wrap gap-2">{PRESETS.map((p) => <button key={p} onClick={() => setTrack(p)} className={`pill ${track === p ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700'}`}>{p}</button>)}</div>
            <button onClick={start} disabled={busy} className="h-12 w-full rounded-xl bg-primary-600 font-medium text-white">{busy ? 'Starting…' : 'Start interview'}</button>
          </div>
        ) : (
          <div className="space-y-3">
            {turns.map((t, i) => (
              <div key={i} className={t.role === 'a' ? 'flex justify-end' : ''}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-body-sm ${t.role === 'a' ? 'bg-primary-600 text-white' : t.role === 'feedback' ? 'border border-neutral-200 bg-neutral-50 text-neutral-600' : 'rounded-2xl border border-neutral-200 bg-white'}`}>
                  {t.role === 'q' && <span className="mb-0.5 block text-caption font-semibold text-primary-700">Interviewer</span>}
                  <p className="whitespace-pre-line">{t.text}</p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
            {result ? (
              <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
                <p className="text-4xl">{result.score >= 70 ? '🎉' : '📈'}</p>
                <p className="mt-1 text-h2 text-primary-700">{result.score}/100</p>
                <button onClick={() => { setAttemptId(null); setTurns([]); setResult(null); setTrack(''); }} className="mt-3 h-11 w-full rounded-xl border border-neutral-200 font-medium">New interview</button>
              </div>
            ) : (
              <div className="sticky bottom-0 bg-neutral-50 py-2">
                <p className="mb-1 text-caption text-neutral-500">Question {qNum} of {total}</p>
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="Your answer…" value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={busy} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void send(); } }} />
                  <button onClick={send} disabled={busy || !answer.trim()} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-600 text-white disabled:bg-neutral-200 disabled:text-neutral-400"><Icon name="send" size={18} /></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
