'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

/**
 * Schedule & list live sessions for a cohort. Batches come from the internship
 * detail; mutations hit POST /batches/:id/live-sessions (instructor-owned).
 */
export function LiveSessions({ batches }: { batches: Any[] }): JSX.Element {
  const toast = useToast();
  const cohorts = (batches ?? []).filter((b) => b.status !== 'cancelled');
  const [batchId, setBatchId] = useState<number | ''>(cohorts[0]?.id ?? '');
  const [sessions, setSessions] = useState<Any[] | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [durationMinutes, setDuration] = useState('60');
  const [provider, setProvider] = useState<'zoom' | 'google_meet'>('google_meet');
  const [manualJoinUrl, setJoinUrl] = useState('');

  const load = useCallback(async (): Promise<void> => {
    if (!batchId) { setSessions([]); return; }
    setSessions(null);
    try {
      const { data } = await api<Any[]>(`/batches/${batchId}/live-sessions`);
      setSessions(data);
    } catch {
      setSessions([]);
    }
  }, [batchId]);
  useEffect(() => { void load(); }, [load]);

  const schedule = async (): Promise<void> => {
    if (!batchId) { toast('warning', 'Pick a cohort first.'); return; }
    if (title.trim().length < 3 || !startsAt) { toast('warning', 'Title and start time are required.'); return; }
    setBusy(true);
    try {
      await api(`/batches/${batchId}/live-sessions`, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          startsAt: new Date(startsAt).toISOString(),
          durationMinutes: Number(durationMinutes) || 60,
          provider,
          ...(manualJoinUrl.trim() ? { manualJoinUrl: manualJoinUrl.trim() } : {}),
        }),
      });
      toast('success', 'Live session scheduled.');
      setTitle(''); setStartsAt(''); setJoinUrl('');
      await load();
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not schedule the session.');
    } finally {
      setBusy(false);
    }
  };

  if (cohorts.length === 0) {
    return <div className="card p-5 text-body-sm text-neutral-600">Add a cohort under <strong>Batches</strong> first — live sessions are scheduled on a cohort.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4 p-5">
        <div>
          <label className="mb-1 block text-caption font-medium text-neutral-700">Cohort</label>
          <select className="input" value={batchId} onChange={(e) => setBatchId(Number(e.target.value))}>
            {cohorts.map((b) => <option key={b.id} value={b.id}>{(b.name && String(b.name).trim()) || `Cohort starting ${b.startDate}`}</option>)}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-caption font-medium text-neutral-700">Session title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Week 1 — Kickoff & Q&A" maxLength={160} />
          </div>
          <div>
            <label className="mb-1 block text-caption font-medium text-neutral-700">Starts at</label>
            <input className="input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-caption font-medium text-neutral-700">Duration (minutes)</label>
            <input className="input" type="number" min={15} max={480} value={durationMinutes} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-caption font-medium text-neutral-700">Provider</label>
            <select className="input" value={provider} onChange={(e) => setProvider(e.target.value as 'zoom' | 'google_meet')}>
              <option value="google_meet">Google Meet</option>
              <option value="zoom">Zoom</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-caption font-medium text-neutral-700">Join link (optional)</label>
            <input className="input" type="url" value={manualJoinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="https://meet.google.com/…" />
          </div>
        </div>
        <p className="text-caption text-neutral-500">Leave the join link blank to add it later. Students in this cohort join from their classroom when the session is live.</p>
        <div><button onClick={schedule} disabled={busy} className="btn-primary px-5">{busy ? 'Scheduling…' : 'Schedule session'}</button></div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-body-sm">
          <thead><tr className="bg-neutral-50 text-left text-caption uppercase text-neutral-600">
            <th className="px-4 py-2.5">Session</th><th className="px-4 py-2.5">When</th><th className="px-4 py-2.5">Duration</th><th className="px-4 py-2.5">Provider</th><th className="px-4 py-2.5">Status</th>
          </tr></thead>
          <tbody>
            {!sessions ? <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">Loading…</td></tr>
            : sessions.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">No sessions scheduled for this cohort yet.</td></tr>
            : sessions.map((s) => {
              const mins = s.scheduledStart && s.scheduledEnd ? Math.round((new Date(s.scheduledEnd).getTime() - new Date(s.scheduledStart).getTime()) / 60000) : null;
              return (
                <tr key={s.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5 font-medium">{s.title}</td>
                  <td className="px-4 py-2.5">{s.scheduledStart ? new Date(s.scheduledStart).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</td>
                  <td className="px-4 py-2.5">{mins ? `${mins} min` : '—'}</td>
                  <td className="px-4 py-2.5 capitalize">{String(s.provider ?? '').replace('_', ' ')}</td>
                  <td className="px-4 py-2.5 capitalize">{String(s.status ?? '').replace('_', ' ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
