import type { Prefs } from '../types';
import { isValidTimeZone } from './dates';
import { MAX_GOAL_ML, MIN_GOAL_ML } from './hydration';

export const INTERVALS = [30, 45, 60, 90, 120] as const;
export const STYLES = ['funny', 'cute', 'motivational', 'minimal'] as const;
export const UNITS = ['ml', 'l', 'floz'] as const;

export function validatePrefs(p: Prefs): string | null {
  if (!Number.isInteger(p.goalMl) || p.goalMl < MIN_GOAL_ML || p.goalMl > MAX_GOAL_ML)
    return `Choose a daily target between ${MIN_GOAL_ML} and ${MAX_GOAL_ML} mL.`;
  if (!Number.isInteger(p.wakeMin) || !Number.isInteger(p.bedMin) || p.wakeMin < 0 || p.bedMin > 1439)
    return 'Enter valid wake-up and bedtime hours.';
  if (p.bedMin - p.wakeMin < 240) return 'Bedtime must be at least 4 hours after wake-up, on the same day.';
  if (!(INTERVALS as readonly number[]).includes(p.intervalMin)) return 'Pick one of the listed reminder intervals.';
  if (!(STYLES as readonly string[]).includes(p.style)) return 'Pick a message style.';
  if (!(UNITS as readonly string[]).includes(p.unit)) return 'Pick a measurement unit.';
  if (!isValidTimeZone(p.timeZone)) return 'Time zone is not valid.';
  if (!p.deviceId || p.deviceId.length < 32) return 'Device id is missing.';
  return null;
}

export function randomToken(bytes = 24): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : randomToken(16);
}

export function defaultPrefs(timeZone: string): Prefs {
  return {
    goalMl: 2000,
    wakeMin: 7 * 60,
    bedMin: 22 * 60,
    intervalMin: 60,
    style: 'cute',
    unit: 'ml',
    timeZone,
    theme: 'system',
    sound: false,
    reducedMotion: false,
    remindersOn: true,
    inAppReminders: true,
    pushEnabled: false,
    deviceId: '',
  };
}
