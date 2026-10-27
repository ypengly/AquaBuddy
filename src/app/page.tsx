'use client';

import Link from 'next/link';
import { Bell, BarChart3, Droplets, Moon, Smartphone, Sparkles } from 'lucide-react';
import { Bottle } from '../components/hydration/Bottle';
import { Mascot } from '../components/hydration/Mascot';
import { useAqua } from '../hooks/useAqua';

const FEATURES = [
  { icon: Droplets, title: 'Exact, effortless logging', text: 'Quick-add 100 to 500 mL or enter your own amount. Everything is stored in whole millilitres.' },
  { icon: Bell, title: 'Reminders with personality', text: 'Over 100 messages in four styles: funny, cute, motivational or minimal. Snooze or pause any time.' },
  { icon: Sparkles, title: 'Gentle gamification', text: 'XP, streaks and badges that reward steady habits, never speed-drinking.' },
  { icon: BarChart3, title: 'Clear history', text: 'Daily, weekly and monthly charts, a calendar, and CSV export.' },
  { icon: Smartphone, title: 'Installable and private', text: 'Works as an app on your phone. Your data stays on your device, no account needed.' },
  { icon: Moon, title: 'Comfortable anywhere', text: 'Light and dark themes, keyboard friendly, reduced-motion option.' },
];

export default function Landing() {
  const { state, ready } = useAqua();
  const returning = ready && !!state.prefs;
  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-6">
      <nav className="flex items-center justify-between" aria-label="Site">
        <span className="flex items-center gap-2 font-display text-xl font-bold"><Droplets className="h-6 w-6 text-aqua-500" aria-hidden /> AquaBuddy</span>
        <div className="flex gap-2">
          <Link href="/help" className="btn btn-ghost !py-2">Help</Link>
          <Link href={returning ? '/dashboard' : '/onboarding'} className="btn btn-primary !py-2">{returning ? 'Open dashboard' : 'Get started'}</Link>
        </div>
      </nav>

      <section className="grid items-center gap-8 py-12 md:grid-cols-[1.1fr_0.9fr] md:py-20">
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">A little buddy for your daily water.</h1>
          <p className="mt-4 max-w-xl text-lg opacity-80">AquaBuddy tracks every sip, nudges you with reminders that make you smile, and cheers you on. No sign-up. Set your own goal and go at your own pace.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={returning ? '/dashboard' : '/onboarding'} className="btn btn-primary text-lg">{returning ? 'Back to today' : 'Start in a minute'}</Link>
            <a href="#features" className="btn btn-ghost text-lg">See what&apos;s inside</a>
          </div>
        </div>
        <div className="glass relative flex items-end justify-center gap-2 p-6">
          <div className="w-40 sm:w-48"><Bottle fill={0.62} percent={62} /></div>
          <div className="-mb-2"><Mascot percent={62} level={4} size={130} /></div>
        </div>
      </section>

      <section id="features" aria-labelledby="features-h" className="py-8">
        <h2 id="features-h" className="font-display text-2xl font-bold md:text-3xl">Built for a calm, steady habit</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="glass p-5">
              <Icon className="h-6 w-6 text-aqua-500" aria-hidden />
              <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
              <p className="muted mt-1">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="muted mx-auto mt-10 max-w-2xl text-center">
        AquaBuddy is a habit helper, not medical advice. Hydration needs vary with health, activity and climate. Choose a target that suits you, and talk to a health professional if you have a medical condition.
      </p>
    </main>
  );
}
