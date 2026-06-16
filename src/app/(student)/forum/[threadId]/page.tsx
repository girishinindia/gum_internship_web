'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Avatar, Badge, Button, Textarea, Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function ThreadPage(): JSX.Element {
  const { threadId } = useParams<{ threadId: string }>();
  const tid = Number(threadId);
  const toast = useToast();
  const [thread, setThread] = useState<Any | null>(null);
  const [meId, setMeId] = useState<number | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    const { data } = await api<Any>(`/forum/threads/${tid}`);
    setThread(data);
  }, [tid]);

  useEffect(() => { void load().catch(() => setThread({ error: true })); }, [load]);
  useEffect(() => { void api<Any>('/users/me').then(({ data }) => setMeId(data.id)).catch(() => undefined); }, []);

  const post = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/forum/threads/${tid}/replies`, { method: 'POST', body: JSON.stringify({ body: reply }) });
      setReply('');
      await load();
    } catch (err) {
      toast('danger', err instanceof ApiError ? err.message : 'Could not reply.');
    } finally { setBusy(false); }
  };

  const accept = async (replyId: number): Promise<void> => {
    try {
      await api(`/forum/threads/${tid}/replies/${replyId}/accept`, { method: 'POST' });
      toast('success', 'Marked as the answer.');
      await load();
    } catch (err) {
      toast('danger', err instanceof ApiError ? err.message : 'Could not accept.');
    }
  };

  if (!thread) return <div className="flex justify-center p-12"><Spinner /></div>;
  if (thread.error) return <p className="card p-8 text-center text-danger-700">Thread not found.</p>;
  const isAsker = meId !== null && Number(thread.userId) === meId;

  return (
    <div className="max-w-2xl">
      <Link href="/forum" className="text-body-sm text-neutral-500 hover:text-neutral-800">‹ Forum</Link>
      <div className="card mt-3 p-5">
        <div className="flex items-center gap-2">
          {thread.isPinned && <span>📌</span>}
          <h1 className="text-h2">{thread.title}</h1>
          {thread.isResolved && <Badge tone="success">Resolved</Badge>}
          {thread.isLocked && <span title="Locked">🔒</span>}
        </div>
        <p className="mt-1 text-caption text-neutral-500">{thread.author} · {new Date(thread.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
        <p className="mt-3 whitespace-pre-line text-body text-neutral-800">{thread.body}</p>
      </div>

      <h2 className="mt-6 text-h3">{(thread.replies as Any[]).length} replies</h2>
      <ul className="mt-3 space-y-3">
        {(thread.replies as Any[]).map((r) => (
          <li key={r.id} className={`card p-4 ${r.isAccepted ? 'border-success-300 bg-success-50/40' : ''}`}>
            <div className="flex items-center gap-2">
              <Avatar name={r.author} size="sm" />
              <span className="text-body-sm font-medium text-neutral-800">{r.author}</span>
              {r.isInstructor && <Badge tone="primary">Mentor</Badge>}
              {r.isAccepted && <Badge tone="success">✓ Answer</Badge>}
              <span className="ml-auto text-caption text-neutral-400">{new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-body-sm text-neutral-700">{r.body}</p>
            {isAsker && !r.isAccepted && !thread.isResolved && (
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => accept(r.id)}>Mark as answer</Button>
            )}
          </li>
        ))}
        {(thread.replies as Any[]).length === 0 && <li className="text-body-sm text-neutral-500">No replies yet.</li>}
      </ul>

      {thread.isLocked ? (
        <p className="mt-6 text-body-sm text-neutral-500">🔒 This thread is locked.</p>
      ) : (
        <form onSubmit={post} className="mt-6 space-y-2">
          <Textarea label="Add a reply" value={reply} onChange={(e) => setReply(e.target.value)} required maxLength={8000} />
          <Button type="submit" loading={busy}>Reply</Button>
        </form>
      )}
    </div>
  );
}
