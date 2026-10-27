'use client';

import { useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import type { Unit } from '../../types';
import { MAX_ENTRY_ML, QUICK_ADD_ML, isLargeEntry, validateAmount } from '../../lib/hydration';
import { UNIT_LABEL, formatMl, inputStep, toMl } from '../../lib/units';

export function AddDrinkPanel({ unit, onAdd }: { unit: Unit; onAdd: (ml: number) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<number | null>(null);

  const commit = (ml: number) => {
    const v = validateAmount(ml);
    if (!v.ok) return setError(v.error);
    setError(null);
    if (isLargeEntry(v.value) && pending !== v.value) return setPending(v.value);
    setPending(null);
    setValue('');
    onAdd(v.value);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Quick add">
        {QUICK_ADD_ML.map((ml) => (
          <button key={ml} className="btn btn-primary" onClick={() => commit(ml)} aria-label={`Add ${ml} millilitres`}>
            <Plus className="h-4 w-4" aria-hidden /> {ml} mL
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <div className="flex-1">
          <label htmlFor="custom-amount" className="sr-only">Custom amount in {UNIT_LABEL[unit]}</label>
          <input id="custom-amount" className="input" type="number" inputMode="decimal" min={0} step={inputStep(unit)} placeholder={`Custom amount (${UNIT_LABEL[unit]})`}
            value={value} onChange={(e) => { setValue(e.target.value); setError(null); setPending(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(toMl(Number(value), unit)); }} aria-invalid={!!error} aria-describedby={error ? 'amount-error' : undefined} />
        </div>
        <button className="btn btn-ghost" disabled={!value} onClick={() => commit(toMl(Number(value), unit))}>Add</button>
      </div>

      {error && <p id="amount-error" role="alert" className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{error}</p>}

      {pending !== null && (
        <div role="alert" className="mt-3 rounded-2xl border border-amber-300/70 bg-amber-50/80 p-3 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">
          <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" aria-hidden /> That&apos;s a big one: {formatMl(pending)}</p>
          <p className="mt-1">Drinking a lot at once isn&apos;t a good idea. If you logged several drinks together, that&apos;s fine. Otherwise please sip steadily through the day (max {MAX_ENTRY_ML.toLocaleString('en-US')} mL per entry).</p>
          <div className="mt-2 flex gap-2">
            <button className="btn btn-primary !py-1.5" onClick={() => commit(pending)}>Log it</button>
            <button className="btn btn-ghost !py-1.5" onClick={() => setPending(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
