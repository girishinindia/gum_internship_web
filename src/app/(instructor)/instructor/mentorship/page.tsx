'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { ApiError } from '@/lib/types';
import { Button, Field, StatusBadge, EmptyState, SkeletonCard } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function InstructorMentorshipPage(): JSX.Element {
  const toast = useToast();
  const [slots, setSlots] = useState<Any[] | null>(null);
  const [startsAt, setStartsAt] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (): Promise<void> => { const { data } = await api<Any[]>('/mentorship/slots/mine'); setSlots(data); };
  useEffect(() => { void load().catch(() => setSlots([])); }, []);

  const create = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!startsAt) return;
    setBusy(true);
    try {
      await api('/mentorship/slots', {
        method: 'POST',
        body: JSON.stringify({ startsAt: new Date(startsAt).toISOString(), durationMinutes: Number(duration), price: Number(price), topic: topic || undefined }),
      });
      toast('success', 'Slot published.');
      setStartsAt(''); setTopic(''); setPrice(0);
      void load();
    } catch (err) {
      toast('danger', err instanceof ApiError ? err.message : 'Could not create slot.');
    } finally { setBusy(false); }
  };

  const cancel = async (id: number): Promise<void> => {
    try { await api(`/mentorship/slots/${id}`, { method: 'DELETE' }); toast('success', 'Slot cancelled.'); void load(); }
    catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not cancel.'); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-h1">Mentorship slots</h1>
      <p className="mt-1 text-body-sm text-neutral-600">Publish 1:1 slots learners can book. Free slots confirm instantly; paid slots collect payment.</p>

      <form onSubmit={create} className="card mt-6 space-y-4 p-5">
        <Field label="Date & time" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Duration (min)" type="number" value={String(duration)} onChange={(e) => setDuration(Number(e.target.value))} min={15} max={180} />
          <Field label="Price (₹, 0 = free)" type="number" value={String(price)} onChange={(e) => setPrice(Number(e.target.value))} min={0} />
        </div>
        <Field label="Topic (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Career guidance, code review" maxLength={200} />
        <Button type="submit" loading={busy}>Publish slot</Button>
      </form>

      <h2 className="mt-8 text-h3">Your slots</h2>
      {!slots ? <div className="mt-3"><SkeletonCard /></div>
      : slots.length === 0 ? <EmptyState icon="🗓️" title="No slots yet" message="Publish your first slot above." />
      : (
        <div className="mt-3 space-y-2">
          {slots.map((s) => (
            <div key={s.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2"><span className="font-medium text-neutral-800">{s.topic ?? '1:1 mentorship'}</span><StatusBadge status={s.status} /></div>
                <p className="text-caption text-neutral-500">
                  {new Date(s.startsAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {s.durationMinutes} min · {Number(s.price) > 0 ? inr(Number(s.price)) : 'Free'}
                  {s.studentName && <> · booked by {s.studentName}</>}
                </p>
              </div>
              {s.status === 'open' && <Button size="sm" variant="ghost" onClick={() => cancel(s.id)}>Cancel</Button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
