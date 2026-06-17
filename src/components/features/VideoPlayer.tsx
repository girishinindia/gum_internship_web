'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Spinner } from '@/components/ui';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const COMPLETE_AT = 0.9;          // auto-complete once 90% watched (T-04-07)
const REFRESH_BEFORE_MS = 5 * 60 * 1000; // re-sign the URL 5 min before it expires (T-04-04)

/** Load hls.js once from CDN (Safari plays HLS natively and skips this). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadHls(): Promise<any> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    const w = window as Any;
    if (w.Hls) return resolve(w.Hls);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
    s.onload = () => resolve(w.Hls ?? null);
    s.onerror = () => resolve(null);
    document.body.appendChild(s);
  });
}

/**
 * Token-authenticated lesson video. Plays Bunny's signed HLS in a real HTML5
 * player so we can (a) auto-mark the lesson complete at ≥90% watched, and
 * (b) re-fetch a fresh signed URL before the token expires (or on a media
 * error) and resume from the same spot — no hard error mid-session. When the
 * video doesn't exist the API returns an error and we show a clean message.
 */
export function VideoPlayer({ lessonId, enrollmentId, title, onComplete }: {
  lessonId: number;
  enrollmentId: number;
  title?: string;
  onComplete: () => void;
}): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Any | null>(null);
  const completedRef = useRef(false);
  const expiryRef = useRef(0);
  const refreshingRef = useRef(false);
  const [state, setState] = useState<{ loading: boolean; error?: string }>({ loading: true });

  const fetchPlay = useCallback(async (): Promise<{ hlsUrl: string; embedUrl?: string; expiresAt?: string }> => {
    const { data } = await api<Any>(`/lessons/${lessonId}/play?enrollmentId=${enrollmentId}`);
    return data as { hlsUrl: string; embedUrl?: string; expiresAt?: string };
  }, [lessonId, enrollmentId]);

  const attach = useCallback(async (url: string, resumeAt = 0): Promise<void> => {
    const video = videoRef.current;
    if (!video) return;
    // Native HLS (Safari/iOS) — just set the source.
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      if (resumeAt) video.currentTime = resumeAt;
      return;
    }
    const Hls = await loadHls();
    if (Hls && Hls.isSupported()) {
      hlsRef.current?.destroy?.();
      const hls = new Hls({ maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { if (resumeAt) video.currentTime = resumeAt; });
      hls.on(Hls.Events.ERROR, (_e: unknown, data: Any) => {
        // A fatal network error usually means the token expired → re-sign.
        if (data?.fatal && data?.type === 'networkError') void refresh();
      });
    } else {
      video.src = url; // last resort
      if (resumeAt) video.currentTime = resumeAt;
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const p = await fetchPlay();
      expiryRef.current = p.expiresAt ? new Date(p.expiresAt).getTime() : 0;
      const at = videoRef.current?.currentTime ?? 0;
      const wasPlaying = videoRef.current ? !videoRef.current.paused : false;
      await attach(p.hlsUrl, at);
      if (wasPlaying) void videoRef.current?.play().catch(() => undefined);
    } catch {
      /* keep playing the current (possibly soon-expiring) stream */
    } finally {
      refreshingRef.current = false;
    }
  }, [attach, fetchPlay]);

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    completedRef.current = false;
    setState({ loading: true });
    void (async () => {
      try {
        const p = await fetchPlay();
        if (cancelled) return;
        expiryRef.current = p.expiresAt ? new Date(p.expiresAt).getTime() : 0;
        await attach(p.hlsUrl);
        if (!cancelled) setState({ loading: false });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e instanceof ApiError ? e.message : 'Playback unavailable.' });
      }
    })();
    return () => { cancelled = true; hlsRef.current?.destroy?.(); hlsRef.current = null; };
  }, [attach, fetchPlay]);

  const onTimeUpdate = (): void => {
    const v = videoRef.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return;
    if (!completedRef.current && v.currentTime / v.duration >= COMPLETE_AT) {
      completedRef.current = true;
      onComplete();
    }
    if (expiryRef.current && Date.now() > expiryRef.current - REFRESH_BEFORE_MS) {
      expiryRef.current = 0; // guard against repeat triggers
      void refresh();
    }
  };

  if (state.error) {
    return (
      <div className="rounded-xl bg-danger-50 p-4 text-body-sm text-danger-700">
        <p className="font-medium">This video isn’t available right now.</p>
        <p className="mt-1 text-danger-600">{state.error}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
      {state.loading && <div className="absolute inset-0 grid place-items-center"><Spinner /></div>}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} className="h-full w-full" controls playsInline onTimeUpdate={onTimeUpdate} title={title} />
    </div>
  );
}
