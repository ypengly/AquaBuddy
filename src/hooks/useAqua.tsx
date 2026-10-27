'use client';

import { createContext, useContext, useEffect, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import type { AppState } from '../types';
import { STORAGE_KEY, initialState, parseStored, reducer, type Action } from '../lib/state';

interface Ctx {
  state: AppState;
  dispatch: Dispatch<Action>;
  ready: boolean;
}

const AquaContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ready, setReady] = useState(false);

  // Load once on the client (avoids hydration mismatches).
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage blocked: run in memory */
    }
    dispatch({ type: 'LOAD', state: parseStored(raw) });
    setReady(true);
  }, []);

  // Persist every change.
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota or blocked: ignore */
    }
  }, [state, ready]);

  // Keep several tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) dispatch({ type: 'LOAD', state: parseStored(e.newValue) });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Theme and motion preferences.
  const theme = state.prefs?.theme ?? 'system';
  const reduced = state.prefs?.reducedMotion ?? false;
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && mq.matches));
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduced);
  }, [reduced]);

  const value = useMemo(() => ({ state, dispatch, ready }), [state, ready]);
  return <AquaContext.Provider value={value}>{children}</AquaContext.Provider>;
}

export function useAqua(): Ctx {
  const c = useContext(AquaContext);
  if (!c) throw new Error('useAqua must be used inside <StoreProvider>');
  return c;
}
