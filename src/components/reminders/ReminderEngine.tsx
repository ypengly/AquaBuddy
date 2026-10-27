'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Droplets, X } from 'lucide-react';
import { useAqua } from '../../hooks/useAqua';
import { dayKey } from '../../lib/dates';
import { progress, totalForDay } from '../../lib/hydration';
import { pickMessage } from '../../lib/messages';
import { showBrowserNotification } from '../../lib/notify';
import { SNOOZE_OPTIONS, shouldNotify } from '../../lib/reminders';
import { newId } from '../../lib/prefs';

/** In-app reminder loop + toast. Browser notifications fire only if permission was granted by the user. */
export function ReminderEngine() {
  const { state, dispatch, ready } = useAqua();
  const ref = useRef(state);
  ref.current = state;
  const [toast, setToast] = useState<{ text: string; slot: string } | null>(null);

  useEffect(() => {
    if (!ready) return;
    const tick = () => {
      const s = ref.current;
      const p = s.prefs;
      if (!p) return;
      const now = Date.now();
      const key = dayKey(now, p.timeZone);
      const goal = s.goalByDay[key] ?? p.goalMl;
      const decision = shouldNotify({
        now,
        s: { wakeMin: p.wakeMin, bedMin: p.bedMin, intervalMin: p.intervalMin, timeZone: p.timeZone },
        enabled: p.remindersOn,
        paused: s.reminder.paused,
        snoozeUntil: s.reminder.snoozeUntil,
        lastSlot: s.reminder.lastSlot,
        goalReached: progress(totalForDay(s.entries, key, p.timeZone), goal).reached,
      });
      if (!decision) return;
      const msg = pickMessage(p.style, s.reminder.recentMessages);
      dispatch({ type: 'FIRED', slot: decision.slotKey, messageId: msg.id });
      if (p.inAppReminders && document.visibilityState === 'visible') setToast({ text: msg.text, slot: decision.slotKey });
      // With Web Push on, the server delivers the system notification; avoid duplicates.
      if (!p.pushEnabled) void showBrowserNotification(msg.text);
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [ready, dispatch]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 60_000);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-6 md:justify-end">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.slot}
            role="alert"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="glass pointer-events-auto w-full max-w-sm p-4"
          >
            <div className="flex items-start gap-3">
              <Droplets className="mt-0.5 h-5 w-5 shrink-0 text-aqua-500" aria-hidden />
              <p className="flex-1 text-sm font-medium">{toast.text}</p>
              <button className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Dismiss reminder" onClick={() => setToast(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="btn btn-primary !px-3 !py-1.5 text-sm"
                onClick={() => {
                  dispatch({ type: 'ADD', id: newId(), amountMl: 250, at: Date.now() });
                  setToast(null);
                }}
              >
                Log 250 mL
              </button>
              {SNOOZE_OPTIONS.map((m) => (
                <button
                  key={m}
                  className="btn btn-ghost !px-3 !py-1.5 text-sm"
                  onClick={() => {
                    dispatch({ type: 'SNOOZE', until: Date.now() + m * 60_000 });
                    setToast(null);
                  }}
                >
                  Snooze {m}m
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
