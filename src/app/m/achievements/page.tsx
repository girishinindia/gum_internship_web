'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SegmentedControl, Skeleton } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function MobileAchievements(): JSX.Element {
  const [tab, setTab] = useState<'badges' | 'board'>('badges');
  const [badges, setBadges] = useState<{ earned: Any[]; all: Any[] } | null>(null);
  const [board, setBoard] = useState<Any[] | null>(null);
  const [xp, setXp] = useState<Any | null>(null);

  useEffect(() => {
    void api<{ earned: Any[]; all: Any[] }>('/me/badges').then(({ data }) => setBadges(data)).catch(() => setBadges({ earned: [], all: [] }));
    void api<Any[]>('/leaderboard?limit=20').then(({ data }) => setBoard(data)).catch(() => setBoard([]));
    void api<Any>('/me/xp').then(({ data }) => setXp(data)).catch(() => undefined);
  }, []);
  const earned = new Set((badges?.earned ?? []).map((b) => b.code));

  return (
    <>
      <AppBar variant="large" title="Achievements" subtitle={xp ? `Level ${xp.level} · ${xp.xp} XP` : 'Your badges & rank'} />
      <div className="p-4">
        {xp && <p className="mb-3 text-body-sm text-neutral-600">🔥 {xp.currentStreak} day streak{xp.rank ? ` · Rank #${xp.rank}` : ''}</p>}
        <SegmentedControl options={[{ value: 'badges', label: 'Badges' }, { value: 'board', label: 'Leaderboard' }]} value={tab} onChange={setTab} />
        <div className="mt-4">
          {tab === 'badges' ? (
            !badges ? <Skeleton count={4} /> : (
              <div className="grid grid-cols-2 gap-3">
                {badges.all.map((b) => {
                  const has = earned.has(b.code);
                  return (
                    <div key={b.code} className={`rounded-xl border border-neutral-200 bg-white p-3 text-center ${has ? '' : 'opacity-50 grayscale'}`}>
                      <div className="text-4xl">{b.icon ?? '🏅'}</div>
                      <p className="mt-1 text-body-sm font-medium">{b.name}</p>
                      <p className="text-caption text-neutral-500">{b.description}</p>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            !board ? <Skeleton count={4} /> : board.length === 0 ? <p className="p-6 text-center text-body-sm text-neutral-500">No XP yet.</p> : (
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                {board.map((r) => (
                  <div key={r.userId} className={`flex items-center gap-3 border-b border-neutral-100 p-3 last:border-0 ${xp && r.rank === xp.rank ? 'bg-primary-50/50' : ''}`}>
                    <span className="w-6 text-center font-semibold text-neutral-500">{r.rank}</span>
                    <span className="flex-1 truncate text-body-sm">{r.name}</span>
                    <span className="text-body-sm font-semibold text-primary-700">{r.xp} XP</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
