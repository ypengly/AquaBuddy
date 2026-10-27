import { dayKey, minutesOfDay } from './dates';

export interface ScheduleInput {
  wakeMin: number;
  bedMin: number;
  intervalMin: number;
  timeZone: string;
}

export const SLOT_GRACE_MIN = 15;
export const SNOOZE_OPTIONS = [10, 15, 30] as const;

/** Reminder minutes-of-day: first one an interval after waking, none at or after bedtime (quiet hours). */
export function slotMinutes(s: ScheduleInput): number[] {
  const out: number[] = [];
  for (let m = s.wakeMin + s.intervalMin; m < s.bedMin; m += s.intervalMin) out.push(m);
  return out;
}

export function inActiveWindow(now: number, s: ScheduleInput): boolean {
  const m = minutesOfDay(now, s.timeZone);
  return m >= s.wakeMin && m < s.bedMin;
}

export interface DueSlot {
  slotKey: string;
  minute: number;
}

/** The most recent slot that is due and still within the grace window, if any. */
export function dueSlot(now: number, s: ScheduleInput, graceMin = SLOT_GRACE_MIN): DueSlot | null {
  const nowMin = minutesOfDay(now, s.timeZone);
  const due = slotMinutes(s).filter((m) => m <= nowMin && nowMin - m < graceMin);
  if (!due.length) return null;
  const minute = due[due.length - 1];
  return { slotKey: `${dayKey(now, s.timeZone)}-${minute}`, minute };
}

export interface NotifyArgs {
  now: number;
  s: ScheduleInput;
  enabled: boolean;
  paused: boolean;
  snoozeUntil: number | null;
  lastSlot: string | null;
  goalReached: boolean;
}

export type NotifyDecision = { kind: 'slot' | 'snooze'; slotKey: string };

/**
 * Pure decision function shared by the in-app engine and the server worker.
 * Goal reached stops routine reminders; the next local day starts from a new total,
 * so reminders resume automatically.
 */
export function shouldNotify(a: NotifyArgs): NotifyDecision | null {
  if (!a.enabled || a.paused || a.goalReached) return null;
  if (!inActiveWindow(a.now, a.s)) return null;

  if (a.snoozeUntil !== null) {
    const lateMs = a.now - a.snoozeUntil;
    if (lateMs < 0) return null; // still snoozed
    if (lateMs <= SLOT_GRACE_MIN * 60000) {
      const slotKey = `snooze-${a.snoozeUntil}`;
      return slotKey === a.lastSlot ? null : { kind: 'snooze', slotKey };
    }
    // stale snooze (for example from yesterday): ignore it
  }

  const due = dueSlot(a.now, a.s);
  if (!due || due.slotKey === a.lastSlot) return null;
  return { kind: 'slot', slotKey: due.slotKey };
}

/** Approximate timestamp of the next scheduled reminder (display only). */
export function nextReminderTs(now: number, s: ScheduleInput): number | null {
  const nowMin = minutesOfDay(now, s.timeZone);
  const slots = slotMinutes(s);
  if (!slots.length) return null;
  const next = slots.find((m) => m > nowMin);
  const deltaMin = next !== undefined ? next - nowMin : 1440 - nowMin + slots[0];
  return now + deltaMin * 60000;
}
