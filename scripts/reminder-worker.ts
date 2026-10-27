/* Self-hosted worker: runs the reminder job once a minute. `npm run worker` */
import { runReminderWorker } from '../src/services/reminderWorker';

async function tick() {
  try {
    const r = await runReminderWorker();
    if (r.sent || r.removed || r.failed) console.log(new Date().toISOString(), r);
  } catch (e) {
    console.error('worker error:', e instanceof Error ? e.message : e);
  }
}

tick();
setInterval(tick, 60_000);
console.log('AquaBuddy reminder worker running (every 60s). Ctrl+C to stop.');
