'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Avatar, Tabs, SkeletonCard } from '@/components/ui';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function AchievementsPage(): JSX.Element {
  const [badges, setBadges] = useState<{ earned: Any[]; all: Any[] } | null>(null);
  const [board, setBoard] = useState<Any[] | null>(null);
  const [xp, setXp] = useState<Any | null>(null);

  useEffect(() => {
    void api<{ earned: Any[]; all: Any[] }>('/me/badges').then(({ data }) => setBadges(data)).catch(() => setBadges({ earned: [], all: [] }));
    void api<Any[]>('/leaderboard?limit=20').then(({ data }) => setBoard(data)).catch(() => setBoard([]));
    void api<Any>('/me/xp').then(({ data }) => setXp(data)).catch(() => setXp(null));
  }, []);

  const earnedCodes = new Set((badges?.earned ?? []).map((b) => b.code));

  const BadgesTab = (
    !badges ? <SkeletonCard /> : (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {badges.all.map((b) => {
          const has = earnedCodes.has(b.code);
          return (
            <div key={b.code} className={`card p-4 text-center ${has ? '' : 'opacity-50 grayscale'}`}>
              <div className="text-4xl">{b.icon ?? '🏅'}</div>
              <p className="mt-2 text-body-sm font-semibold text-neutral-800">{b.name}</p>
              <p className="text-caption text-neutral-500">{b.description}</p>
              {has ? <span className="badge mt-2 bg-success-50 text-success-700">Earned</span> : <span className="badge mt-2 bg-neutral-100 text-neutral-500">Locked</span>}
            </div>
          );
        })}
      </div>
    )
  );

  const BoardTab = (
    !board ? <SkeletonCard /> : (
      <div className="card divide-y divide-neutral-100">
        {board.map((r) => (
          <div key={r.userId} className={`flex items-center gap-3 p-3 ${xp && r.rank === xp.rank ? 'bg-primary-50/50' : ''}`}>
            <span className="w-7 text-center font-semibold text-neutral-500">{r.rank}</span>
            <Avatar name={r.name} src={r.avatarUrl} size="sm" />
            <span className="flex-1 truncate text-body-sm text-neutral-800">{r.name}</span>
            <span className="text-body-sm font-semibold text-primary-700">{r.xp} XP</span>
          </div>
        ))}
        {board.length === 0 && <p className="p-6 text-center text-body-sm text-neutral-500">No XP earned yet — complete a lesson to get on the board.</p>}
      </div>
    )
  );

  return (
    <div>
      <h1 className="text-h1">Achievements</h1>
      {xp && (
        <p className="mt-1 text-body-sm text-neutral-600">
          Level {xp.level} · {xp.xp} XP · {xp.currentStreak} day streak{xp.rank ? ` · rank #${xp.rank}` : ''}
        </p>
      )}
      <div className="mt-6">
        <Tabs tabs={[{ key: 'badges', label: 'Badges', content: BadgesTab }, { key: 'board', label: 'Leaderboard', content: BoardTab }]} />
      </div>
    </div>
  );
}
