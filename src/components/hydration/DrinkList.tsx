'use client';

import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import type { DrinkEntry, Unit } from '../../types';
import { dayKey, formatTime, minToTimeInput, minutesOfDay, timeInputToMin, zonedTimeToTs } from '../../lib/dates';
import { validateAmount } from '../../lib/hydration';
import { formatVolume } from '../../lib/units';
import { EmptyState } from '../ui/EmptyState';

interface Props {
  entries: DrinkEntry[];
  tz: string;
  unit: Unit;
  onEdit: (id: string, amountMl: number, at: number) => void;
  onDelete: (entry: DrinkEntry) => void;
  emptyText?: string;
}

export function DrinkList({ entries, tz, unit, onEdit, onDelete, emptyText }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!entries.length) {
    return <EmptyState icon="🫗" title="Nothing logged yet">{emptyText ?? 'Your drinks will appear here as a timeline.'}</EmptyState>;
  }

  const save = (e: DrinkEntry) => {
    const v = validateAmount(Number(amount));
    if (!v.ok) return setError(v.error);
    const at = zonedTimeToTs(dayKey(e.at, tz), timeInputToMin(time), tz);
    onEdit(e.id, v.value, at);
    setEditing(null);
    setError(null);
  };

  return (
    <ol className="relative space-y-3 border-l-2 border-aqua-300/50 pl-5">
      {entries.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[1.72rem] top-3 h-3 w-3 rounded-full bg-aqua-400 ring-4 ring-aqua-100 dark:ring-aqua-900" aria-hidden />
          {editing === e.id ? (
            <div className="glass space-y-2 p-3">
              <div className="flex flex-wrap gap-2">
                <div>
                  <label className="label" htmlFor={`amt-${e.id}`}>Amount (mL)</label>
                  <input id={`amt-${e.id}`} className="input w-32" type="number" min={1} step={10} value={amount} onChange={(ev) => setAmount(ev.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor={`time-${e.id}`}>Time</label>
                  <input id={`time-${e.id}`} className="input w-36" type="time" value={time} onChange={(ev) => setTime(ev.target.value)} />
                </div>
              </div>
              {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
              <div className="flex gap-2">
                <button className="btn btn-primary !py-1.5" onClick={() => save(e)}><Check className="h-4 w-4" aria-hidden /> Save</button>
                <button className="btn btn-ghost !py-1.5" onClick={() => { setEditing(null); setError(null); }}><X className="h-4 w-4" aria-hidden /> Cancel</button>
              </div>
            </div>
          ) : (
            <div className="glass flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <p className="font-semibold">{e.amountMl.toLocaleString('en-US')} mL{unit !== 'ml' && <span className="muted"> · {formatVolume(e.amountMl, unit)}</span>}</p>
                <p className="muted">{formatTime(e.at, tz)}</p>
              </div>
              <div className="flex gap-1">
                <button className="rounded-full p-2 hover:bg-white/60 dark:hover:bg-white/10" aria-label={`Edit ${e.amountMl} mL drink at ${formatTime(e.at, tz)}`}
                  onClick={() => { setEditing(e.id); setAmount(String(e.amountMl)); setTime(minToTimeInput(minutesOfDay(e.at, tz))); setError(null); }}>
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button className="rounded-full p-2 text-rose-600 hover:bg-rose-100/70 dark:text-rose-300 dark:hover:bg-rose-500/10" aria-label={`Delete ${e.amountMl} mL drink at ${formatTime(e.at, tz)}`} onClick={() => onDelete(e)}>
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
