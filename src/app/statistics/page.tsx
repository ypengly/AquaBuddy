'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { IntakeChart } from '../../components/charts/IntakeChart';
import { Card, PageHeader, Stat } from '../../components/ui/Section';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToday } from '../../hooks/useToday';
import { formatDayLabel } from '../../lib/dates';
import { buildChartData } from '../../lib/stats';
import { formatMl, formatVolume } from '../../lib/units';

export default function StatisticsPage() {
  return (
    <AppShell>
      <Statistics />
    </AppShell>
  );
}

const RANGES = [{ n: 7, label: 'Week' }, { n: 30, label: 'Month' }, { n: 90, label: '3 months' }];

function Statistics() {
  const { state, prefs, tz, todayKey, stats } = useToday();
  const [n, setN] = useState(7);
  const data = buildChartData(state.entries, state.goalByDay, prefs.goalMl, tz, todayKey, n);
  const rangeTotal = data.reduce((t, d) => t + d.ml, 0);
  const rangeActive = data.filter((d) => d.ml > 0).length;
  const rangeMet = data.filter((d) => d.met).length;

  return (
    <>
      <PageHeader title="Statistics" subtitle="Your hydration at a glance." />
      {!state.entries.length ? (
        <Card><EmptyState icon="📊" title="Charts appear after your first drink">Log a drink on the Today page and your stats will start filling up.</EmptyState></Card>
      ) : (
        <div className="space-y-5">
          <div role="tablist" aria-label="Range" className="glass inline-flex p-1">
            {RANGES.map((r) => (
              <button key={r.n} role="tab" aria-selected={n === r.n} onClick={() => setN(r.n)} className={`rounded-full px-4 py-1.5 font-semibold ${n === r.n ? 'bg-aqua-500 text-white' : ''}`}>{r.label}</button>
            ))}
          </div>

          <Card title="Intake per day">
            <IntakeChart data={data} />
            <p className="muted mt-2">Dark bars reached the target for that day. The dashed line is your target at the time.</p>
          </Card>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={`Total (${RANGES.find((r) => r.n === n)!.label.toLowerCase()})`} value={formatMl(rangeTotal)} sub={prefs.unit !== 'ml' ? formatVolume(rangeTotal, prefs.unit) : undefined} />
            <Stat label="Daily average (active days)" value={formatMl(rangeActive ? Math.round(rangeTotal / rangeActive) : 0)} sub={`${rangeActive} active days`} />
            <Stat label="Target reached" value={`${rangeMet} / ${n}`} sub="days in range" />
            <Stat label="Lifetime total" value={formatVolume(stats.totalMl, stats.totalMl >= 10000 ? 'l' : 'ml')} sub={`${stats.activeDays} days tracked`} />
            <Stat label="Current streak" value={`${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'}`} />
            <Stat label="Best streak" value={`${stats.bestStreak} day${stats.bestStreak === 1 ? '' : 's'}`} />
            <Stat label="Overall average" value={formatMl(stats.avgMl)} sub="per tracked day" />
            <Stat label="Goal days" value={String(stats.goalDays)} sub="all time" />
          </div>

          <Card title="Goal completion history">
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {[...data].reverse().slice(0, 14).map((d) => (
                <li key={d.key} className="flex items-center justify-between rounded-2xl bg-white/40 px-3 py-2 dark:bg-white/5">
                  <span className="text-sm font-semibold">{formatDayLabel(d.key)}</span>
                  <span className="flex items-center gap-2 text-sm">{formatMl(d.ml)} <span className={`grid h-5 w-5 place-items-center rounded-full ${d.met ? 'bg-aqua-500 text-white' : 'bg-aqua-200/60 dark:bg-white/10'}`}>{d.met ? <Check className="h-3 w-3" aria-label="Target reached" /> : <span className="sr-only">Target not reached</span>}</span></span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
