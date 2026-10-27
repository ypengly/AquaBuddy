import { prisma } from '../lib/db';
import { dayKey } from '../lib/dates';
import { messageForSlot } from '../lib/messages';
import { shouldNotify } from '../lib/reminders';
import { configureWebPush, webpush } from '../lib/webpush';
import type { Style } from '../types';

export interface WorkerResult {
  sent: number;
  skipped: number;
  removed: number;
  failed: number;
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002';
}

/**
 * Idempotent reminder worker. Safe to run every minute from cron, a loop, or several
 * overlapping instances: a unique (subscription, slot) row is written before each send,
 * so a slot is delivered at most once per subscription.
 */
export async function runReminderWorker(now = Date.now()): Promise<WorkerResult> {
  const result: WorkerResult = { sent: 0, skipped: 0, removed: 0, failed: 0 };
  if (!configureWebPush()) throw new Error('VAPID keys are not configured (see .env.example).');

  const schedules = await prisma.reminderSchedule.findMany({
    where: { enabled: true, user: { subscriptions: { some: {} } } },
    include: { user: { include: { subscriptions: true } } },
  });

  for (const sc of schedules) {
    const u = sc.user;
    const s = { wakeMin: u.wakeMinute, bedMin: u.bedMinute, intervalMin: u.intervalMin, timeZone: u.timeZone };
    const today = dayKey(now, s.timeZone);
    const total = sc.todayDayKey === today ? sc.todayTotalMl : 0; // a new local day starts from zero
    const decision = shouldNotify({
      now,
      s,
      enabled: true,
      paused: false,
      snoozeUntil: sc.snoozeUntil ? sc.snoozeUntil.getTime() : null,
      lastSlot: sc.lastSlotKey,
      goalReached: sc.goalMl > 0 && total >= sc.goalMl,
    });
    if (!decision) {
      result.skipped++;
      continue;
    }

    const msg = messageForSlot(u.style as Style, decision.slotKey);
    const payload = JSON.stringify({ title: 'AquaBuddy 💧', body: msg.text, url: '/dashboard', tag: decision.slotKey });
    let delivered = false;
    let failedHere = 0;

    for (const sub of u.subscriptions) {
      let logId: string;
      try {
        logId = (await prisma.reminderLog.create({ data: { subscriptionId: sub.id, slotKey: decision.slotKey } })).id;
      } catch (e) {
        if (isUniqueViolation(e)) {
          result.skipped++;
          continue;
        }
        throw e;
      }
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: 600 });
        await prisma.notificationSubscription.update({ where: { id: sub.id }, data: { lastSuccessAt: new Date(), failureCount: 0 } });
        result.sent++;
        delivered = true;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await prisma.notificationSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
          result.removed++;
        } else {
          // Transient failure: release the slot so the next run (still inside the grace window) can retry.
          await prisma.reminderLog.delete({ where: { id: logId } }).catch(() => undefined);
          await prisma.notificationSubscription.update({ where: { id: sub.id }, data: { failureCount: { increment: 1 } } }).catch(() => undefined);
          result.failed++;
          failedHere++;
        }
      }
    }

    if (delivered || failedHere === 0) {
      await prisma.reminderSchedule.update({
        where: { id: sc.id },
        data: { lastSlotKey: decision.slotKey, ...(decision.kind === 'snooze' ? { snoozeUntil: null } : {}) },
      });
    }
  }
  return result;
}
