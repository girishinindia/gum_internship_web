'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { BottomSheet, Skeleton } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';
import { Icon } from '@/components/mobile/Icon';
import type { IconName } from '@/components/mobile/Icon';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const ICON: Record<string, IconName> = { video: 'play', live: 'bell', quiz: 'target', document: 'receipt', text: 'receipt' };

export default function MobileClassroom(): JSX.Element {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const eid = Number(enrollmentId);
  const toast = useToast();
  const [data, setData] = useState<Any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState<Any | null>(null);
  const [play, setPlay] = useState<{ embedUrl?: string; loading: boolean; error?: string }>({ loading: false });
  const [live, setLive] = useState<Any[]>([]);
  const [marking, setMarking] = useState(false);
  const [sheet, setSheet] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try { const { data: d } = await api<Any>(`/enrollments/${eid}/curriculum`); setData(d); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Could not load this classroom.'); }
  }, [eid]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void api<Any[]>('/me/live-sessions').then(({ data: ls }) => setLive(ls)).catch(() => undefined); }, []);

  useEffect(() => {
    if (data && !active) {
      const all = (data.sections as Any[]).flatMap((s) => s.lessons);
      setActive(all.find((l) => !l.locked) ?? all[0] ?? null);
    }
  }, [data, active]);

  useEffect(() => {
    if (!active || active.type !== 'video' || active.locked) { setPlay({ loading: false }); return; }
    setPlay({ loading: true });
    void api<Any>(`/lessons/${active.id}/play?enrollmentId=${eid}`)
      .then(({ data: p }) => setPlay({ loading: false, embedUrl: p.embedUrl }))
      .catch((e) => setPlay({ loading: false, error: e instanceof ApiError ? e.message : 'Playback unavailable.' }));
  }, [active, eid]);

  const markComplete = async (): Promise<void> => {
    if (!active) return; setMarking(true);
    try {
      await api(`/lessons/${active.id}/progress`, { method: 'POST', body: JSON.stringify({ enrollmentId: eid, completed: true }) });
      toast('success', 'Lesson completed!'); await load();
      setActive((a: Any) => (a ? { ...a, completed: true } : a));
    } catch { toast('danger', 'Could not save progress.'); }
    finally { setMarking(false); }
  };
  const joinLive = async (id: number): Promise<void> => {
    try { const { data: j } = await api<{ joinUrl: string }>(`/live-sessions/${id}/join`, { method: 'POST', body: JSON.stringify({ enrollmentId: eid }) }); window.open(j.joinUrl, '_blank', 'noopener'); }
    catch { toast('danger', 'Could not get the join link yet.'); }
  };

  if (err) return <div className="p-8 text-center text-danger-700">{err}</div>;
  if (!data) return <div className="p-4"><Skeleton count={2} /></div>;
  const myLive = live.filter((l) => l.internshipTitle === data.internshipTitle);
  const pct = Math.round(data.progressPercent);

  return (
    <>
      <AppBar variant="brand" leading="back" backHref="/m/learn" title={data.internshipTitle}
        actions={[{ icon: 'robot', label: 'AI buddy', href: `/classroom/${eid}/ai` }, { icon: 'dots', label: 'More', href: `/classroom/${eid}/certificate` }]} />
      <div className="h-1.5 bg-neutral-200"><div className="h-full bg-brand-gradient" style={{ width: `${pct}%` }} /></div>

      <div className="space-y-4 p-4 pb-28">
        {myLive.length > 0 && (
          <div className="rounded-2xl border border-danger-200 bg-danger-50/50 p-3">
            <p className="text-body-sm font-semibold text-danger-700">● Live now / soon</p>
            {myLive.map((s) => (
              <div key={s.liveSessionId} className="mt-2 flex items-center justify-between gap-2 text-body-sm">
                <span className="line-clamp-1">{s.title}</span>
                <button onClick={() => joinLive(s.liveSessionId)} className="pill bg-danger-600 px-4 text-white">Join</button>
              </div>
            ))}
          </div>
        )}

        {!active ? <p className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">Open the lesson list to begin.</p> : (
          <div>
            <h1 className="text-h3 font-heading">{active.title}</h1>
            <div className="mt-3">
              {active.type === 'video' && (
                play.loading ? <div className="grid aspect-video place-items-center rounded-2xl bg-neutral-100"><Icon name="play" className="text-neutral-400" /></div>
                : play.error ? <p className="rounded-2xl bg-danger-50 p-4 text-body-sm text-danger-700">{play.error}</p>
                : play.embedUrl ? <div className="aspect-video overflow-hidden rounded-2xl bg-black"><iframe src={play.embedUrl} className="h-full w-full" allow="autoplay; fullscreen" allowFullScreen title={active.title} /></div>
                : <p className="text-neutral-500">No video uploaded yet.</p>
              )}
              {active.type === 'quiz' && active.quizId && <Link href={`/classroom/${eid}/quiz/${active.quizId}`} className="block rounded-2xl bg-primary-600 py-3 text-center font-medium text-white">Start quiz</Link>}
              {active.type === 'live' && <p className="text-neutral-600">Join live sessions from the banner above.</p>}
              {(active.type === 'document' || active.type === 'text') && (active.documentUrl ? <a href={active.documentUrl} target="_blank" rel="noopener" className="block rounded-2xl bg-primary-600 py-3 text-center font-medium text-white">Open document</a> : <p className="text-neutral-500">Reading material appears here.</p>)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Link href={`/classroom/${eid}/projects`} className="flex flex-col items-center gap-1 rounded-2xl border border-neutral-200 bg-white py-3 text-caption text-neutral-700"><Icon name="receipt" size={20} /> Projects</Link>
          <Link href={`/classroom/${eid}/ai`} className="flex flex-col items-center gap-1 rounded-2xl border border-neutral-200 bg-white py-3 text-caption text-neutral-700"><Icon name="robot" size={20} /> AI buddy</Link>
          <Link href={`/classroom/${eid}/certificate`} className="flex flex-col items-center gap-1 rounded-2xl border border-neutral-200 bg-white py-3 text-caption text-neutral-700"><Icon name="school" size={20} /> Certificate</Link>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur-xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
        <button onClick={() => setSheet(true)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 font-medium text-neutral-700">
          <Icon name="menu" size={20} /> Lessons
        </button>
        {active && !active.completed && active.type === 'video' && !active.locked && (
          <button onClick={markComplete} disabled={marking} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-brand-gradient font-medium text-white">{marking ? 'Saving…' : 'Mark complete'}</button>
        )}
        {active?.completed && <span className="flex h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-success-50 font-medium text-success-700"><Icon name="check" size={18} /> Done</span>}
      </div>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title={`Curriculum · ${pct}%`}>
        <div className="max-h-[60vh] overflow-y-auto pb-4">
          {(data.sections as Any[]).map((sec, si) => (
            <div key={si}>
              <p className="px-5 pb-1 pt-3 text-caption font-semibold uppercase tracking-wide text-neutral-400">{sec.title}</p>
              {(sec.lessons as Any[]).map((l) => {
                const selected = active?.id === l.id;
                return (
                  <button key={l.id} disabled={l.locked} onClick={() => { setActive(l); setSheet(false); }}
                    className={`flex w-full items-center gap-3 px-5 py-3 text-left text-body-sm ${selected ? 'bg-primary-50 text-primary-700' : l.locked ? 'text-neutral-400' : 'text-neutral-700 active:bg-neutral-100'}`}>
                    <span className="w-5">{l.completed ? <Icon name="check" size={18} className="text-success-600" /> : <Icon name={ICON[l.type] ?? 'play'} size={18} />}</span>
                    <span className="flex-1 truncate">{l.title}</span>
                    {l.isPreview && <span className="text-caption text-primary-600">Preview</span>}
                    {l.durationMinutes ? <span className="text-caption text-neutral-400">{l.durationMinutes}m</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
