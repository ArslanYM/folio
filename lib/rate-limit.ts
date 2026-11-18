export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
}

interface BucketEntry {
  count: number;
  resetAt: number;
}

const DEFAULT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function getRateLimitPerHour(): number {
  const raw = process.env.RATE_LIMIT_PER_HOUR;
  if (!raw) return 20;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
}

/**
 * In-memory per-IP rate limiter implementing `RateLimiter` so Upstash Redis
 * or another distributed store can swap in without changing callers.
 */
// TODO(auth): Switch rate-limit keying from IP address to authenticated user ID once auth is implemented.
export class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, BucketEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = getRateLimitPerHour(), windowMs = DEFAULT_WINDOW_MS) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async check(key: string, now = Date.now()): Promise<RateLimitResult> {
    // Periodic opportunistic cleanup if the map grows large
    if (this.buckets.size > 2000) {
      for (const [k, entry] of this.buckets.entries()) {
        if (entry.resetAt <= now) this.buckets.delete(k);
      }
    }

    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const resetAt = now + this.windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        limit: this.maxRequests,
        remaining: Math.max(0, this.maxRequests - 1),
        resetAt,
        retryAfterSeconds: 0,
      };
    }

    if (existing.count >= this.maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000)
      );
      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        resetAt: existing.resetAt,
        retryAfterSeconds,
      };
    }

    existing.count += 1;
    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - existing.count),
      resetAt: existing.resetAt,
      retryAfterSeconds: 0,
    };
  }
}

let sharedLimiter: InMemoryRateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!sharedLimiter) {
    sharedLimiter = new InMemoryRateLimiter(getRateLimitPerHour());
  }
  return sharedLimiter;
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}
