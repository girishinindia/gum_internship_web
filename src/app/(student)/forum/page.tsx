'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Button, Field, Textarea, Modal, EmptyState, StatusBadge, SkeletonCard } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function ForumPage(): JSX.Element {
  const toast = useToast();
  const [internships, setInternships] = useState<{ id: number; title: string }[]>([]);
  const [internshipId, setInternshipId] = useState<number | null>(null);
  const [threads, setThreads] = useState<Any[] | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<Any[]>('/enrollments/me').then(({ data }) => {
      const list = data.map((e) => ({ id: e.internshipId ?? e.internship?.id, title: e.internship?.title })).filter((x) => x.id);
      const uniq = Array.from(new Map(list.map((x) => [x.id, x])).values());
      setInternships(uniq);
      if (uniq[0]) setInternshipId(uniq[0].id);
    }).catch(() => setInternships([]));
  }, []);

  const loadThreads = async (id: number): Promise<void> => {
    setThreads(null);
    const { data } = await api<Any[]>(`/forum/threads?internshipId=${id}&limit=50`);
    setThreads(data);
  };
  useEffect(() => { if (internshipId) void loadThreads(internshipId).catch(() => setThreads([])); }, [internshipId]);

  const create = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!internshipId) return;
    setBusy(true);
    try {
      await api('/forum/threads', { method: 'POST', body: JSON.stringify({ internshipId, title, body }) });
      toast('success', 'Posted!');
      setOpen(false); setTitle(''); setBody('');
      void loadThreads(internshipId);
    } catch (err) {
      toast('danger', err instanceof ApiError ? err.message : 'Could not post.');
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1">Doubt forum</h1>
        {internshipId && <Button size="sm" onClick={() => setOpen(true)}>Ask a question</Button>}
      </div>

      {internships.length === 0 ? (
        <EmptyState icon="💬" title="Enroll to join the conversation" message="The forum is available for internships you're enrolled in." />
      ) : (
        <>
          <select className="input mt-4 max-w-md" value={internshipId ?? ''} onChange={(e) => setInternshipId(Number(e.target.value))}>
            {internships.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
          </select>

          {!threads ? <div className="mt-6 space-y-3"><SkeletonCard /><SkeletonCard /></div>
          : threads.length === 0 ? <EmptyState icon="🧵" title="No questions yet" message="Be the first to ask — your mentor and cohort can help." />
          : (
            <ul className="mt-6 space-y-2">
              {threads.map((t) => (
                <li key={t.id}>
                  <Link href={`/forum/${t.id}`} className="card card-hover flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {t.isPinned && <span title="Pinned">📌</span>}
                        <span className="truncate font-medium text-neutral-800">{t.title}</span>
                        {t.isResolved && <StatusBadge status="resolved" />}
                        {t.isLocked && <span title="Locked">🔒</span>}
                      </div>
                      <p className="mt-0.5 text-caption text-neutral-500">{t.author} · {t.replyCount} replies</p>
                    </div>
                    <span className="text-neutral-300">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Ask a question"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={(e) => create(e as unknown as React.FormEvent)} loading={busy}>Post</Button></>}>
        <form onSubmit={create} className="space-y-3">
          <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={200} />
          <Textarea label="Your question" value={body} onChange={(e) => setBody(e.target.value)} required maxLength={8000} />
        </form>
      </Modal>
    </div>
  );
}
