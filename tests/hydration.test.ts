import { describe, expect, it } from 'vitest';
import { dayKey, zonedTimeToTs, addDays } from '../src/lib/dates';
import { dayTotals, milestonesReached, progress, validateAmount } from '../src/lib/hydration';
import { formatVolume, fromMl, toMl } from '../src/lib/units';
import { computeStats, computeXp, levelInfo } from '../src/lib/stats';
import { pickMessage, MESSAGE_COUNT } from '../src/lib/messages';
import { ALL_MESSAGES } from '../src/data/messages';
import { dueSlot, shouldNotify, slotMinutes } from '../src/lib/reminders';
import { entriesToCsv } from '../src/lib/csv';
import type { DrinkEntry } from '../src/types';

const UTC = 'UTC';
const NY = 'America/New_York';
const at = (iso: string) => Date.parse(iso);
const drink = (id: string, iso: string, ml: number): DrinkEntry => ({ id, at: at(iso), amountMl: ml });

describe('units', () => {
  it('stores whole millilitres', () => {
    expect(toMl(8, 'floz')).toBe(237);
    expect(toMl(1.5, 'l')).toBe(1500);
    expect(Number.isInteger(toMl(0.333, 'l'))).toBe(true);
  });
  it('round-trips and formats', () => {
    expect(fromMl(1500, 'l')).toBe(1.5);
    expect(formatVolume(2000, 'ml')).toBe('2,000 mL');
    expect(formatVolume(1500, 'l')).toBe('1.5 L');
  });
});

describe('amount validation', () => {
  it('accepts sane integers and rejects bad input', () => {
    expect(validateAmount(250).ok).toBe(true);
    expect(validateAmount(0).ok).toBe(false);
    expect(validateAmount(-5).ok).toBe(false);
    expect(validateAmount(12.5).ok).toBe(false);
    expect(validateAmount(NaN).ok).toBe(false);
    expect(validateAmount(99999).ok).toBe(false);
  });
});

describe('progress', () => {
  it('computes exact integer values and allows going over 100%', () => {
    expect(progress(500, 2000)).toMatchObject({ percent: 25, remainingMl: 1500, reached: false });
    const over = progress(2600, 2000);
    expect(over).toMatchObject({ percent: 130, remainingMl: 0, overMl: 600, fill: 1, reached: true });
  });
  it('reports milestones', () => {
    expect(milestonesReached(74)).toEqual([25, 50]);
    expect(milestonesReached(120)).toEqual([25, 50, 75, 100]);
  });
  it('does not drift when summing many small entries', () => {
    const entries = Array.from({ length: 1000 }, (_, i) => drink(String(i), '2026-06-01T10:00:00Z', 7));
    expect(dayTotals(entries, UTC)['2026-06-01']).toBe(7000);
  });
});

describe('goal resets at local midnight and across DST', () => {
  it('rolls to a new day exactly at local midnight', () => {
    expect(dayKey(at('2026-06-01T23:59:59Z'), UTC)).toBe('2026-06-01');
    expect(dayKey(at('2026-06-02T00:00:00Z'), UTC)).toBe('2026-06-02');
  });
  it('handles the US spring-forward day (23 hours long)', () => {
    expect(dayKey(at('2026-03-08T04:59:59Z'), NY)).toBe('2026-03-07');
    expect(dayKey(at('2026-03-08T05:00:00Z'), NY)).toBe('2026-03-08');
    expect(dayKey(at('2026-03-09T03:59:59Z'), NY)).toBe('2026-03-08');
    expect(dayKey(at('2026-03-09T04:00:00Z'), NY)).toBe('2026-03-09');
  });
  it('a new day starts at 0 while yesterday keeps its total', () => {
    const entries = [drink('a', '2026-03-08T12:00:00Z', 2000), drink('b', '2026-03-09T12:00:00Z', 250)];
    const t = dayTotals(entries, NY);
    expect(t['2026-03-08']).toBe(2000);
    expect(t['2026-03-09']).toBe(250);
  });
  it('zonedTimeToTs converts local time to the right instant on DST days', () => {
    expect(new Date(zonedTimeToTs('2026-03-08', 9 * 60, NY)).toISOString()).toBe('2026-03-08T13:00:00.000Z'); // EDT
    expect(new Date(zonedTimeToTs('2026-03-07', 9 * 60, NY)).toISOString()).toBe('2026-03-07T14:00:00.000Z'); // EST
  });
});

describe('streaks and XP', () => {
  const entries = [
    drink('1', '2026-06-01T10:00:00Z', 2000),
    drink('2', '2026-06-02T10:00:00Z', 2500),
    drink('3', '2026-06-03T10:00:00Z', 1000),
    drink('4', '2026-06-04T10:00:00Z', 2000),
    drink('5', '2026-06-05T10:00:00Z', 2000),
  ];
  it('computes current and best streaks from user goals', () => {
    const s = computeStats(entries, {}, 2000, UTC, at('2026-06-05T18:00:00Z'));
    expect(s.goalDays).toBe(4);
    expect(s.bestStreak).toBe(2);
    expect(s.currentStreak).toBe(2);
  });
  it('keeps yesterday’s streak alive until today ends', () => {
    const s = computeStats(entries.slice(0, 2), {}, 2000, UTC, at('2026-06-03T09:00:00Z'));
    expect(s.currentStreak).toBe(2);
    const gone = computeStats(entries.slice(0, 2), {}, 2000, UTC, at('2026-06-04T09:00:00Z'));
    expect(gone.currentStreak).toBe(0);
  });
  it('respects the goal that applied on each day', () => {
    const s = computeStats(entries, { '2026-06-03': 1000 }, 2000, UTC, at('2026-06-05T18:00:00Z'));
    expect(s.goalDays).toBe(5);
    expect(s.bestStreak).toBe(5);
  });
  it('caps XP so extra logging earns nothing', () => {
    const many = Array.from({ length: 30 }, (_, i) => drink(String(i), '2026-06-01T10:00:00Z', 50));
    expect(computeXp(many, UTC, 0, 0)).toBe(8 * 5);
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(300).level).toBe(3);
  });
  it('addDays crosses month boundaries', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });
});

describe('messages', () => {
  it('has at least 100 unique messages', () => {
    expect(MESSAGE_COUNT).toBeGreaterThanOrEqual(100);
    expect(new Set(ALL_MESSAGES.map((m) => m.text)).size).toBe(MESSAGE_COUNT);
  });
  it('avoids recent repeats within a style', () => {
    const recent: number[] = [];
    for (let i = 0; i < 40; i++) {
      const m = pickMessage('funny', recent);
      expect(recent.slice(-10)).not.toContain(m.id);
      recent.push(m.id);
    }
  });
});

describe('reminders', () => {
  const s = { wakeMin: 480, bedMin: 1320, intervalMin: 60, timeZone: UTC };
  it('schedules only inside waking hours', () => {
    const slots = slotMinutes(s);
    expect(slots[0]).toBe(540);
    expect(slots.at(-1)).toBe(1260);
    expect(slots).toHaveLength(13);
  });
  it('finds a due slot and fires once', () => {
    const now = at('2026-06-01T09:05:00Z');
    expect(dueSlot(now, s)?.slotKey).toBe('2026-06-01-540');
    const args = { now, s, enabled: true, paused: false, snoozeUntil: null, lastSlot: null, goalReached: false };
    const d = shouldNotify(args);
    expect(d?.kind).toBe('slot');
    expect(shouldNotify({ ...args, lastSlot: d!.slotKey })).toBeNull();
  });
  it('stops after the goal, during quiet hours, when paused, and while snoozed', () => {
    const base = { now: at('2026-06-01T09:05:00Z'), s, enabled: true, paused: false, snoozeUntil: null, lastSlot: null, goalReached: false };
    expect(shouldNotify({ ...base, goalReached: true })).toBeNull();
    expect(shouldNotify({ ...base, paused: true })).toBeNull();
    expect(shouldNotify({ ...base, now: at('2026-06-01T23:00:00Z') })).toBeNull();
    expect(shouldNotify({ ...base, snoozeUntil: base.now + 10 * 60000 })).toBeNull();
  });
  it('fires a snoozed reminder when the snooze ends', () => {
    const snoozeUntil = at('2026-06-01T10:20:00Z');
    const d = shouldNotify({ now: snoozeUntil + 30000, s, enabled: true, paused: false, snoozeUntil, lastSlot: null, goalReached: false });
    expect(d?.kind).toBe('snooze');
  });
  it('resumes the next day after a goal day', () => {
    const next = at('2026-06-02T09:01:00Z');
    expect(shouldNotify({ now: next, s, enabled: true, paused: false, snoozeUntil: null, lastSlot: '2026-06-01-540', goalReached: false })?.slotKey).toBe('2026-06-02-540');
  });
});

describe('csv', () => {
  it('exports headers, rows and neutralises formulas', () => {
    const csv = entriesToCsv([{ id: 'x', at: at('2026-06-01T10:00:00Z'), amountMl: 250, note: '=cmd' }], UTC);
    const [header, row] = csv.trim().split('\n');
    expect(header).toBe('id,local_date,local_time,timestamp_utc,amount_ml,note');
    expect(row).toContain('2026-06-01');
    expect(row).toContain("'=cmd");
  });
});
