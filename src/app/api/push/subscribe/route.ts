import { z } from 'zod';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  deviceId: z.string().min(32).max(128),
  userAgent: z.string().max(300).optional(),
  subscription: z.object({
    endpoint: z.string().url().max(2000).refine((u) => u.startsWith('https://'), 'Endpoint must be https'),
    keys: z.object({ p256dh: z.string().min(10).max(300), auth: z.string().min(10).max(100) }),
  }),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 });
  const { deviceId, subscription, userAgent } = parsed.data;
  if (!rateLimit(`sub:${deviceId}`, 20)) return Response.json({ error: 'Too many requests' }, { status: 429 });

  const user = await prisma.userPreference.findUnique({ where: { deviceId } });
  if (!user) return Response.json({ error: 'Sync preferences first.' }, { status: 409 });

  await prisma.notificationSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: { userId: user.id, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, userAgent },
    update: { userId: user.id, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, userAgent, failureCount: 0 },
  });
  return Response.json({ ok: true });
}
