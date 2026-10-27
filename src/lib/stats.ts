import type { DrinkEntry } from '../types';
import { addDays, dayDiff, dayKey, lastNDays, formatDayLabel } from './dates';
import { dayTotals } from './hydration';

export interface Stats {
  totalMl: number;
  activeDays: number;
  avgMl: number;
  goalDays: number;
  currentStreak: number;
  bestStreak: number;
  totals: Record<string, number>;
}

export function goalMetOn(key: string, totals: Record<string, number>, goalByDay: Record<string, number>, defaultGoal: number): boolean {
  const goal = goalByDay[key] ?? defaultGoal;
  return goal > 0 && (totals[key] ?? 0) >= goal;
}

export function computeStats(
  entries: DrinkEntry[],
  goalByDay: Record<string, number>,
  defaultGoal: number,
  tz: string,
  now: number
): Stats {
  const totals = dayTotals(entries, tz);
  const days = Object.keys(totals).sort();
  const met = (k: string) => goalMetOn(k, totals, goalByDay, defaultGoal);
  const metDays = days.filter(met);
  const today = dayKey(now, tz);

  // Current streak: consecutive goal days ending today (or yesterday if today isn't done yet).
  let cursor = met(today) ? today : addDays(today, -1);
  let currentStreak = 0;
  while (met(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  let bestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of metDays) {
    run = prev && dayDiff(prev, k) === 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    prev = k;
  }

  let totalMl = 0;
  for (const k of days) totalMl += totals[k];
  return {
    totalMl,
    activeDays: days.length,
    avgMl: days.length ? Math.round(totalMl / days.length) : 0,
    goalDays: metDays.length,
    currentStreak,
    bestStreak,
    totals,
  };
}

export interface ChartPoint {
  key: string;
  label: string;
  ml: number;
  goal: number;
  met: boolean;
}

export function buildChartData(
  entries: DrinkEntry[],
  goalByDay: Record<string, number>,
  defaultGoal: number,
  tz: string,
  todayKey: string,
  n: number
): ChartPoint[] {
  const totals = dayTotals(entries, tz);
  return lastNDays(todayKey, n).map((key) => {
    const goal = goalByDay[key] ?? defaultGoal;
    const ml = totals[key] ?? 0;
    return {
      key,
      label: n <= 7 ? formatDayLabel(key, { weekday: 'short' }) : formatDayLabel(key, { month: 'numeric', day: 'numeric' }),
      ml,
      goal,
      met: goal > 0 && ml >= goal,
    };
  });
}

// XP and levels are derived from history so edits and deletes stay consistent.
export const XP_PER_LOG = 5;
export const MAX_XP_LOGS_PER_DAY = 8; // cap: logging more, or drinking more, earns nothing extra
export const XP_PER_GOAL_DAY = 50;
export const XP_PER_BADGE = 25;
export const XP_PER_LEVEL = 150;

export function computeXp(entries: DrinkEntry[], tz: string, goalDays: number, badgeCount: number): number {
  const perDay: Record<string, number> = {};
  for (const e of entries) {
    const k = dayKey(e.at, tz);
    perDay[k] = (perDay[k] ?? 0) + 1;
  }
  let xp = 0;
  for (const k of Object.keys(perDay)) xp += Math.min(perDay[k], MAX_XP_LOGS_PER_DAY) * XP_PER_LOG;
  return xp + goalDays * XP_PER_GOAL_DAY + badgeCount * XP_PER_BADGE;
}

export function levelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  return { level, into, needed: XP_PER_LEVEL, pct: Math.round((into / XP_PER_LEVEL) * 100) };
}

export function stageName(level: number): string {
  if (level >= 10) return 'Aqua Legend';
  if (level >= 6) return 'Wave Rider';
  if (level >= 3) return 'Splashy';
  return 'Little Droplet';
}
