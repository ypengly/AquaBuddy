import type { AppState } from '../types';
import { dayKey } from './dates';
import { totalForDay } from './hydration';

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function buildSyncPayload(state: AppState, now = Date.now()) {
  const p = state.prefs!;
  const key = dayKey(now, p.timeZone);
  return {
    deviceId: p.deviceId,
    timeZone: p.timeZone,
    wakeMin: p.wakeMin,
    bedMin: p.bedMin,
    intervalMin: p.intervalMin,
    style: p.style,
    unit: p.unit,
    goalMl: state.goalByDay[key] ?? p.goalMl,
    remindersOn: p.remindersOn && !state.reminder.paused,
    snoozeUntil: state.reminder.snoozeUntil,
    todayDayKey: key,
    todayTotalMl: totalForDay(state.entries, key, p.timeZone),
  };
}

export async function syncPush(state: AppState): Promise<boolean> {
  if (!state.prefs) return false;
  const res = await fetch('/api/push/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildSyncPayload(state)),
  });
  return res.ok;
}

export async function enablePush(state: AppState): Promise<void> {
  if (!VAPID_PUBLIC_KEY) throw new Error('Push is not configured on this server (missing NEXT_PUBLIC_VAPID_PUBLIC_KEY).');
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('This browser does not support Web Push.');
  if (!(await syncPush(state))) throw new Error('Could not reach the AquaBuddy server.');
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: state.prefs!.deviceId, subscription: sub.toJSON(), userAgent: navigator.userAgent.slice(0, 200) }),
  });
  if (!res.ok) throw new Error('The server rejected the push subscription.');
}

export async function disablePush(deviceId: string): Promise<void> {
  const reg = await navigator.serviceWorker?.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, endpoint: sub.endpoint }),
  }).catch(() => undefined);
  await sub.unsubscribe();
}
