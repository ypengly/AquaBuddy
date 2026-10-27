const hits = new Map<string, { n: number; reset: number }>();

/** Small in-memory limiter (per process). Use a shared store (Redis) when running several instances. */
export function rateLimit(key: string, max = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  h.n++;
  return h.n <= max;
}
