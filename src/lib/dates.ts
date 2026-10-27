const cache = new Map<string, Intl.DateTimeFormat>();

function fmt(tz: string): Intl.DateTimeFormat {
  let f = cache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    cache.set(tz, f);
  }
  return f;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function localParts(ts: number, tz: string) {
  const parts = fmt(tz).formatToParts(ts);
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: g('year'), month: g('month'), day: g('day'), hour: g('hour') % 24, minute: g('minute') };
}

/** Local calendar day (YYYY-MM-DD) for an instant. Correct across midnight and DST changes. */
export function dayKey(ts: number, tz: string): string {
  const p = localParts(ts, tz);
  return `${String(p.year).padStart(4, '0')}-${pad(p.month)}-${pad(p.day)}`;
}

export function minutesOfDay(ts: number, tz: string): number {
  const p = localParts(ts, tz);
  return p.hour * 60 + p.minute;
}

const utcOf = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export function addDays(key: string, n: number): string {
  return new Date(utcOf(key) + n * 86400000).toISOString().slice(0, 10);
}

/** Number of calendar days from a to b (b - a). */
export function dayDiff(a: string, b: string): number {
  return Math.round((utcOf(b) - utcOf(a)) / 86400000);
}

/** Last n day keys ending at todayKey, oldest first. */
export function lastNDays(todayKey: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(todayKey, i - (n - 1)));
}

/** Instant for a local day + minutes-after-midnight in a time zone (handles DST offsets). */
export function zonedTimeToTs(key: string, minutes: number, tz: string): number {
  const [y, m, d] = key.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  const localAsUtc = (ts: number) => {
    const p = localParts(ts, tz);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  };
  let ts = guess - (localAsUtc(guess) - guess);
  ts = guess - (localAsUtc(ts) - ts);
  return ts;
}

export function formatTime(ts: number, tz: string): string {
  return new Date(ts).toLocaleTimeString([], { timeZone: tz, hour: 'numeric', minute: '2-digit' });
}

export function formatDayLabel(
  key: string,
  opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }
): string {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString(undefined, { timeZone: 'UTC', ...opts });
}

export function minToTimeInput(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function timeInputToMin(v: string): number {
  const [h, m] = v.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatMinutes(min: number): string {
  const d = new Date(Date.UTC(2000, 0, 1, Math.floor(min / 60) % 24, min % 60));
  return d.toLocaleTimeString([], { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' });
}

/** Weeks (Mon-first) of day keys for a month; null pads leading/trailing cells. */
export function monthGrid(year: number, month0: number): (string | null)[][] {
  const first = new Date(Date.UTC(year, month0, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${year}-${pad(month0 + 1)}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
