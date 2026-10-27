import { z } from 'zod';
import { prisma } from '@/lib/db';
import { isValidTimeZone } from '@/lib/dates';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  deviceId: z.string().min(32).max(128),
  timeZone: z.string().max(64).refine(isValidTimeZone, 'Invalid time zone'),
  wakeMin: z.number().int().min(0).max(1439),
  bedMin: z.number().int().min(1).max(1439),
  intervalMin: z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(90), z.literal(120)]),
  style: z.enum(['funny', 'cute', 'motivational', 'minimal']),
  unit: z.enum(['ml', 'l', 'floz']),
  goalMl: z.number().int().min(500).max(10000),
  remindersOn: z.boolean(),
  snoozeUntil: z.number().int().nullable(),
  todayDayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  todayTotalMl: z.number().int().min(0).max(200000),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  const d = parsed.data;
  if (d.bedMin - d.wakeMin < 240) return Response.json({ error: 'Bedtime must be 4+ hours after wake-up.' }, { status: 400 });
  if (!rateLimit(`sync:${d.deviceId}`, 60)) return Response.json({ error: 'Too many requests' }, { status: 429 });

  const user = await prisma.userPreference.upsert({
    where: { deviceId: d.deviceId },
    create: {
      deviceId: d.deviceId, timeZone: d.timeZone, wakeMinute: d.wakeMin, bedMinute: d.bedMin,
      intervalMin: d.intervalMin, style: d.style, unit: d.unit, remindersOn: d.remindersOn,
    },
    update: {
      timeZone: d.timeZone, wakeMinute: d.wakeMin, bedMinute: d.bedMin,
      intervalMin: d.intervalMin, style: d.style, unit: d.unit, remindersOn: d.remindersOn,
    },
  });

  const snooze = d.snoozeUntil ? new Date(d.snoozeUntil) : null;
  await prisma.reminderSchedule.upsert({
    where: { userId: user.id },
    create: { userId: user.id, enabled: d.remindersOn, goalMl: d.goalMl, snoozeUntil: snooze, todayDayKey: d.todayDayKey, todayTotalMl: d.todayTotalMl },
    update: { enabled: d.remindersOn, goalMl: d.goalMl, snoozeUntil: snooze, todayDayKey: d.todayDayKey, todayTotalMl: d.todayTotalMl },
  });
  await prisma.dailyGoal.upsert({
    where: { userId_dayKey: { userId: user.id, dayKey: d.todayDayKey } },
    create: { userId: user.id, dayKey: d.todayDayKey, targetMl: d.goalMl },
    update: { targetMl: d.goalMl },
  });
  return Response.json({ ok: true });
}
