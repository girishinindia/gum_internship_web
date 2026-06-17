'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Button, Spinner } from '@/components/ui';
import { VideoPlayer } from '@/components/features/VideoPlayer';
import { OfferLetterButton } from '@/components/features/OfferLetterButton';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

const ICON: Record<string, string> = { video: '▶', live: '◉', quiz: '?', document: '🗎', text: '🗎' };

export default function ClassroomPage(): JSX.Element {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const eid = Number(enrollmentId);
  const toast = useToast();

  const [data, setData] = useState<Any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState<Any | null>(null);
  const [live, setLive] = useState<Any[]>([]);
  const [marking, setMarking] = useState(false);
  const [docBusy, setDocBusy] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      const { data: d } = await api<Any>(`/enrollments/${eid}/curriculum`);
      setData(d);
      return;
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not load this classroom.');
    }
  }, [eid]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    void api<Any[]>('/me/live-sessions').then(({ data: ls }) => setLive(ls)).catch(() => undefined);
  }, []);

  // auto-select first unlocked lesson
  useEffect(() => {
    if (data && !active) {
      const all = (data.sections as Any[]).flatMap((s) => s.lessons);
      setActive(all.find((l) => !l.locked) ?? all[0] ?? null);
    }
  }, [data, active]);

  // Auto-complete once the player reports ≥90% watched (guarded: only once).
  const autoComplete = (): void => {
    if (!active || active.completed) return;
    void api(`/lessons/${active.id}/progress`, { method: 'POST', body: JSON.stringify({ enrollmentId: eid, completed: true }) })
      .then(() => { toast('success', 'Lesson auto-completed — 90% watched.'); setActive((a: Any) => (a ? { ...a, completed: true } : a)); return load(); })
      .catch(() => undefined);
  };

  // Documents live on private storage; fetch a short-lived signed URL on click.
  // Open a blank tab synchronously first so the async result isn't popup-blocked.
  const openDocument = async (): Promise<void> => {
    if (!active) return;
    setDocBusy(true);
    const w = window.open('', '_blank');
    try {
      const { data: doc } = await api<Any>(`/lessons/${active.id}/document?enrollmentId=${eid}`);
      if (w) w.location.href = doc.url; else window.location.href = doc.url;
    } catch (e) {
      if (w) w.close();
      toast('danger', e instanceof ApiError ? e.message : 'Could not open the document.');
    } finally { setDocBusy(false); }
  };

  const markComplete = async (): Promise<void> => {
    if (!active) return;
    setMarking(true);
    try {
      await api(`/lessons/${active.id}/progress`, { method: 'POST', body: JSON.stringify({ enrollmentId: eid, completed: true }) });
      toast('success', 'Lesson completed!');
      await load();
      setActive((a: Any) => (a ? { ...a, completed: true } : a));
    } catch {
      toast('danger', 'Could not save progress.');
    } finally { setMarking(false); }
  };

  const joinLive = async (liveSessionId: number): Promise<void> => {
    try {
      const { data: j } = await api<{ joinUrl: string }>(`/live-sessions/${liveSessionId}/join`, { method: 'POST', body: JSON.stringify({ enrollmentId: eid }) });
      window.open(j.joinUrl, '_blank', 'noopener');
    } catch {
      toast('danger', 'Could not get the join link yet.');
    }
  };

  if (err) return <div className="container-page py-16 text-center"><p className="card p-8 text-danger-700">{err}</p></div>;
  if (!data) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;

  const myLive = live.filter((l) => l.internshipTitle === data.internshipTitle);
  const pct = Math.round(data.progressPercent);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="glass sticky top-0 z-30">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/my" className="text-caption text-neutral-500 hover:text-neutral-800">‹ My Internships</Link>
            <p className="truncate font-heading text-body font-semibold text-neutral-900">{data.internshipTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-28 overflow-hidden rounded-full bg-neutral-200"><div className="h-full bg-brand-gradient" style={{ width: `${pct}%` }} /></div>
            <span className="text-body-sm font-medium text-neutral-700">{pct}%</span>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-6 py-6 lg:grid-cols-[320px_1fr]">
        {/* Curriculum */}
        <aside className="space-y-3">
          {(data.sections as Any[]).map((sec, si) => (
            <div key={si} className="card overflow-hidden">
              <p className="border-b border-neutral-100 px-4 py-2.5 text-body-sm font-semibold text-neutral-700">{sec.title}</p>
              <ul>
                {(sec.lessons as Any[]).map((l) => {
                  const selected = active?.id === l.id;
                  return (
                    <li key={l.id}>
                      <button
                        disabled={l.locked}
                        onClick={() => setActive(l)}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-body-sm transition ${
                          selected ? 'bg-primary-50 text-primary-700' : 'hover:bg-neutral-50'} ${l.locked ? 'cursor-not-allowed text-neutral-400' : 'text-neutral-700'}`}
                      >
                        <span className="w-4 shrink-0 text-center">{l.completed ? '✓' : l.locked ? '🔒' : (ICON[l.type] ?? '•')}</span>
                        <span className="flex-1 truncate">{l.title}</span>
                        {l.isPreview && <span className="text-caption text-primary-600">Preview</span>}
                        {l.durationMinutes ? <span className="text-caption text-neutral-400">{l.durationMinutes}m</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="card p-4">
            <p className="text-body-sm font-semibold text-neutral-700">More</p>
            <div className="mt-2 flex flex-col items-start gap-1.5 text-body-sm">
              <Link href={`/classroom/${eid}/projects`} className="text-primary-700 hover:underline">📋 Project tasks</Link>
              <Link href={`/classroom/${eid}/ai`} className="text-primary-700 hover:underline">🤖 AI study buddy</Link>
              <OfferLetterButton enrollmentId={eid} className="text-left text-primary-700 hover:underline disabled:text-neutral-400">📄 Offer letter</OfferLetterButton>
              <Link href={`/classroom/${eid}/certificate`} className="text-primary-700 hover:underline">🎓 Certificate</Link>
            </div>
          </div>
        </aside>

        {/* Lesson viewer */}
        <section className="min-w-0 space-y-4">
          {myLive.length > 0 && (
            <div className="card border-danger-200 bg-danger-50/40 p-4">
              <p className="text-body-sm font-semibold text-danger-700">● Live sessions</p>
              <ul className="mt-2 space-y-2">
                {myLive.map((s) => (
                  <li key={s.liveSessionId} className="flex items-center justify-between gap-3 text-body-sm">
                    <span>{s.title} · {new Date(s.scheduledStart).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <Button size="sm" onClick={() => joinLive(s.liveSessionId)}>Join</Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!active ? (
            <div className="card p-10 text-center text-neutral-500">Select a lesson to begin.</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
                <h1 className="text-h3">{active.title}</h1>
                {!active.completed && active.type === 'video' && !active.locked && (
                  <Button size="sm" variant="outline" loading={marking} onClick={markComplete}>Mark complete</Button>
                )}
                {active.completed && <span className="badge bg-success-50 text-success-700">Completed ✓</span>}
              </div>
              <div className="p-5">
                {active.type === 'video' && (
                  active.locked
                    ? <p className="rounded-xl bg-neutral-100 p-4 text-body-sm text-neutral-500">Complete the earlier lessons to unlock this video.</p>
                    : <VideoPlayer key={active.id} lessonId={active.id} enrollmentId={eid} title={active.title} onComplete={autoComplete} />
                )}
                {active.type === 'quiz' && active.quizId && (
                  <div className="text-center">
                    <p className="text-neutral-600">This lesson is a quiz.</p>
                    <Link href={`/classroom/${eid}/quiz/${active.quizId}`} className="btn-primary mt-3 inline-flex">Start quiz</Link>
                  </div>
                )}
                {active.type === 'live' && <p className="text-neutral-600">This is a live session — join from the Live panel above when it starts.</p>}
                {(active.type === 'document' || active.type === 'text') && (
                  active.documentUrl
                    ? <Button onClick={openDocument} loading={docBusy} className="inline-flex">Open document</Button>
                    : <p className="text-neutral-500">Reading material will appear here.</p>
                )}
                {(data.languages as string[]).filter((l) => l !== 'english').length > 0 && (
                  <LessonTranslation eid={eid} lessonId={active.id} languages={(data.languages as string[]).filter((l) => l !== 'english')} />
                )}
                {!active.completed && active.type !== 'video' && !active.locked && (
                  <div className="mt-4"><Button size="sm" variant="outline" loading={marking} onClick={markComplete}>Mark complete</Button></div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const LANG_NAME: Record<string, string> = { hindi: 'हिन्दी (Hindi)', gujarati: 'ગુજરાતી (Gujarati)', hi: 'हिन्दी', gu: 'ગુજરાતી' };

function LessonTranslation({ eid, lessonId, languages }: { eid: number; lessonId: number; languages: string[] }): JSX.Element {
  const [lang, setLang] = useState('');
  const [state, setState] = useState<{ loading: boolean; title?: string; content?: string; missing?: boolean }>({ loading: false });

  const pick = async (l: string): Promise<void> => {
    setLang(l);
    if (!l) { setState({ loading: false }); return; }
    setState({ loading: true });
    try {
      const { data } = await api<Any>(`/lessons/${lessonId}/translation?language=${encodeURIComponent(l)}`);
      setState({ loading: false, title: data.title, content: data.content });
    } catch {
      setState({ loading: false, missing: true });
    }
  };

  return (
    <div className="mt-4 border-t border-neutral-100 pt-3">
      <div className="flex items-center gap-2">
        <span className="text-caption text-neutral-500">🌐 Translate:</span>
        <select className="input !h-9 w-auto text-body-sm" value={lang} onChange={(e) => { void pick(e.target.value); }}>
          <option value="">English (original)</option>
          {languages.map((l) => <option key={l} value={l}>{LANG_NAME[l] ?? l}</option>)}
        </select>
      </div>
      {state.loading && <p className="mt-2 text-caption text-neutral-400">Loading translation…</p>}
      {state.missing && <p className="mt-2 text-caption text-neutral-400">No translation available for this lesson yet.</p>}
      {state.content && (
        <div className="mt-3 rounded-xl bg-neutral-50 p-4" lang={lang.startsWith('hi') || lang === 'hindi' ? 'hi' : 'gu'}>
          <p className="font-medium text-neutral-800">{state.title}</p>
          <p className="mt-1 whitespace-pre-line text-body-sm text-neutral-700">{state.content}</p>
        </div>
      )}
    </div>
  );
}
