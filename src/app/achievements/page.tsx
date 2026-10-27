'use client';

import { AppShell } from '../../components/layout/AppShell';
import { Mascot } from '../../components/hydration/Mascot';
import { Card, PageHeader } from '../../components/ui/Section';
import { useToday } from '../../hooks/useToday';
import { ACHIEVEMENTS } from '../../data/achievements';
import { challengesForDay } from '../../lib/challenges';
import { stageName, XP_PER_BADGE, XP_PER_GOAL_DAY, XP_PER_LOG, MAX_XP_LOGS_PER_DAY } from '../../lib/stats';

export default function AchievementsPage() {
  return (
    <AppShell>
      <Achievements />
    </AppShell>
  );
}

function Achievements() {
  const { state, level, xp, stats, prog, todayEntries, tz, goalMl, totalMl, todayKey } = useToday();
  const earnedCount = Object.keys(state.earned).length;
  return (
    <>
      <PageHeader title="Badges & level" subtitle="Rewards for steady habits, never for drinking fast." />
      <div className="grid gap-5 md:grid-cols-[260px_1fr]">
        <section className="glass flex flex-col items-center p-5 text-center" aria-label="Level">
          <Mascot percent={prog.percent} level={level.level} size={140} />
          <p className="font-display text-xl font-bold">{stageName(level.level)}</p>
          <p className="muted">Level {level.level} · {xp} XP</p>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-aqua-200/60 dark:bg-white/10" role="progressbar" aria-valuenow={level.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level">
            <div className="h-full rounded-full bg-aqua-500" style={{ width: `${level.pct}%` }} />
          </div>
          <p className="muted mt-1">{level.needed - level.into} XP to level {level.level + 1}</p>
          <p className="muted mt-3">Streak: {stats.currentStreak} · Best: {stats.bestStreak}</p>
        </section>

        <div className="space-y-5">
          <Card title={`Badges (${earnedCount}/${ACHIEVEMENTS.length})`}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {ACHIEVEMENTS.map((a) => {
                const at = state.earned[a.id];
                return (
                  <li key={a.id} className={`flex items-start gap-3 rounded-2xl p-3 ${at ? 'bg-aqua-100/70 dark:bg-aqua-500/15' : 'bg-white/30 opacity-60 dark:bg-white/5'}`}>
                    <span className={`text-3xl ${at ? '' : 'grayscale'}`} aria-hidden>{a.icon}</span>
                    <div>
                      <p className="font-semibold">{a.name} <span className="sr-only">{at ? '(earned)' : '(locked)'}</span></p>
                      <p className="muted">{a.description}</p>
                      {at && <p className="muted">Earned {new Date(at).toLocaleDateString(undefined, { timeZone: tz })}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="Today's mini-challenges">
            <ul className="space-y-1.5">
              {challengesForDay(todayKey).map((c) => {
                const done = c.done(todayEntries, tz, goalMl, totalMl);
                return <li key={c.id} className="flex gap-2"><span aria-hidden>{done ? '✅' : '⬜'}</span><span><b>{c.title}</b> <span className="muted">· {c.hint}</span></span></li>;
              })}
            </ul>
          </Card>

          <Card title="How XP works">
            <ul className="muted list-disc space-y-1 pl-5">
              <li>{XP_PER_LOG} XP per logged drink, for up to {MAX_XP_LOGS_PER_DAY} per day.</li>
              <li>{XP_PER_GOAL_DAY} XP for each day you reach your own target.</li>
              <li>{XP_PER_BADGE} XP for each badge.</li>
              <li>Drinking more than your target earns nothing extra, on purpose.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
