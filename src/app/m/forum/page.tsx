'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { BottomSheet, MobileEmpty, Skeleton } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';
import { Fab } from '@/components/mobile/Fab';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function MobileForum(): JSX.Element {
  const toast = useToast();
  const [internships, setInternships] = useState<{ id: number; title: string }[]>([]);
  const [internshipId, setInternshipId] = useState<number | null>(null);
  const [threads, setThreads] = useState<Any[] | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<Any[]>('/enrollments/me').then(({ data }) => {
      const list = data.map((e) => ({ id: (e.internshipId ?? e.internship?.id) as number, title: (e.internship?.title ?? '') as string })).filter((x) => x.id);
      const uniq = Array.from(new Map(list.map((x) => [x.id, x])).values());
      setInternships(uniq); if (uniq[0]) setInternshipId(uniq[0].id);
    }).catch(() => setInternships([]));
  }, []);
  const loadThreads = async (id: number): Promise<void> => { setThreads(null); const { data } = await api<Any[]>(`/forum/threads?internshipId=${id}&limit=50`); setThreads(data); };
  useEffect(() => { if (internshipId) void loadThreads(internshipId).catch(() => setThreads([])); }, [internshipId]);

  const create = async (): Promise<void> => {
    if (!internshipId) return; setBusy(true);
    try { await api('/forum/threads', { method: 'POST', body: JSON.stringify({ internshipId, title, body }) }); setOpen(false); setTitle(''); setBody(''); void loadThreads(internshipId); toast('success', 'Posted!'); }
    catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not post.'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <AppBar title="Community" actions={[{ icon: 'trophy', label: 'Achievements', href: '/m/achievements' }]} />
      <div className="p-4">
        {internships.length === 0 ? <MobileEmpty title="Enroll to join" body="The forum is for internships you're enrolled in." /> : (
          <>
            <select className="input" value={internshipId ?? ''} onChange={(e) => setInternshipId(Number(e.target.value))}>
              {internships.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
            <div className="mt-3 space-y-2">
              {!threads ? <Skeleton count={3} /> : threads.length === 0 ? <MobileEmpty title="No questions yet" body="Be the first to ask." />
              : threads.map((t) => (
                <Link key={t.id} href={`/m/forum/${t.id}`} className="block rounded-xl border border-neutral-200 bg-white p-3 active:bg-neutral-50">
                  <div className="flex items-center gap-1.5">
                    {t.isPinned && <span>📌</span>}
                    <span className="line-clamp-1 flex-1 font-medium">{t.title}</span>
                    {t.isResolved && <span className="pill bg-success-50 text-success-700">✓</span>}
                    {t.isLocked && <span>🔒</span>}
                  </div>
                  <p className="text-caption text-neutral-500">{t.author} · {t.replyCount} replies</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Ask a question">
        <div className="space-y-3 px-5 pb-5">
          <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          <textarea className="input min-h-[100px] py-2" placeholder="Your question" value={body} onChange={(e) => setBody(e.target.value)} maxLength={8000} />
          <button onClick={create} disabled={busy || title.length < 3 || !body} className="h-12 w-full rounded-xl bg-primary-600 font-medium text-white disabled:bg-neutral-200 disabled:text-neutral-400">{busy ? 'Posting…' : 'Post'}</button>
        </div>
      </BottomSheet>
      {internshipId && <Fab icon="plus" label="Ask" onClick={() => setOpen(true)} />}
    </>
  );
}
