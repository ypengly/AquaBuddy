import type { DrinkEntry } from '../types';
import { dayKey } from './dates';

export const MAX_ENTRY_ML = 5000;
export const WARN_ENTRY_ML = 1000;
export const MIN_GOAL_ML = 500;
export const MAX_GOAL_ML = 10000;
export const QUICK_ADD_ML = [100, 150, 250, 500] as const;

export type AmountResult = { ok: true; value: number } | { ok: false; error: string };

/** Validate a millilitre amount: positive whole number, sane upper bound. */
export function validateAmount(v: unknown): AmountResult {
  if (typeof v !== 'number' || !Number.isFinite(v)) return { ok: false, error: 'Enter a number.' };
  if (!Number.isInteger(v)) return { ok: false, error: 'Amounts are stored in whole millilitres.' };
  if (v < 1) return { ok: false, error: 'Enter at least 1 mL.' };
  if (v > MAX_ENTRY_ML)
    return { ok: false, error: `That is more than ${MAX_ENTRY_ML.toLocaleString('en-US')} mL in one entry. Please check the amount.` };
  return { ok: true, value: v };
}

export function isLargeEntry(ml: number): boolean {
  return ml >= WARN_ENTRY_ML;
}

export function sumMl(entries: DrinkEntry[]): number {
  let t = 0;
  for (const e of entries) t += e.amountMl;
  return t;
}

export function dayTotals(entries: DrinkEntry[], tz: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) {
    const k = dayKey(e.at, tz);
    out[k] = (out[k] ?? 0) + e.amountMl;
  }
  return out;
}

export function entriesForDay(entries: DrinkEntry[], key: string, tz: string): DrinkEntry[] {
  return entries.filter((e) => dayKey(e.at, tz) === key).sort((a, b) => a.at - b.at);
}

export function totalForDay(entries: DrinkEntry[], key: string, tz: string): number {
  return sumMl(entriesForDay(entries, key, tz));
}

export interface Progress {
  percent: number; // integer, may exceed 100
  remainingMl: number;
  overMl: number;
  fill: number; // 0..1 for visuals
  reached: boolean;
}

export function progress(totalMl: number, goalMl: number): Progress {
  const percent = goalMl > 0 ? Math.floor((totalMl * 100) / goalMl) : 0;
  return {
    percent,
    remainingMl: Math.max(0, goalMl - totalMl),
    overMl: Math.max(0, totalMl - goalMl),
    fill: goalMl > 0 ? Math.min(1, totalMl / goalMl) : 0,
    reached: goalMl > 0 && totalMl >= goalMl,
  };
}

export const MILESTONES = [25, 50, 75, 100] as const;
export function milestonesReached(percent: number): number[] {
  return MILESTONES.filter((m) => percent >= m);
}
