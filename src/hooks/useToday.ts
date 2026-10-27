'use client';

import { useEffect, useState } from 'react';
import { useAqua } from './useAqua';
import { dayKey } from '../lib/dates';
import { entriesForDay, progress, sumMl } from '../lib/hydration';
import { computeStats, computeXp, levelInfo } from '../lib/stats';

export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Derived values for the current local day. Only use inside <AppShell> (prefs are guaranteed). */
export function useToday() {
  const { state, dispatch } = useAqua();
  const now = useNow();
  const prefs = state.prefs;
  if (!prefs) throw new Error('useToday requires completed onboarding');
  const tz = prefs.timeZone;
  const todayKey = dayKey(now, tz);
  const todayEntries = entriesForDay(state.entries, todayKey, tz);
  const totalMl = sumMl(todayEntries);
  const goalMl = state.goalByDay[todayKey] ?? prefs.goalMl;
  const prog = progress(totalMl, goalMl);
  const stats = computeStats(state.entries, state.goalByDay, prefs.goalMl, tz, now);
  const xp = computeXp(state.entries, tz, stats.goalDays, Object.keys(state.earned).length);
  const level = levelInfo(xp);
  return { state, dispatch, prefs, tz, now, todayKey, todayEntries, totalMl, goalMl, prog, stats, xp, level };
}
