import type { DrinkEntry } from '../types';
import { minutesOfDay } from './dates';

export interface Challenge {
  id: string;
  title: string;
  hint: string;
  done: (todayEntries: DrinkEntry[], tz: string, goalMl: number, totalMl: number) => boolean;
}

const before = (min: number) => (es: DrinkEntry[], tz: string) => es.some((e) => minutesOfDay(e.at, tz) < min);

export const CHALLENGES: Challenge[] = [
  { id: 'morning-glass', title: 'Morning glass', hint: 'Log a drink before 10:00.', done: before(600) },
  { id: 'four-sips', title: 'Four easy sips', hint: 'Log 4 drinks today. Small ones count.', done: (es) => es.length >= 4 },
  {
    id: 'afternoon-sip',
    title: 'Afternoon refill',
    hint: 'Log a drink between 13:00 and 17:00.',
    done: (es, tz) => es.some((e) => { const m = minutesOfDay(e.at, tz); return m >= 780 && m < 1020; }),
  },
  {
    id: 'halfway-by-two',
    title: 'Halfway by 14:00',
    hint: 'Reach 50% of your target before 14:00, at a relaxed pace.',
    done: (es, tz, goal) => es.filter((e) => minutesOfDay(e.at, tz) < 840).reduce((t, e) => t + e.amountMl, 0) * 2 >= goal,
  },
  {
    id: 'evening-wind-down',
    title: 'Evening wind-down',
    hint: 'Log a small drink after 18:00.',
    done: (es, tz) => es.some((e) => minutesOfDay(e.at, tz) >= 1080),
  },
  { id: 'two-glasses', title: 'Two glasses', hint: 'Log at least two separate drinks.', done: (es) => es.length >= 2 },
];

/** Three distinct challenges chosen deterministically from the day key. */
export function challengesForDay(key: string): Challenge[] {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = [...CHALLENGES];
  const out: Challenge[] = [];
  while (out.length < 3) {
    const i = h % pool.length;
    out.push(pool.splice(i, 1)[0]);
    h = Math.floor(h / 7) + 3;
  }
  return out;
}
