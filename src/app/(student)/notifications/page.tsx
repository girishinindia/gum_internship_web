'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button, EmptyState, SkeletonCard } from '@/components/ui';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function NotificationsPage(): JSX.Element {
  const [items, setItems] = useState<Any[] | null>(null);
  const [unread, setUnread] = useState(0);

  const load = async (): Promise<void> => {
    const { data, meta } = await api<Any[]>('/notifications?limit=50');
    setItems(data);
    setUnread(Number((meta as Any)?.unreadCount ?? 0));
  };
  useEffect(() => { void load().catch(() => setItems([])); }, []);

  const markRead = async (id: number): Promise<void> => {
    await api(`/notifications/${id}/read`, { method: 'POST' }).catch(() => undefined);
    setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)) ?? prev);
    setUnread((u) => Math.max(0, u - 1));
  };
  const markAll = async (): Promise<void> => {
    await api('/notifications/read-all', { method: 'POST' }).catch(() => undefined);
    setItems((prev) => prev?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) ?? prev);
    setUnread(0);
  };

  if (!items) return <div className="space-y-4"><h1 className="text-h1">Notifications</h1><SkeletonCard /><SkeletonCard /></div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-h1">Notifications {unread > 0 && <span className="align-middle text-body-sm font-normal text-primary-700">({unread} new)</span>}</h1>
        {unread > 0 && <Button size="sm" variant="outline" onClick={markAll}>Mark all read</Button>}
      </div>
      {items.length === 0 ? (
        <EmptyState icon="🔔" title="You're all caught up" message="Updates about enrollments, reviews, live sessions and certificates show up here." />
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => !n.readAt && markRead(n.id)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${n.readAt ? 'border-neutral-200 bg-white' : 'border-primary-200 bg-primary-50/40 hover:bg-primary-50'}`}
              >
                {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" aria-hidden />}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-neutral-800">{n.title}</span>
                  {n.body && <span className="mt-0.5 block text-body-sm text-neutral-600">{n.body}</span>}
                  <span className="mt-1 block text-caption text-neutral-400">{new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
