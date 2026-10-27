import type { DrinkEntry } from '../types';
import { ACHIEVEMENTS } from '../data/achievements';
import { addDays, dayKey, minutesOfDay } from './dates';
import { goalMetOn, type Stats } from './stats';

export interface AchievementContext {
  entries: DrinkEntry[];
  stats: Stats;
  goalByDay: Record<string, number>;
  defaultGoal: number;
  tz: string;
  now: number;
}

function hoursSpread(entries: DrinkEntry[], tz: string): boolean {
  const byDay = new Map<string, Set<number>>();
  for (const e of entries) {
    const k = dayKey(e.at, tz);
    const set = byDay.get(k) ?? new Set<number>();
    set.add(Math.floor(minutesOfDay(e.at, tz) / 60));
    byDay.set(k, set);
  }
  return [...byDay.values()].some((s) => s.size >= 4);
}

export function evaluateAchievements(c: AchievementContext): string[] {
  const { entries, stats, tz } = c;
  const today = dayKey(c.now, tz);
  let lastWeekMet = 0;
  for (let i = 0; i < 7; i++) if (goalMetOn(addDays(today, -i), stats.totals, c.goalByDay, c.defaultGoal)) lastWeekMet++;

  const checks: Record<string, boolean> = {
    'first-sip': entries.length >= 1,
    'goal-getter': stats.goalDays >= 1,
    'spread-out': hoursSpread(entries, tz),
    'early-bird': entries.some((e) => {
      const m = minutesOfDay(e.at, tz);
      return m >= 300 && m < 540;
    }),
    'streak-3': stats.bestStreak >= 3,
    'streak-7': stats.bestStreak >= 7,
    'streak-30': stats.bestStreak >= 30,
    'week-warrior': lastWeekMet >= 5,
    'ten-liters': stats.totalMl >= 10000,
    'hundred-liters': stats.totalMl >= 100000,
  };
  return ACHIEVEMENTS.filter((a) => checks[a.id]).map((a) => a.id);
}
