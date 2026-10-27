'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAqua } from '../../hooks/useAqua';
import { ACHIEVEMENTS } from '../../data/achievements';
import { evaluateAchievements } from '../../lib/achievements';
import { computeStats } from '../../lib/stats';

/** Awards badges when history crosses a threshold and shows a short unlock toast. */
export function GamificationWatcher() {
  const { state, dispatch, ready } = useAqua();
  const [unlocked, setUnlocked] = useState<string | null>(null);

  useEffect(() => {
    const p = state.prefs;
    if (!ready || !p) return;
    const now = Date.now();
    const stats = computeStats(state.entries, state.goalByDay, p.goalMl, p.timeZone, now);
    const ids = evaluateAchievements({ entries: state.entries, stats, goalByDay: state.goalByDay, defaultGoal: p.goalMl, tz: p.timeZone, now });
    const fresh = ids.filter((id) => !(id in state.earned));
    if (!fresh.length) return;
    dispatch({ type: 'EARN', ids: fresh, at: now });
    // Don't announce the backlog when an existing history is first loaded.
    if (Object.keys(state.earned).length > 0 || state.entries.length <= 3) {
      const def = ACHIEVEMENTS.find((a) => a.id === fresh[0]);
      if (def) setUnlocked(`${def.icon} Badge unlocked: ${def.name}`);
    }
  }, [state.entries, state.goalByDay, state.earned, state.prefs, ready, dispatch]);

  useEffect(() => {
    if (!unlocked) return;
    const id = setTimeout(() => setUnlocked(null), 4500);
    return () => clearTimeout(id);
  }, [unlocked]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {unlocked && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="glass px-5 py-3 text-sm font-semibold">
            {unlocked}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
