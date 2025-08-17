type Bucket = { count: number; resetAt: number };

const buckets: Map<string, Bucket> = new Map();

function getClientKey(req: Request): string {
  const xfwd = req.headers.get('x-forwarded-for') || '';
  const ip = xfwd.split(',')[0].trim() || req.headers.get('x-real-ip') || 'anon';
  return ip as string;
}

export function shouldRateLimit(req: Request, prefix: string, limit: number, windowMs: number): { limited: boolean; remaining: number; resetAt: number } {
  const client = getClientKey(req);
  const key = `${prefix}:${client}`;
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { limited: false, remaining: Math.max(0, limit - 1), resetAt };
  }
  if (existing.count >= limit) {
    return { limited: true, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  buckets.set(key, existing);
  return { limited: false, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

export function resetRateLimits() {
  buckets.clear();
}


