import type { Style } from '../types';
import { ALL_MESSAGES, type Message } from '../data/messages';

export const MESSAGE_COUNT = ALL_MESSAGES.length;

/** Pick a message in the given style, avoiding recently used ids. */
export function pickMessage(style: Style, recent: number[], rand: () => number = Math.random): Message {
  const pool = ALL_MESSAGES.filter((m) => m.style === style);
  const avoidCount = Math.min(recent.length, Math.max(0, pool.length - 1));
  const avoid = new Set(recent.slice(-avoidCount));
  const fresh = pool.filter((m) => !avoid.has(m.id));
  const list = fresh.length ? fresh : pool;
  return list[Math.floor(rand() * list.length) % list.length];
}

/** Deterministic pick for server workers (stable per slot, varies between slots). */
export function messageForSlot(style: Style, slotKey: string): Message {
  let h = 2166136261;
  for (let i = 0; i < slotKey.length; i++) {
    h ^= slotKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const pool = ALL_MESSAGES.filter((m) => m.style === style);
  return pool[(h >>> 0) % pool.length];
}
