import { timingSafeEqual } from 'node:crypto';
import { runReminderWorker } from '@/services/reminderWorker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') ?? '';
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(req: Request) {
  if (!authorised(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return Response.json({ ok: true, ...(await runReminderWorker()) });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : 'Worker failed' }, { status: 500 });
  }
}

export const GET = handle; // Vercel Cron issues GET with the CRON_SECRET bearer token
export const POST = handle;
