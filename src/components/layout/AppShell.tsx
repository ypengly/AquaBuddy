'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { BarChart3, CircleHelp, Droplets, History, LayoutDashboard, Settings, Trophy } from 'lucide-react';
import { useAqua } from '../../hooks/useAqua';

const NAV = [
  { href: '/dashboard', label: 'Today', icon: LayoutDashboard },
  { href: '/history', label: 'History', icon: History },
  { href: '/statistics', label: 'Stats', icon: BarChart3 },
  { href: '/achievements', label: 'Badges', icon: Trophy },
  { href: '/settings', label: 'Settings', icon: Settings },
];
const SIDEBAR = [...NAV, { href: '/help', label: 'Help & FAQ', icon: CircleHelp }];

export function AppShell({ children }: { children: ReactNode }) {
  const { state, ready } = useAqua();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (ready && !state.prefs) router.replace('/onboarding');
  }, [ready, state.prefs, router]);

  if (!ready || !state.prefs) {
    return (
      <div className="grid min-h-dvh place-items-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <Droplets className="h-10 w-10 animate-pulse text-aqua-500" aria-hidden />
          <p className="muted">Filling your bottle…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh md:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-aqua-800">
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 p-4 md:block">
        <div className="glass flex h-full flex-col p-4">
          <Link href="/" className="mb-6 flex items-center gap-2 px-2 font-display text-xl font-bold">
            <Droplets className="h-6 w-6 text-aqua-500" aria-hidden /> AquaBuddy
          </Link>
          <nav aria-label="Main" className="flex flex-col gap-1">
            {SIDEBAR.map(({ href, label, icon: Icon }) => {
              const active = path === href;
              return (
                <Link key={href} href={href} aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold transition ${active ? 'bg-aqua-500 text-white shadow-md shadow-aqua-500/30' : 'hover:bg-white/50 dark:hover:bg-white/10'}`}>
                  <Icon className="h-5 w-5" aria-hidden /> {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">{children}</main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 p-3 md:hidden">
        <ul className="glass mx-auto flex max-w-md justify-around p-1.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? 'page' : undefined}
                  className={`flex min-w-[3.6rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-xs font-semibold ${active ? 'bg-aqua-500 text-white' : ''}`}>
                  <Icon className="h-5 w-5" aria-hidden /> {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
