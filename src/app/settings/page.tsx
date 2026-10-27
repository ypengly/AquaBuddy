'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, BellOff, Download, Pause, Play, Trash2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { Card, PageHeader } from '../../components/ui/Section';
import { useToday } from '../../hooks/useToday';
import { downloadCsv, entriesToCsv } from '../../lib/csv';
import { formatMinutes, minToTimeInput, timeInputToMin } from '../../lib/dates';
import { notificationsSupported, permissionState, requestNotificationPermission, showBrowserNotification } from '../../lib/notify';
import { INTERVALS, STYLES, validatePrefs } from '../../lib/prefs';
import { disablePush, enablePush, VAPID_PUBLIC_KEY } from '../../lib/pushClient';
import { SNOOZE_OPTIONS } from '../../lib/reminders';
import { UNIT_LABEL, fromMl, inputStep, toMl, formatMl } from '../../lib/units';
import type { Prefs, Style, Theme, Unit } from '../../types';

export default function SettingsPage() {
  return (
    <AppShell>
      <Settings />
    </AppShell>
  );
}

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <label htmlFor={id} className="flex-1"><span className="font-semibold">{label}</span>{hint && <span className="muted block">{hint}</span>}</label>
      <input id={id} type="checkbox" role="switch" className="mt-1 h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-aqua-200 transition checked:bg-aqua-500 [&::before]:m-0.5 [&::before]:block [&::before]:h-5 [&::before]:w-5 [&::before]:rounded-full [&::before]:bg-white [&::before]:transition checked:[&::before]:translate-x-5 [&::before]:content-['']" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}

function Settings() {
  const router = useRouter();
  const { state, prefs, dispatch, tz } = useToday();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const [goalText, setGoalText] = useState(String(Math.round(fromMl(prefs.goalMl, prefs.unit) * 100) / 100));
  const [busy, setBusy] = useState(false);

  useEffect(() => setPerm(permissionState()), []);

  const update = (patch: Partial<Prefs>) => {
    const err = validatePrefs({ ...prefs, ...patch });
    if (err) return setError(err);
    setError(null);
    dispatch({ type: 'UPDATE_PREFS', patch, now: Date.now() });
  };

  const askPermission = async () => {
    const p = await requestNotificationPermission();
    setPerm(p);
    setNotice(p === 'granted' ? 'Browser notifications are on.' : p === 'denied' ? 'Notifications are blocked. Change this in your browser’s site settings.' : 'Permission was not granted.');
  };

  const togglePush = async (on: boolean) => {
    setBusy(true);
    setNotice(null);
    try {
      if (on) {
        if (permissionState() !== 'granted') await askPermission();
        if (permissionState() !== 'granted') throw new Error('Allow notifications first to use background reminders.');
        await enablePush(state);
        update({ pushEnabled: true });
        setNotice('Background reminders are on for this device.');
      } else {
        await disablePush(prefs.deviceId);
        update({ pushEnabled: false });
        setNotice('Background reminders are off.');
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('Delete all drinks, settings and badges from this device? This cannot be undone.')) return;
    if (prefs.pushEnabled) await disablePush(prefs.deviceId).catch(() => undefined);
    dispatch({ type: 'RESET' });
    router.push('/');
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Profile, preferences and reminders." />
      <div className="space-y-5">
        {error && <p role="alert" className="glass border-rose-300 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-200">{error}</p>}

        <Card title="Profile & preferences">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="unit">Units</label>
              <select id="unit" className="input" value={prefs.unit} onChange={(e) => { update({ unit: e.target.value as Unit }); setGoalText(String(Math.round(fromMl(prefs.goalMl, e.target.value as Unit) * 100) / 100)); }}>
                <option value="ml">Millilitres (mL)</option><option value="l">Litres (L)</option><option value="floz">US fluid ounces</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="goal">Daily target ({UNIT_LABEL[prefs.unit]})</label>
              <input id="goal" className="input" type="number" step={inputStep(prefs.unit)} value={goalText}
                onChange={(e) => { setGoalText(e.target.value); const n = Number(e.target.value); if (Number.isFinite(n) && n > 0) update({ goalMl: toMl(n, prefs.unit) }); }} />
              <p className="muted mt-1">= {formatMl(prefs.goalMl)}. Changing it applies from today; past days keep their own target.</p>
            </div>
            <div>
              <label className="label" htmlFor="wake">Wake-up</label>
              <input id="wake" className="input" type="time" value={minToTimeInput(prefs.wakeMin)} onChange={(e) => update({ wakeMin: timeInputToMin(e.target.value) })} />
            </div>
            <div>
              <label className="label" htmlFor="bed">Bedtime (quiet hours start)</label>
              <input id="bed" className="input" type="time" value={minToTimeInput(prefs.bedMin)} onChange={(e) => update({ bedMin: timeInputToMin(e.target.value) })} />
            </div>
            <div>
              <label className="label" htmlFor="theme">Theme</label>
              <select id="theme" className="input" value={prefs.theme} onChange={(e) => update({ theme: e.target.value as Theme })}>
                <option value="system">Match my device</option><option value="light">Light</option><option value="dark">Dark</option>
              </select>
            </div>
            <div><p className="label">Time zone</p><p className="input !bg-transparent">{tz}</p></div>
          </div>
          <div className="mt-3 divide-y divide-aqua-200/40">
            <Toggle id="sound" label="Sound effects" hint="Soft sounds when you log a drink or reach your target." checked={prefs.sound} onChange={(v) => update({ sound: v })} />
            <Toggle id="motion" label="Reduce motion" hint="Turns off wave, bubble, mascot and confetti animations." checked={prefs.reducedMotion} onChange={(v) => update({ reducedMotion: v })} />
          </div>
        </Card>

        <Card title="Reminders">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="interval">How often</label>
              <select id="interval" className="input" value={prefs.intervalMin} onChange={(e) => update({ intervalMin: Number(e.target.value) })}>
                {INTERVALS.map((m) => <option key={m} value={m}>Every {m} minutes</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="style">Message style</label>
              <select id="style" className="input capitalize" value={prefs.style} onChange={(e) => update({ style: e.target.value as Style })}>
                {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <p className="muted mt-2">Reminders run between {formatMinutes(prefs.wakeMin)} and {formatMinutes(prefs.bedMin)}, in your time zone, and stop once you reach your target. They start again tomorrow.</p>

          <div className="mt-3 divide-y divide-aqua-200/40">
            <Toggle id="rem-on" label="Reminders" checked={prefs.remindersOn} onChange={(v) => update({ remindersOn: v })} />
            <Toggle id="rem-inapp" label="In-app reminders" hint="A friendly card while AquaBuddy is open." checked={prefs.inAppReminders} onChange={(v) => update({ inAppReminders: v })} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn btn-ghost" onClick={() => dispatch({ type: 'PAUSE', paused: !state.reminder.paused })}>
              {state.reminder.paused ? <><Play className="h-4 w-4" aria-hidden /> Resume reminders</> : <><Pause className="h-4 w-4" aria-hidden /> Pause reminders</>}
            </button>
            {SNOOZE_OPTIONS.map((m) => (
              <button key={m} className="btn btn-ghost" onClick={() => dispatch({ type: 'SNOOZE', until: Date.now() + m * 60_000 })}>Snooze {m} min</button>
            ))}
          </div>
          {state.reminder.snoozeUntil && state.reminder.snoozeUntil > Date.now() && <p className="muted mt-2">Snoozed until {new Date(state.reminder.snoozeUntil).toLocaleTimeString([], { timeZone: tz, hour: 'numeric', minute: '2-digit' })}.</p>}
        </Card>

        <Card title="Notifications">
          <p className="muted">
            Browser notifications are only sent while AquaBuddy is open in a tab or installed app, because a web page can&apos;t run timers once it&apos;s closed. For reminders that arrive when the app is closed, turn on background reminders: they use Web Push and a server worker (see Help).
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {perm !== 'granted' ? (
              <button className="btn btn-primary" onClick={askPermission} disabled={perm === 'unsupported' || perm === 'denied'}><Bell className="h-4 w-4" aria-hidden /> Allow notifications</button>
            ) : (
              <button className="btn btn-ghost" onClick={() => showBrowserNotification('This is how your reminders will look. 💧').then((ok) => setNotice(ok ? 'Test notification sent.' : 'Could not show a notification.'))}><Bell className="h-4 w-4" aria-hidden /> Send a test</button>
            )}
            <span className="muted">{perm === 'unsupported' ? 'Not supported in this browser.' : `Permission: ${perm}`}</span>
          </div>
          <div className="mt-3">
            <Toggle id="push" label="Background reminders (Web Push)" hint={VAPID_PUBLIC_KEY ? 'Needs the server worker to be running. Uses a random device id, no account.' : 'The server has no VAPID keys yet. See README, section “Web Push”.'}
              checked={prefs.pushEnabled} onChange={(v) => !busy && notificationsSupported() && togglePush(v)} />
          </div>
          {notice && <p role="status" className="mt-2 text-sm font-medium">{notice}</p>}
        </Card>

        <Card title="Your data">
          <p className="muted">Everything is stored on this device. {state.entries.length.toLocaleString('en-US')} drinks saved.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn btn-ghost" disabled={!state.entries.length} onClick={() => downloadCsv(entriesToCsv(state.entries, tz))}><Download className="h-4 w-4" aria-hidden /> Export CSV</button>
            <button className="btn btn-danger" onClick={reset}><Trash2 className="h-4 w-4" aria-hidden /> Delete all data</button>
          </div>
          {!notificationsSupported() && <p className="muted mt-2"><BellOff className="mr-1 inline h-4 w-4" aria-hidden />This browser can&apos;t show notifications, so in-app reminders will be used.</p>}
        </Card>
      </div>
    </>
  );
}
