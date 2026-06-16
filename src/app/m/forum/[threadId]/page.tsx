'use client';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Skeleton } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function MobileThread(): JSX.Element {
  const { threadId } = useParams<{ threadId: string }>();
  const tid = Number(threadId);
  const toast = useToast();
  const [thread, setThread] = useState<Any | null>(null);
  const [meId, setMeId] = useState<number | null>(null);
  const [reply, setReply] = useState(''); const [busy, setBusy] = useState(false);

  const load = useCallback(async (): Promise<void> => { const { data } = await api<Any>(`/forum/threads/${tid}`); setThread(data); }, [tid]);
  useEffect(() => { void load().catch(() => setThread({ error: true })); }, [load]);
  useEffect(() => { void api<Any>('/users/me').then(({ data }) => setMeId(data.id)).catch(() => undefined); }, []);

  const post = async (): Promise<void> => {
    if (!reply.trim()) return; setBusy(true);
    try { await api(`/forum/threads/${tid}/replies`, { method: 'POST', body: JSON.stringify({ body: reply }) }); setReply(''); await load(); }
    catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not reply.'); }
    finally { setBusy(false); }
  };
  const accept = async (rid: number): Promise<void> => {
    try { await api(`/forum/threads/${tid}/replies/${rid}/accept`, { method: 'POST' }); toast('success', 'Marked as answer.'); await load(); }
    catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not accept.'); }
  };

  if (!thread) return <div className="p-4"><Skeleton count={3} /></div>;
  if (thread.error) return <div className="p-8 text-center text-danger-700">Thread not found.</div>;
  const isAsker = meId !== null && Number(thread.userId) === meId;

  return (
    <>
      <AppBar variant="brand" leading="back" backHref="/m/forum" title={thread.title} />
      <div className="p-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <div className="flex items-center gap-1.5">
            <span className="flex-1 font-medium">{thread.title}</span>
            {thread.isResolved && <span className="pill bg-success-50 text-success-700">Resolved</span>}
            {thread.isLocked && <span>🔒</span>}
          </div>
          <p className="text-caption text-neutral-500">{thread.author}</p>
          <p className="mt-2 whitespace-pre-line text-body-sm text-neutral-800">{thread.body}</p>
        </div>

        <p className="mt-4 font-medium">{(thread.replies as Any[]).length} replies</p>
        <div className="mt-2 space-y-2">
          {(thread.replies as Any[]).map((r) => (
            <div key={r.id} className={`rounded-xl border p-3 ${r.isAccepted ? 'border-success-300 bg-success-50/40' : 'border-neutral-200 bg-white'}`}>
              <div className="flex items-center gap-1.5 text-caption">
                <span className="font-medium text-neutral-700">{r.author}</span>
                {r.isInstructor && <span className="pill bg-primary-50 text-primary-700">Mentor</span>}
                {r.isAccepted && <span className="pill bg-success-50 text-success-700">✓ Answer</span>}
              </div>
              <p className="mt-1 whitespace-pre-line text-body-sm text-neutral-700">{r.body}</p>
              {isAsker && !r.isAccepted && !thread.isResolved && <button onClick={() => accept(r.id)} className="mt-1 text-caption text-primary-600">Mark as answer</button>}
            </div>
          ))}
        </div>
      </div>

      {!thread.isLocked && (
        <div className="sticky bottom-0 flex gap-2 border-t border-neutral-200 bg-white p-3">
          <input className="input flex-1" placeholder="Reply…" value={reply} onChange={(e) => setReply(e.target.value)} disabled={busy} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void post(); } }} />
          <button onClick={post} disabled={busy || !reply.trim()} className="pill bg-primary-600 px-4 text-white">Send</button>
        </div>
      )}
    </>
  );
}
