'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DrinkList } from '../../components/hydration/DrinkList';
import { Card, PageHeader } from '../../components/ui/Section';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToday } from '../../hooks/useToday';
import { downloadCsv, entriesToCsv } from '../../lib/csv';
import { addDays, dayKey, formatDayLabel, monthGrid } from '../../lib/dates';
import { dayTotals, entriesForDay, progress } from '../../lib/hydration';
import { formatMl } from '../../lib/units';
import type { DrinkEntry } from '../../types';

export default function HistoryPage() {
  return (
    <AppShell>
      <History />
    </AppShell>
  );
}

type Tab = 'day' | 'calendar' | 'all';

function History() {
  const { state, prefs, tz, todayKey, dispatch } = useToday();
  const [tab, setTab] = useState<Tab>('day');
  const [selected, setSelected] = useState(todayKey);
  const [ym, setYm] = useState(() => ({ y: Number(todayKey.slice(0, 4)), m: Number(todayKey.slice(5, 7)) - 1 }));
  const [limit, setLimit] = useState(100);
  const [undo, setUndo] = useState<DrinkEntry | null>(null);

  const totals = useMemo(() => dayTotals(state.entries, tz), [state.entries, tz]);
  const goalFor = (k: string) => state.goalByDay[k] ?? prefs.goalMl;
  const dayEntries = entriesForDay(state.entries, selected, tz);
  const grouped = useMemo(() => {
    const sorted = [...state.entries].sort((a, b) => b.at - a.at).slice(0, limit);
    const groups = new Map<string, DrinkEntry[]>();
    for (const e of sorted) groups.set(dayKey(e.at, tz), [...(groups.get(dayKey(e.at, tz)) ?? []), e]);
    return [...groups.entries()];
  }, [state.entries, limit, tz]);

  const remove = (e: DrinkEntry) => { dispatch({ type: 'DELETE', id: e.id }); setUndo(e); };
  const edit = (id: string, amountMl: number, at: number) => dispatch({ type: 'EDIT', id, amountMl, at });

  const DayDetail = (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button className="rounded-full p-2 hover:bg-white/50 dark:hover:bg-white/10" aria-label="Previous day" onClick={() => setSelected(addDays(selected, -1))}><ChevronLeft className="h-5 w-5" /></button>
          <label className="sr-only" htmlFor="day-pick">Choose a day</label>
          <input id="day-pick" type="date" className="input !w-auto" value={selected} max={todayKey} onChange={(e) => e.target.value && setSelected(e.target.value)} />
          <button className="rounded-full p-2 hover:bg-white/50 disabled:opacity-30 dark:hover:bg-white/10" aria-label="Next day" disabled={selected >= todayKey} onClick={() => setSelected(addDays(selected, 1))}><ChevronRight className="h-5 w-5" /></button>
        </div>
        <p className="font-semibold">{formatMl(totals[selected] ?? 0)} <span className="muted">of {formatMl(goalFor(selected))} · {progress(totals[selected] ?? 0, goalFor(selected)).percent}%</span></p>
      </div>
      <DrinkList entries={dayEntries} tz={tz} unit={prefs.unit} onEdit={edit} onDelete={remove} emptyText={`No drinks logged on ${formatDayLabel(selected)}.`} />
    </Card>
  );

  const weeks = monthGrid(ym.y, ym.m);
  const shiftMonth = (d: number) => setYm(({ y, m }) => { const n = m + d; return { y: y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 }; });

  return (
    <>
      <PageHeader title="Drink history" subtitle="Every drink, with its exact time."
        action={<button className="btn btn-ghost" disabled={!state.entries.length} onClick={() => downloadCsv(entriesToCsv(state.entries, tz))}><Download className="h-4 w-4" aria-hidden /> Export CSV</button>} />

      <div role="tablist" aria-label="History views" className="glass mb-5 inline-flex p-1">
        {(['day', 'calendar', 'all'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`rounded-full px-4 py-1.5 font-semibold capitalize ${tab === t ? 'bg-aqua-500 text-white' : ''}`} onClick={() => setTab(t)}>{t === 'all' ? 'All drinks' : t}</button>
        ))}
      </div>

      {undo && (
        <div role="status" className="glass mb-4 flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-sm font-semibold">Deleted {formatMl(undo.amountMl)}</span>
          <button className="btn btn-ghost !px-3 !py-1 text-sm" onClick={() => { dispatch({ type: 'RESTORE', entry: undo }); setUndo(null); }}>Undo</button>
        </div>
      )}

      {tab === 'day' && DayDetail}

      {tab === 'calendar' && (
        <div className="space-y-5">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <button className="rounded-full p-2 hover:bg-white/50 dark:hover:bg-white/10" aria-label="Previous month" onClick={() => shiftMonth(-1)}><ChevronLeft className="h-5 w-5" /></button>
              <h2 className="font-display text-lg font-semibold">{new Date(Date.UTC(ym.y, ym.m, 1)).toLocaleDateString(undefined, { timeZone: 'UTC', month: 'long', year: 'numeric' })}</h2>
              <button className="rounded-full p-2 hover:bg-white/50 dark:hover:bg-white/10" aria-label="Next month" onClick={() => shiftMonth(1)}><ChevronRight className="h-5 w-5" /></button>
            </div>
            <table className="w-full table-fixed text-center">
              <thead><tr>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <th key={d} className="pb-2 text-xs font-semibold opacity-70">{d}</th>)}</tr></thead>
              <tbody>
                {weeks.map((w, i) => (
                  <tr key={i}>
                    {w.map((k, j) => {
                      if (!k) return <td key={j} />;
                      const ml = totals[k] ?? 0;
                      const pct = Math.min(1, ml / goalFor(k));
                      const future = k > todayKey;
                      return (
                        <td key={k} className="p-0.5">
                          <button disabled={future} onClick={() => { setSelected(k); setTab('day'); }} aria-label={`${formatDayLabel(k)}: ${formatMl(ml)}${pct >= 1 ? ', target reached' : ''}`}
                            className={`aspect-square w-full rounded-xl text-sm font-semibold transition hover:ring-2 hover:ring-aqua-400 disabled:opacity-30 ${k === todayKey ? 'ring-2 ring-aqua-500' : ''}`}
                            style={{ background: ml ? `rgba(10,169,201,${0.15 + pct * 0.75})` : 'rgba(165,238,250,.2)', color: pct > 0.55 ? '#fff' : undefined }}>
                            {Number(k.slice(8))}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted mt-3">Darker days are closer to (or past) your target. Select a day to see its drinks.</p>
          </Card>
        </div>
      )}

      {tab === 'all' && (
        <div className="space-y-5">
          {!grouped.length ? <Card><EmptyState icon="📒" title="No history yet">Drinks you log will be listed here with exact times.</EmptyState></Card> : grouped.map(([k, es]) => (
            <Card key={k} title={`${formatDayLabel(k, { weekday: 'long', month: 'long', day: 'numeric' })} · ${formatMl(es.reduce((t, e) => t + e.amountMl, 0))}`}>
              <DrinkList entries={[...es].sort((a, b) => a.at - b.at)} tz={tz} unit={prefs.unit} onEdit={edit} onDelete={remove} />
            </Card>
          ))}
          {state.entries.length > limit && <button className="btn btn-ghost mx-auto" onClick={() => setLimit((l) => l + 100)}>Show more</button>}
        </div>
      )}
    </>
  );
}
