export type Unit = 'ml' | 'l' | 'floz';
export type Style = 'funny' | 'cute' | 'motivational' | 'minimal';
export type Theme = 'system' | 'light' | 'dark';

export interface Prefs {
  goalMl: number;
  wakeMin: number; // minutes after local midnight
  bedMin: number;
  intervalMin: number;
  style: Style;
  unit: Unit;
  timeZone: string;
  theme: Theme;
  sound: boolean;
  reducedMotion: boolean;
  remindersOn: boolean;
  inAppReminders: boolean;
  pushEnabled: boolean;
  deviceId: string;
}

export interface DrinkEntry {
  id: string;
  amountMl: number; // integer millilitres
  at: number; // epoch ms (absolute instant)
  note?: string;
}

export interface ReminderState {
  paused: boolean;
  snoozeUntil: number | null;
  lastSlot: string | null;
  recentMessages: number[];
}

export interface AppState {
  version: 1;
  prefs: Prefs | null;
  entries: DrinkEntry[];
  goalByDay: Record<string, number>; // snapshot of the goal in effect on each local day
  earned: Record<string, number>; // achievement id -> earned at (epoch ms)
  reminder: ReminderState;
  lastAddedId: string | null;
}
