'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Mascot } from '../../components/hydration/Mascot';
import { useAqua } from '../../hooks/useAqua';
import { formatMinutes, minToTimeInput, timeInputToMin } from '../../lib/dates';
import { MAX_GOAL_ML, MIN_GOAL_ML } from '../../lib/hydration';
import { INTERVALS, defaultPrefs, randomToken, validatePrefs } from '../../lib/prefs';
import { UNIT_LABEL, formatMl, fromMl, inputStep, toMl } from '../../lib/units';
import type { Prefs, Style, Unit } from '../../types';

const STYLE_INFO: Record<Style, { label: string; sample: string }> = {
  funny: { label: 'Funny', sample: 'Water you waiting for?' },
  cute: { label: 'Cute', sample: 'Pip pip! Time for a tiny sip 💧' },
  motivational: { label: 'Motivational', sample: 'Small sips build strong habits.' },
  minimal: { label: 'Minimal', sample: 'Time for water.' },
};
const UNIT_INFO: { id: Unit; label: string }[] = [{ id: 'ml', label: 'Millilitres (mL)' }, { id: 'l', label: 'Litres (L)' }, { id: 'floz', label: 'US fluid ounces' }];
const STEPS = ['Welcome', 'Target', 'Your day', 'Reminders', 'Ready'];

export default function Onboarding() {
  const router = useRouter();
  const { state, dispatch } = useAqua();
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', []);
  const [prefs, setPrefs] = useState<Prefs>(() => state.prefs ?? defaultPrefs(tz));
  const [step, setStep] = useState(0);
  const [goalText, setGoalText] = useState<string>('');
  const set = (p: Partial<Prefs>) => setPrefs((x) => ({ ...x, ...p }));

  const goalShown = goalText !== '' ? goalText : String(Math.round(fromMl(prefs.goalMl, prefs.unit) * 100) / 100);
  const error = validatePrefs({ ...prefs, deviceId: prefs.deviceId || 'x'.repeat(32) });
  const stepError = step === 1 ? (prefs.goalMl < MIN_GOAL_ML || prefs.goalMl > MAX_GOAL_ML ? error : null) : step === 2 ? (prefs.bedMin - prefs.wakeMin < 240 ? error : null) : null;

  const finish = () => {
    const final = { ...prefs, deviceId: prefs.deviceId || randomToken(24), timeZone: tz };
    if (validatePrefs(final)) return;
    if (state.prefs) dispatch({ type: 'UPDATE_PREFS', patch: final, now: Date.now() });
    else dispatch({ type: 'ONBOARD', prefs: final, now: Date.now() });
    router.push('/dashboard');
  };

  return (
    <main className="mx-auto grid min-h-dvh max-w-xl place-items-center px-4 py-8">
      <div className="glass w-full p-6 md:p-8">
        <ol className="mb-6 flex gap-1.5" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-aqua-500' : 'bg-aqua-200/60 dark:bg-white/15'}`} aria-current={i === step ? 'step' : undefined}><span className="sr-only">{s}</span></li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            {step === 0 && (
              <div className="text-center">
                <div className="flex justify-center"><Mascot percent={60} level={1} size={150} /></div>
                <h1 className="mt-2 font-display text-3xl font-bold">Hi, I&apos;m your Aqua Buddy!</h1>
                <p className="muted mt-2">Let&apos;s set things up in four quick steps. No account needed. Everything stays on your device.</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h1 className="font-display text-2xl font-bold">Your daily target</h1>
                <fieldset>
                  <legend className="label">Measurement units</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {UNIT_INFO.map((u) => (
                      <label key={u.id} className={`cursor-pointer rounded-2xl border px-3 py-2 text-center text-sm font-semibold ${prefs.unit === u.id ? 'border-aqua-500 bg-aqua-500/15' : 'border-aqua-300/50'}`}>
                        <input type="radio" name="unit" className="sr-only" checked={prefs.unit === u.id} onChange={() => { set({ unit: u.id }); setGoalText(''); }} /> {u.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="goal" className="label">Daily target ({UNIT_LABEL[prefs.unit]})</label>
                  <input id="goal" className="input" type="number" step={inputStep(prefs.unit)} value={goalShown}
                    onChange={(e) => { setGoalText(e.target.value); const n = Number(e.target.value); if (Number.isFinite(n) && n > 0) set({ goalMl: toMl(n, prefs.unit) }); }} />
                  <p className="muted mt-1">That&apos;s {formatMl(prefs.goalMl)}. The default is 2,000 mL.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[1500, 2000, 2500, 3000].map((ml) => (
                      <button key={ml} type="button" className="btn btn-ghost !px-3 !py-1.5 text-sm" onClick={() => { set({ goalMl: ml }); setGoalText(''); }}>{formatMl(ml)}</button>
                    ))}
                  </div>
                </div>
                <p className="rounded-2xl bg-aqua-100/70 p-3 text-sm dark:bg-white/5">Hydration needs vary with health, activity, climate and more. This is your personal target, not medical advice. If you have a condition or take medication that affects fluids, ask your doctor what&apos;s right for you.</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Your day</h1>
                <p className="muted">We&apos;ll only remind you between these times. Time zone: {tz}.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label htmlFor="wake" className="label">Wake-up</label><input id="wake" className="input" type="time" value={minToTimeInput(prefs.wakeMin)} onChange={(e) => set({ wakeMin: timeInputToMin(e.target.value) })} /></div>
                  <div><label htmlFor="bed" className="label">Bedtime</label><input id="bed" className="input" type="time" value={minToTimeInput(prefs.bedMin)} onChange={(e) => set({ bedMin: timeInputToMin(e.target.value) })} /></div>
                </div>
                <p className="muted">Reminders run {formatMinutes(prefs.wakeMin)} to {formatMinutes(prefs.bedMin)}. Bedtime must be later than wake-up on the same day.</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h1 className="font-display text-2xl font-bold">Reminders</h1>
                <fieldset>
                  <legend className="label">How often?</legend>
                  <div className="flex flex-wrap gap-2">
                    {INTERVALS.map((m) => (
                      <label key={m} className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold ${prefs.intervalMin === m ? 'border-aqua-500 bg-aqua-500/15' : 'border-aqua-300/50'}`}>
                        <input type="radio" name="interval" className="sr-only" checked={prefs.intervalMin === m} onChange={() => set({ intervalMin: m })} /> every {m} min
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="label">Message style</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(Object.keys(STYLE_INFO) as Style[]).map((s) => (
                      <label key={s} className={`cursor-pointer rounded-2xl border p-3 ${prefs.style === s ? 'border-aqua-500 bg-aqua-500/15' : 'border-aqua-300/50'}`}>
                        <input type="radio" name="style" className="sr-only" checked={prefs.style === s} onChange={() => set({ style: s })} />
                        <span className="block font-semibold">{STYLE_INFO[s].label}</span>
                        <span className="muted block">{STYLE_INFO[s].sample}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {step === 4 && (
              <div className="text-center">
                <div className="flex justify-center"><Mascot percent={100} level={1} size={140} /></div>
                <h1 className="font-display text-3xl font-bold">All set!</h1>
                <p className="muted mt-2">Target {formatMl(prefs.goalMl)} · {formatMinutes(prefs.wakeMin)} to {formatMinutes(prefs.bedMin)} · every {prefs.intervalMin} min · {STYLE_INFO[prefs.style].label}</p>
                <p className="muted mt-3">You can enable browser notifications later in Settings, whenever you&apos;re ready.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {stepError && <p role="alert" className="mt-4 text-sm font-medium text-rose-600 dark:text-rose-300">{stepError}</p>}

        <div className="mt-7 flex justify-between gap-3">
          <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}><ArrowLeft className="h-4 w-4" aria-hidden /> Back</button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)} disabled={!!stepError}>Next <ArrowRight className="h-4 w-4" aria-hidden /></button>
          ) : (
            <button className="btn btn-primary" onClick={finish}>Start tracking</button>
          )}
        </div>
      </div>
    </main>
  );
}
