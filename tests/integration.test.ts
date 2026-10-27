import { describe, expect, it } from 'vitest';
import { initialState, parseStored, reducer, type Action } from '../src/lib/state';
import { defaultPrefs } from '../src/lib/prefs';
import { entriesForDay, progress, totalForDay } from '../src/lib/hydration';
import { evaluateAchievements } from '../src/lib/achievements';
import { computeStats } from '../src/lib/stats';
import type { AppState } from '../src/types';

const TZ = 'UTC';
const NOW = Date.parse('2026-06-01T08:00:00Z');
const prefs = { ...defaultPrefs(TZ), deviceId: 'd'.repeat(48) };

const run = (state: AppState, ...actions: Action[]) => actions.reduce(reducer, state);
const start = () => run(initialState, { type: 'ONBOARD', prefs, now: NOW });
const add = (id: string, ml: number, at = NOW): Action => ({ type: 'ADD', id, amountMl: ml, at });

describe('logging and deleting drinks', () => {
  it('logs, edits, deletes, restores and undoes drinks', () => {
    let s = run(start(), add('a', 250), add('b', 500, NOW + 3600_000), add('c', 100, NOW + 7200_000));
    expect(totalForDay(s.entries, '2026-06-01', TZ)).toBe(850);

    s = run(s, { type: 'EDIT', id: 'b', amountMl: 300 });
    expect(totalForDay(s.entries, '2026-06-01', TZ)).toBe(650);

    const removed = s.entries.find((e) => e.id === 'a')!;
    s = run(s, { type: 'DELETE', id: 'a' });
    expect(totalForDay(s.entries, '2026-06-01', TZ)).toBe(400);

    s = run(s, { type: 'RESTORE', entry: removed });
    expect(totalForDay(s.entries, '2026-06-01', TZ)).toBe(650);

    s = run(s, { type: 'UNDO' }); // last added was 'c'
    expect(s.entries.map((e) => e.id).sort()).toEqual(['a', 'b']);
    expect(s.lastAddedId).toBeNull();
  });

  it('rejects invalid amounts and duplicate ids', () => {
    let s = run(start(), add('a', 250), add('a', 250), add('bad', 0), add('huge', 99999));
    expect(s.entries).toHaveLength(1);
    s = run(s, { type: 'EDIT', id: 'a', amountMl: -1 });
    expect(s.entries[0].amountMl).toBe(250);
  });

  it('keeps tracking accurately past 100%', () => {
    const s = run(start(), add('a', 1500), add('b', 800));
    const p = progress(totalForDay(s.entries, '2026-06-01', TZ), 2000);
    expect(p).toMatchObject({ percent: 115, overMl: 300, reached: true });
  });

  it('separates days and snapshots the goal per day', () => {
    let s = run(start(), add('a', 2000), { type: 'UPDATE_PREFS', patch: { goalMl: 2500 }, now: NOW });
    s = run(s, add('b', 300, NOW + 86400_000), { type: 'UPDATE_PREFS', patch: { goalMl: 3000 }, now: NOW + 86400_000 });
    expect(s.goalByDay['2026-06-01']).toBe(2500);
    expect(s.goalByDay['2026-06-02']).toBe(3000);
    expect(entriesForDay(s.entries, '2026-06-02', TZ)).toHaveLength(1);
  });

  it('ignores invalid preference updates', () => {
    const s = run(start(), { type: 'UPDATE_PREFS', patch: { goalMl: 5 }, now: NOW });
    expect(s.prefs?.goalMl).toBe(2000);
  });

  it('earns badges once and keeps them after deletion', () => {
    let s = run(start(), add('a', 2000));
    const stats = computeStats(s.entries, s.goalByDay, 2000, TZ, NOW);
    const ids = evaluateAchievements({ entries: s.entries, stats, goalByDay: s.goalByDay, defaultGoal: 2000, tz: TZ, now: NOW });
    expect(ids).toEqual(expect.arrayContaining(['first-sip', 'goal-getter']));
    s = run(s, { type: 'EARN', ids, at: NOW }, { type: 'EARN', ids, at: NOW + 1 }, { type: 'DELETE', id: 'a' });
    expect(s.earned['first-sip']).toBe(NOW);
  });
});

describe('persistence', () => {
  it('round-trips state through JSON and survives corrupt data', () => {
    const s = run(start(), add('a', 250));
    expect(parseStored(JSON.stringify(s)).entries).toHaveLength(1);
    expect(parseStored('{not json')).toEqual(initialState);
    expect(parseStored(null)).toEqual(initialState);
  });
  it('drops malformed entries', () => {
    const raw = JSON.stringify({ ...initialState, entries: [{ id: 'ok', amountMl: 100, at: 1 }, { id: 'bad', amountMl: 1.5, at: 1 }] });
    expect(parseStored(raw).entries.map((e) => e.id)).toEqual(['ok']);
  });
});
