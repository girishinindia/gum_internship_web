'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Button, Markdown, Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
interface Msg { role: 'user' | 'assistant'; content: string; citations?: Any[]; flagged?: boolean }

export default function StudyBuddyPage(): JSX.Element {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const eid = Number(enrollmentId);
  const toast = useToast();
  const [meta, setMeta] = useState<Any | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [threadId, setThreadId] = useState<number | undefined>(undefined);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void api<Any>(`/enrollments/${eid}/curriculum`).then(({ data }) => setMeta(data)).catch(() => setMeta({ error: true })); }, [eid]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  const ask = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const q = input.trim();
    if (!q || !meta?.internshipId) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setBusy(true);
    try {
      const { data } = await api<Any>('/ai/ask', { method: 'POST', body: JSON.stringify({ internshipId: meta.internshipId, question: q, threadId }) });
      setThreadId(data.threadId);
      setMessages((m) => [...m, { role: 'assistant', content: data.answer, citations: data.citations, flagged: data.flagged }]);
    } catch (err) {
      toast('danger', err instanceof ApiError ? err.message : 'The study buddy is unavailable right now.');
      setMessages((m) => m.slice(0, -1));
      setInput(q);
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="glass sticky top-0 z-30">
        <div className="container-page flex h-16 items-center gap-3">
          <Link href={`/classroom/${eid}`} className="text-body-sm text-neutral-500 hover:text-neutral-800">‹ Classroom</Link>
          <h1 className="font-heading text-body font-semibold">🤖 AI Study Buddy</h1>
        </div>
      </header>

      <main className="container-page flex w-full max-w-3xl flex-1 flex-col py-6">
        {!meta ? <div className="flex flex-1 items-center justify-center"><Spinner /></div> : (
          <>
            <div className="flex-1 space-y-4">
              {messages.length === 0 && (
                <div className="card p-6 text-center text-neutral-600">
                  <p className="text-3xl">💡</p>
                  <p className="mt-2 font-medium text-neutral-800">Ask anything about <span className="text-primary-700">{meta.internshipTitle}</span></p>
                  <p className="mt-1 text-body-sm">Answers are grounded in your lessons, with citations. It won&apos;t do your graded work for you.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-brand-gradient text-white' : 'card'}`}>
                    {m.role === 'assistant' ? <Markdown>{m.content}</Markdown> : <p className="whitespace-pre-line">{m.content}</p>}
                    {m.flagged && <p className="mt-2 text-caption text-warning-700">⚠ Part of your message looked like an instruction to the AI and was ignored.</p>}
                    {m.citations && m.citations.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-1.5 border-t border-neutral-100 pt-2 text-caption text-neutral-500">
                        Sources: {m.citations.map((c, j) => <span key={j} className="rounded bg-neutral-100 px-1.5 py-0.5">{c.title}</span>)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {busy && <div className="card inline-flex items-center gap-2 px-4 py-3 text-body-sm text-neutral-500"><Spinner className="h-4 w-4" /> Thinking…</div>}
              <div ref={endRef} />
            </div>

            <form onSubmit={ask} className="sticky bottom-0 mt-4 flex gap-2 bg-neutral-50 py-2">
              <input className="input flex-1" placeholder="Ask about a concept, lesson, or task…" value={input} onChange={(e) => setInput(e.target.value)} disabled={busy} />
              <Button type="submit" loading={busy} disabled={!input.trim()}>Ask</Button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
