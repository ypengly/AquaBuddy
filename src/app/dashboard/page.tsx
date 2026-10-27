'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Undo2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { Bottle } from '../../components/hydration/Bottle';
import { Mascot, MOOD_TEXT, moodFor } from '../../components/hydration/Mascot';
import { AddDrinkPanel } from '../../components/hydration/AddDrinkPanel';
import { DrinkList } from '../../components/hydration/DrinkList';
import { Confetti } from '../../components/gamification/Confetti';
import { Card, PageHeader } from '../../components/ui/Section';
import { useToday } from '../../hooks/useToday';
import { challengesForDay } from '../../lib/challenges';
import { formatDayLabel, formatMinutes } from '../../lib/dates';
import { MILESTONES } from '../../lib/hydration';
import { newId } from '../../lib/prefs';
import { nextReminderTs } from '../../lib/reminders';
import { playSound } from '../../lib/sound';
import { formatMl, formatVolume } from '../../lib/units';
import { formatTime } from '../../lib/dates';
import type { DrinkEntry } from '../../types';

export default function DashboardPage() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

type Toast = { text: string; undo: () => void } | null;

function Dashboard() {
  const t = useToday();
  const { prefs, dispatch, prog, totalMl, goalMl, todayKey, todayEntries, tz, now, level, stats, state } = t;
  const [toast, setToast] = useState<Toast>(null);
  const [celebrate, setCelebrate] = useState(false);
  const reachedRef = useRef<boolean | null>(null);
  const reduced = prefs.reducedMotion || (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (reachedRef.current === null) {
      reachedRef.current = prog.reached; // don't celebrate on page load
      return;
    }
    if (prog.reached && !reachedRef.current) {
      setCelebrate(true);
      if (prefs.sound) playSound('success');
      const id = setTimeout(() => setCelebrate(false), 4800);
      reachedRef.current = true;
      return () => clearTimeout(id);
    }
    reachedRef.current = prog.reached;
  }, [prog.reached, prefs.sound]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(id);
  }, [toast]);

  const add = (ml: number) => {
    dispatch({ type: 'ADD', id: newId(), amountMl: ml, at: Date.now() });
    if (prefs.sound) playSound('drop');
    setToast({ text: `Added ${formatMl(ml)}`, undo: () => dispatch({ type: 'UNDO' }) });
  };

  const remove = (e: DrinkEntry) => {
    dispatch({ type: 'DELETE', id: e.id });
    setToast({ text: `Deleted ${formatMl(e.amountMl)}`, undo: () => dispatch({ type: 'RESTORE', entry: e }) });
  };

  const challenges = challengesForDay(todayKey).map((c) => ({ c, done: c.done(todayEntries, tz, goalMl, totalMl) }));
  const next = prefs.remindersOn && !state.reminder.paused && !prog.reached ? nextReminderTs(now, { wakeMin: prefs.wakeMin, bedMin: prefs.bedMin, intervalMin: prefs.intervalMin, timeZone: tz }) : null;

  return (
    <>
      {celebrate && <Confetti reduced={reduced} />}
      <PageHeader title="Today" subtitle={`${formatDayLabel(todayKey, { weekday: 'long', month: 'long', day: 'numeric' })} · ${stats.currentStreak} day streak`} />

      <div className="grid gap-5 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <section className="glass flex flex-col items-center p-5" aria-labelledby="bottle-h">
          <h2 id="bottle-h" className="sr-only">Today&apos;s progress</h2>
          <Bottle fill={prog.fill} percent={prog.percent} />
          <p className="mt-3 font-display text-4xl font-bold" aria-live="polite">{totalMl.toLocaleString('en-US')} mL</p>
          <p className="muted">of {goalMl.toLocaleString('en-US')} mL target{prefs.unit !== 'ml' && ` (${formatVolume(totalMl, prefs.unit)} of ${formatVolume(goalMl, prefs.unit)})`}</p>
          <p className="mt-1 text-sm font-semibold">{prog.reached ? (prog.overMl ? `+${prog.overMl.toLocaleString('en-US')} mL over your target` : 'Target reached 🎉') : `${prog.remainingMl.toLocaleString('en-US')} mL to go`}</p>
          {prog.reached && <p className="muted mt-1 text-center">Nicely done. There&apos;s no need to drink more. Listen to your body.</p>}
          <ul className="mt-4 flex w-full justify-between gap-1" aria-label="Milestones">
            {MILESTONES.map((m) => (
              <li key={m} className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1 text-xs font-bold ${prog.percent >= m ? 'bg-aqua-500 text-white' : 'bg-aqua-200/50 dark:bg-white/10'}`}>
                {prog.percent >= m && <Check className="h-3 w-3" aria-hidden />} {m}%
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-5">
          <section className="glass flex items-center gap-4 p-4" aria-label="Your mascot">
            <Mascot percent={prog.percent} level={level.level} size={96} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold">{MOOD_TEXT[moodFor(prog.percent)]}</p>
              <p className="muted">Level {level.level} · {level.into}/{level.needed} XP to next</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-aqua-200/60 dark:bg-white/10" role="progressbar" aria-valuenow={level.pct} aria-valuemin={0} aria-valuemax={100} aria-label="XP to next level">
                <div className="h-full rounded-full bg-aqua-500 transition-all" style={{ width: `${level.pct}%` }} />
              </div>
              {next && <p className="muted mt-2">Next reminder around {formatTime(next, tz)} (active {formatMinutes(prefs.wakeMin)} to {formatMinutes(prefs.bedMin)})</p>}
              {state.reminder.paused && <p className="muted mt-2">Reminders are paused.</p>}
            </div>
          </section>

          <Card title="Log a drink">
            <AddDrinkPanel unit={prefs.unit} onAdd={add} />
          </Card>

          <Card title="Today's mini-challenges">
            <ul className="space-y-2">
              {challenges.map(({ c, done }) => (
                <li key={c.id} className="flex items-start gap-3">
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${done ? 'bg-aqua-500 text-white' : 'border-2 border-aqua-300'}`} aria-hidden>{done && <Check className="h-3 w-3" />}</span>
                  <span><span className="font-semibold">{c.title}</span> <span className="muted">· {c.hint}</span><span className="sr-only">{done ? ' (done)' : ' (not done)'}</span></span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Today's timeline">
            <DrinkList entries={todayEntries} tz={tz} unit={prefs.unit}
              onEdit={(id, amountMl, at) => dispatch({ type: 'EDIT', id, amountMl, at })} onDelete={remove} emptyText="Log your first drink and it will show up here." />
          </Card>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-6" aria-live="polite">
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="glass pointer-events-auto flex items-center gap-3 px-4 py-2.5">
              <span className="text-sm font-semibold">{toast.text}</span>
              <button className="btn btn-ghost !px-3 !py-1 text-sm" onClick={() => { toast.undo(); setToast(null); }}><Undo2 className="h-4 w-4" aria-hidden /> Undo</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
