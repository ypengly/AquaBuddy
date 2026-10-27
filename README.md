# AquaBuddy 💧

A friendly hydration tracker: an animated bottle and mascot, playful reminders, gentle gamification, history and statistics. It is local-first (no account needed), installable as a PWA, and includes the server pieces (Web Push, VAPID, an idempotent worker) needed for reminders that arrive when the site is closed.

> **Status.** The pure logic (units, time zones and DST, progress, streaks, XP, reminder scheduling, reducer, CSV) is covered by 31 unit and integration tests, which pass. The UI, API routes and Prisma layer were written carefully but **not yet run end to end**: this project was generated in an environment without network access, so `npm install`, `next build` and a browser check are your first step. Expect to fix a small type or styling issue or two on first run, and please report anything you find.

## Quick start

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run setup               # prisma generate + migrate (creates the first migration) + seed
npm run dev                 # http://localhost:3000
npm test
```

See `run.txt` for the short version, including Windows and Web Push steps.

## Features

| Area | What you get |
| --- | --- |
| Onboarding | Animated mascot, target (default 2,000 mL), wake/bed times, interval (30/45/60/90/120), style (Funny/Cute/Motivational/Minimal), units (mL, L, US fl oz). No account. |
| Dashboard | Animated glass bottle with waves and bubbles, exact mL, remaining and percent, milestones at 25/50/75/100%, mascot reactions, quick-add 100/150/250/500 mL, custom amounts, undo, edit and delete (with restore), timeline, mini-challenges, confetti at 100%, going past 100% stays accurately tracked. |
| Reminders | 100+ messages with no-repeat rotation, active window (quiet hours), snooze 10/15/30, pause/resume, stop after the goal and resume next day, in-app cards, browser notifications, Web Push. |
| Gamification | XP and levels, evolving mascot, streaks from your own targets, 10 badges, daily challenges, optional sounds, reduced motion. XP is capped so more logging or drinking earns nothing extra. |
| History and stats | Day view, calendar, full timestamped list, week/month/3-month bar charts with target line, averages, totals, streaks, CSV export. |
| Design | Aqua/pastel glass UI, dark mode, mobile bottom nav and desktop sidebar, skip link, keyboard focus, ARIA labels, loading/empty/error states. |
| PWA | Web manifest, icons, service worker (offline fallback, push handling). |

Pages: `/` landing, `/onboarding`, `/dashboard`, `/history`, `/statistics`, `/achievements`, `/settings` (reminder settings and profile/preferences), `/help`.

## Architecture

```
src/
  app/            Next.js App Router pages and API routes
  components/     layout, hydration, reminders, charts, gamification, ui
  hooks/          useAqua (store + persistence), useToday (derived day state)
  lib/            pure, tested logic (units, dates, hydration, stats, reminders, state reducer, csv, ...)
  services/       reminderWorker (server)
  data/           message pool (102 messages), achievement definitions
prisma/           schema.prisma, seed.ts (migrations are generated on first setup)
tests/            vitest unit + integration tests
```

**Local-first.** All state lives in one reducer (`lib/state.ts`) persisted to `localStorage` (key `aquabuddy:v1`) and synced across tabs. Because every mutation is a pure action, the same reducer can later feed an account-sync layer: the Prisma models (`DrinkEntry`, `DailyGoal`, `EarnedAchievement`, `StreakSummary`, …) already mirror the client data.

**Exact amounts.** Drinks are integer millilitres. Unit conversion happens only at the input/display edge (`lib/units.ts`). Totals are integer sums, percentages use integer math.

**Time zones and DST.** Each drink stores an absolute instant. The "day" is derived with `Intl.DateTimeFormat` in the user's time zone (`lib/dates.ts`), so midnight rollover and 23/25-hour DST days are handled by the platform's tz database. Each local day keeps a snapshot of the goal in effect, so changing your target never rewrites history.

**Limitation.** Bedtime must be later than wake-up on the same calendar day (at least 4 hours), so overnight schedules (for example wake 15:00, bed 02:00) are not supported yet.

## Reminders and Web Push

A browser-only timer cannot run when the page is closed. AquaBuddy therefore has two layers:

1. **In-app engine** (`ReminderEngine`): checks every 15 s while the app is open, shows a card with Log/Snooze actions, and shows a browser notification if you granted permission (requested only after you click a button).
2. **Server Web Push** (opt-in): the client syncs preferences and today's total to `/api/push/sync`, registers a push subscription at `/api/push/subscribe`, and a worker sends notifications.

Setup:

```bash
npm run vapid          # prints NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
# put them in .env, plus VAPID_SUBJECT and CRON_SECRET
npm run worker         # self-hosted loop, every 60 s
# or call GET/POST /api/cron/reminders every minute with  Authorization: Bearer $CRON_SECRET
```

How the worker stays correct (`src/services/reminderWorker.ts`):

- **Same decision function as the client** (`shouldNotify`): respects active hours (quiet hours), pause, snooze, and the goal. Goal progress is compared against *today's* local date, so reminders resume automatically on the next day.
- **Idempotent:** before each send it inserts a `ReminderLog` row with a unique `(subscriptionId, slotKey)`. Overlapping workers or retries cannot deliver the same slot twice. Transient failures release the slot so the next run can retry inside a 15-minute grace window.
- Expired subscriptions (HTTP 404/410) are deleted.
- If the app is open and focused, the service worker skips the system notification (the in-app card covers it).

**Security model.** There are no accounts. The browser generates a random 48-hex `deviceId` that acts as a bearer capability for its own data. All API bodies are validated with zod, endpoints must be `https`, unsubscribe is scoped to the owning device, the cron route requires a constant-time-compared secret, and there is a small in-memory rate limiter (swap for Redis if you run several instances). Add real authentication when you add accounts.

## Deployment

- **Needs HTTPS** for service workers and push (localhost is exempt).
- **Database.** SQLite is for local development and single-node hosting with a persistent disk (a VPS, Fly.io volume, Railway volume, Docker volume). On serverless hosts (Vercel) switch the datasource in `schema.prisma` to PostgreSQL, set `DATABASE_URL`, regenerate migrations, and run `npx prisma migrate deploy`.
- **Scheduler.** Reliable background reminders need something that runs the worker every minute: `npm run worker` as a long-running process (systemd, PM2, Docker), a platform cron hitting `/api/cron/reminders` (`vercel.json` includes an every-minute cron, which requires a plan that allows it), or any external scheduler.
- Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`, `DATABASE_URL` in the host's environment. The public key is baked in at build time.
- iOS only supports Web Push for apps added to the Home Screen.

## Testing

```bash
npm test
```

`tests/hydration.test.ts`: unit tests for unit conversion, validation, progress and over-100%, no-drift sums, local-midnight and DST day boundaries, time-zone conversion, streaks and XP caps, message pool size and no-repeat, reminder scheduling (quiet hours, snooze, pause, goal, next-day resume), CSV safety.
`tests/integration.test.ts`: logging, editing, deleting, restoring and undoing drinks through the real reducer; per-day goal snapshots; badge earning; persistence round-trip and corrupt-data handling.

## Safety notes

Targets are user-set and the app says so on onboarding, Help and the landing page. It never frames a target as a medical recommendation, warns on entries of 1,000 mL or more, rejects entries above 5,000 mL, gives no reward for exceeding the target, and keeps reminder copy supportive rather than guilt-inducing.

## Database migrations and seed

`npm run setup` runs `prisma migrate dev --name init`, which generates `prisma/migrations/*` from `schema.prisma` and applies it, then seeds the achievement definitions with `prisma/seed.ts`. Commit the generated `prisma/migrations` folder. In production use `npm run db:deploy`.

## Known gaps / next steps

- No account sync yet (schema is ready); server-side data is only what push needs.
- Overnight (cross-midnight) active windows.
- The sound files folder (`public/sounds`) is empty because sounds are synthesised with the Web Audio API.
- Playwright end-to-end tests are not included.
