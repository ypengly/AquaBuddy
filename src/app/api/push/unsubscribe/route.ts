import { z } from 'zod';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ deviceId: z.string().min(32).max(128), endpoint: z.string().url().max(2000) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 });
  const { deviceId, endpoint } = parsed.data;
  // Only the owning device may remove its subscription.
  await prisma.notificationSubscription.deleteMany({ where: { endpoint, user: { deviceId } } });
  return Response.json({ ok: true });
}
