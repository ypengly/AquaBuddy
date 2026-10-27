import type { DrinkEntry } from '../types';
import { dayKey, formatTime } from './dates';

function cell(v: string | number): string {
  let s = String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function entriesToCsv(entries: DrinkEntry[], tz: string): string {
  const header = ['id', 'local_date', 'local_time', 'timestamp_utc', 'amount_ml', 'note'];
  const rows = [...entries]
    .sort((a, b) => a.at - b.at)
    .map((e) => [e.id, dayKey(e.at, tz), formatTime(e.at, tz), new Date(e.at).toISOString(), e.amountMl, e.note ?? ''].map(cell).join(','));
  return [header.join(','), ...rows].join('\n') + '\n';
}

export function downloadCsv(csv: string, filename = 'aquabuddy-history.csv') {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
