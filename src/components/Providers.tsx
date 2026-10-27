'use client';

import type { ReactNode } from 'react';
import { StoreProvider } from '../hooks/useAqua';
import { ReminderEngine } from './reminders/ReminderEngine';
import { GamificationWatcher } from './gamification/GamificationWatcher';
import { BackgroundServices } from './reminders/BackgroundServices';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <BackgroundServices />
      <ReminderEngine />
      <GamificationWatcher />
      {children}
    </StoreProvider>
  );
}
