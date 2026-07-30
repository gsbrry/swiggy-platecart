// TODO: swap for Upstash Redis in prod — in-memory buckets do not survive
// serverless cold starts and are per-instance, so they are only useful as a
// coarse abuse ceiling during dev / preview.

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Simple token-bucket rate limiter keyed by `${bucket}:${userId}`.
 * Returns true when the request is allowed, false when it should be rejected.
 */
export function checkRateLimit(userId: string, bucket: string, limitPerMin: number): boolean {
  const key = `${bucket}:${userId}`;
  const now = Date.now();
  const refillRatePerMs = limitPerMin / 60_000;

  const current = buckets.get(key) ?? { tokens: limitPerMin, updatedAt: now };
  const elapsed = now - current.updatedAt;
  const refilled = Math.min(limitPerMin, current.tokens + elapsed * refillRatePerMs);

  if (refilled < 1) {
    buckets.set(key, { tokens: refilled, updatedAt: now });
    return false;
  }

  buckets.set(key, { tokens: refilled - 1, updatedAt: now });
  return true;
}
