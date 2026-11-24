import { useEffect, useState } from 'react';
import type { AppLang } from './preferences.ts';

export function computeLiveRemainingSeconds(
  targetUntilMs: number | null | undefined,
  nowMs: number = Date.now()
): number {
  if (!targetUntilMs || !Number.isFinite(targetUntilMs)) return 0;
  const diff = targetUntilMs - nowMs;
  if (diff <= 0) return 0;
  return Math.ceil(diff / 1000);
}

export function computeLiveUptimeMs(
  serverStartedAtMs: number | null | undefined,
  nowMs: number = Date.now()
): number {
  if (!serverStartedAtMs || !Number.isFinite(serverStartedAtMs)) return 0;
  return Math.max(0, nowMs - serverStartedAtMs);
}

export function formatDurationUptime(ms: number, lang: AppLang = 'ru'): string {
  const safeSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(safeSec / 86400);
  const hours = Math.floor((safeSec % 86400) / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = safeSec % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (days > 0) {
    const daySuffix = lang === 'en' ? 'd' : lang === 'kk' ? 'к' : 'д';
    return `${days}${daySuffix} ${hh}:${mm}:${ss}`;
  }
  return `${hh}:${mm}:${ss}`;
}

export function useLiveSecond(active = true): number {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;
    setNowMs(Date.now());
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    const syncNow = () => setNowMs(Date.now());
    window.addEventListener('focus', syncNow);
    document.addEventListener('visibilitychange', syncNow);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', syncNow);
      document.removeEventListener('visibilitychange', syncNow);
    };
  }, [active]);

  return nowMs;
}

export function useLiveMinute(active = true): number {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;
    setNowMs(Date.now());
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);
    const syncNow = () => setNowMs(Date.now());
    window.addEventListener('focus', syncNow);
    document.addEventListener('visibilitychange', syncNow);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', syncNow);
      document.removeEventListener('visibilitychange', syncNow);
    };
  }, [active]);

  return nowMs;
}
