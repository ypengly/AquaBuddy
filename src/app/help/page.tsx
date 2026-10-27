'use client';

import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { Card, PageHeader } from '../../components/ui/Section';

export default function HelpPage() {
  return (
    <AppShell>
      <PageHeader title="Help & FAQ" subtitle="Quick answers about tracking, reminders and your data." />
      <div className="space-y-5">
        <Card title="A note on hydration">
          <p>
            AquaBuddy is a habit helper, not a medical device. How much water is right for you depends on your health, medications, activity, climate and more, so the target is yours to set. Sip steadily through the day rather than drinking a lot at once. If you have a medical condition or have been told to limit fluids, follow your doctor&apos;s advice.
          </p>
        </Card>

        <Card title="Frequently asked questions">
          <div className="divide-y divide-aqua-200/40">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-3">
                <summary className="cursor-pointer list-none font-semibold marker:content-none">
                  <span className="mr-2 inline-block transition group-open:rotate-90" aria-hidden>›</span>{f.q}
                </summary>
                <p className="muted mt-2 pl-5">{f.a}</p>
              </details>
            ))}
          </div>
        </Card>

        <Card title="Why don't reminders arrive when the site is closed?">
          <p className="muted">
            A web page can only run timers while it is open. For reminders that arrive when AquaBuddy is closed, a server has to send a Web Push message to your device at the right time. AquaBuddy includes that setup (VAPID keys, push subscriptions and an idempotent worker that runs every minute), but you or your host must run it. Turn it on under <Link className="underline" href="/settings">Settings → Notifications</Link>.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

const FAQ = [
  { q: 'Do I need an account?', a: 'No. Your drinks and settings are saved in this browser on this device. Clearing site data removes them, so export a CSV from Settings if you want a backup.' },
  { q: 'How is my daily target decided?', a: 'You choose it. The default of 2,000 mL is just a starting point. You can change it any time; past days keep the target they had.' },
  { q: 'Can I go over 100%?', a: 'Yes, and it’s tracked exactly. The bottle stays full and the dashboard shows how far over you are. There’s no bonus for going over, because more isn’t better.' },
  { q: 'When does my day reset?', a: 'At midnight in your own time zone, including on daylight-saving days. Reminders stop when you reach your target and start again the next morning.' },
  { q: 'How do streaks work?', a: 'A day counts when you reach the target you had set for that day. Your streak stays alive until the end of today, so you still have time to keep it going.' },
  { q: 'I logged the wrong amount.', a: 'Tap Undo right after logging, or use the pencil on any entry (Today or History) to change the amount or time, or the bin to delete it.' },
  { q: 'Why did I get a warning about a large amount?', a: 'Entries of 1,000 mL or more ask for a quick confirmation to catch typos. Drinking large amounts very quickly isn’t recommended.' },
  { q: 'Can I install AquaBuddy on my phone?', a: 'Yes. Use “Add to Home Screen” (iOS Safari) or “Install app” (Chrome, Edge, Android). On iPhone, Web Push works only for installed home-screen apps.' },
  { q: 'What are quiet hours?', a: 'Reminders only run between your wake-up time and bedtime. Outside that window AquaBuddy stays silent.' },
];
