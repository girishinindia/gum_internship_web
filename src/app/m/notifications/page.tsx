'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MobileEmpty, Skeleton } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function MobileNotifications(): JSX.Element {
  const [items, setItems] = useState<Any[] | null>(null);
  const [unread, setUnread] = useState(0);

  const load = async (): Promise<void> => {
    const { data, meta } = await api<Any[]>('/notifications?limit=50');
    setItems(data); setUnread(Number((meta as Any)?.unreadCount ?? 0));
  };
  useEffect(() => { void load().catch(() => setItems([])); }, []);

  const markAll = async (): Promise<void> => {
    await api('/notifications/read-all', { method: 'POST' }).catch(() => undefined);
    setItems((p) => p?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) ?? p); setUnread(0);
  };
  const markRead = async (id: number): Promise<void> => {
    await api(`/notifications/${id}/read`, { method: 'POST' }).catch(() => undefined);
    setItems((p) => p?.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)) ?? p); setUnread((u) => Math.max(0, u - 1));
  };

  return (
    <>
      <AppBar leading="back" title="Notifications" actions={unread > 0 ? [{ icon: 'check', label: 'Mark all read', onClick: markAll }] : []} />
      <div className="p-4">
        {!items ? <Skeleton count={4} /> : items.length === 0 ? <MobileEmpty title="All caught up" body="Updates show up here." />
        : (
          <div className="space-y-2">
            {items.map((n) => (
              <button key={n.id} onClick={() => !n.readAt && markRead(n.id)} className={`flex w-full gap-2 rounded-xl border p-3 text-left ${n.readAt ? 'border-neutral-200 bg-white' : 'border-primary-200 bg-primary-50/40'}`}>
                {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{n.title}</span>
                  {n.body && <span className="mt-0.5 block text-body-sm text-neutral-600">{n.body}</span>}
                  <span className="mt-1 block text-caption text-neutral-400">{new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
