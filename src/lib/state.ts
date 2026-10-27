import type { AppState, DrinkEntry, Prefs } from '../types';
import { dayKey } from './dates';
import { validateAmount } from './hydration';
import { validatePrefs } from './prefs';

export const initialState: AppState = {
  version: 1,
  prefs: null,
  entries: [],
  goalByDay: {},
  earned: {},
  reminder: { paused: false, snoozeUntil: null, lastSlot: null, recentMessages: [] },
  lastAddedId: null,
};

export type Action =
  | { type: 'LOAD'; state: AppState }
  | { type: 'ONBOARD'; prefs: Prefs; now: number }
  | { type: 'UPDATE_PREFS'; patch: Partial<Prefs>; now: number }
  | { type: 'ADD'; id: string; amountMl: number; at: number; note?: string }
  | { type: 'EDIT'; id: string; amountMl: number; at?: number }
  | { type: 'DELETE'; id: string }
  | { type: 'RESTORE'; entry: DrinkEntry }
  | { type: 'UNDO' }
  | { type: 'SNOOZE'; until: number | null }
  | { type: 'PAUSE'; paused: boolean }
  | { type: 'FIRED'; slot: string; messageId: number }
  | { type: 'EARN'; ids: string[]; at: number }
  | { type: 'RESET' };

const RECENT_KEEP = 40;

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD':
      return action.state;

    case 'ONBOARD': {
      if (validatePrefs(action.prefs)) return state;
      const key = dayKey(action.now, action.prefs.timeZone);
      return { ...state, prefs: action.prefs, goalByDay: { ...state.goalByDay, [key]: action.prefs.goalMl } };
    }

    case 'UPDATE_PREFS': {
      if (!state.prefs) return state;
      const next = { ...state.prefs, ...action.patch };
      if (validatePrefs(next)) return state;
      const goalByDay = { ...state.goalByDay };
      if (next.goalMl !== state.prefs.goalMl) goalByDay[dayKey(action.now, next.timeZone)] = next.goalMl;
      return { ...state, prefs: next, goalByDay };
    }

    case 'ADD': {
      if (!state.prefs || !validateAmount(action.amountMl).ok) return state;
      if (state.entries.some((e) => e.id === action.id)) return state;
      const key = dayKey(action.at, state.prefs.timeZone);
      const entry: DrinkEntry = {
        id: action.id,
        amountMl: action.amountMl,
        at: action.at,
        ...(action.note ? { note: action.note } : {}),
      };
      return {
        ...state,
        entries: [...state.entries, entry],
        goalByDay: key in state.goalByDay ? state.goalByDay : { ...state.goalByDay, [key]: state.prefs.goalMl },
        lastAddedId: action.id,
      };
    }

    case 'EDIT': {
      if (!validateAmount(action.amountMl).ok) return state;
      return {
        ...state,
        entries: state.entries.map((e) => (e.id === action.id ? { ...e, amountMl: action.amountMl, at: action.at ?? e.at } : e)),
      };
    }

    case 'DELETE':
      return {
        ...state,
        entries: state.entries.filter((e) => e.id !== action.id),
        lastAddedId: state.lastAddedId === action.id ? null : state.lastAddedId,
      };

    case 'RESTORE':
      if (state.entries.some((e) => e.id === action.entry.id)) return state;
      return { ...state, entries: [...state.entries, action.entry] };

    case 'UNDO': {
      if (!state.lastAddedId) return state;
      return { ...state, entries: state.entries.filter((e) => e.id !== state.lastAddedId), lastAddedId: null };
    }

    case 'SNOOZE':
      return { ...state, reminder: { ...state.reminder, snoozeUntil: action.until } };

    case 'PAUSE':
      return { ...state, reminder: { ...state.reminder, paused: action.paused, snoozeUntil: null } };

    case 'FIRED':
      return {
        ...state,
        reminder: {
          ...state.reminder,
          lastSlot: action.slot,
          snoozeUntil: null,
          recentMessages: [...state.reminder.recentMessages, action.messageId].slice(-RECENT_KEEP),
        },
      };

    case 'EARN': {
      const earned = { ...state.earned };
      for (const id of action.ids) if (!(id in earned)) earned[id] = action.at;
      return { ...state, earned };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export const STORAGE_KEY = 'aquabuddy:v1';

export function parseStored(raw: string | null): AppState {
  if (!raw) return initialState;
  try {
    const d = JSON.parse(raw) as Partial<AppState>;
    if (d.version !== 1 || !Array.isArray(d.entries)) return initialState;
    const entries = d.entries.filter(
      (e): e is DrinkEntry => !!e && typeof e.id === 'string' && Number.isInteger(e.amountMl) && Number.isFinite(e.at)
    );
    return {
      ...initialState,
      ...d,
      entries,
      goalByDay: d.goalByDay ?? {},
      earned: d.earned ?? {},
      reminder: { ...initialState.reminder, ...(d.reminder ?? {}) },
      prefs: d.prefs ?? null,
    } as AppState;
  } catch {
    return initialState;
  }
}
