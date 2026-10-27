'use client';

import { useEffect } from 'react';
import { useAqua } from '../../hooks/useAqua';
import { syncPush } from '../../lib/pushClient';

/** Registers the service worker and keeps the server's reminder schedule in sync when Web Push is on. */
export function BackgroundServices() {
  const { state, ready } = useAqua();

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, []);

  const p = state.prefs;
  const total = state.entries.length;
  const sig = p
    ? JSON.stringify([p.goalMl, p.wakeMin, p.bedMin, p.intervalMin, p.style, p.timeZone, p.remindersOn, state.reminder.paused, state.reminder.snoozeUntil, total, state.entries.at(-1)?.amountMl, state.goalByDay])
    : '';

  useEffect(() => {
    if (!ready || !p?.pushEnabled) return;
    const id = setTimeout(() => {
      syncPush(state).catch(() => undefined);
    }, 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, p?.pushEnabled, sig]);

  return null;
}
