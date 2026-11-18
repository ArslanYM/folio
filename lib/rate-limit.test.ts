import { describe, expect, it } from "vitest";
import { InMemoryRateLimiter } from "./rate-limit";

describe("lib/rate-limit", () => {
  it("enforces per-key limits and resets after the window expires", async () => {
    const limiter = new InMemoryRateLimiter(2, 60_000);
    const t0 = 1_000_000;

    const r1 = await limiter.check("1.2.3.4", t0);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);

    const r2 = await limiter.check("1.2.3.4", t0 + 1000);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(0);

    const r3 = await limiter.check("1.2.3.4", t0 + 2000);
    expect(r3.allowed).toBe(false);
    expect(r3.retryAfterSeconds).toBeGreaterThan(0);

    // Different IP is still allowed
    const other = await limiter.check("5.6.7.8", t0 + 2000);
    expect(other.allowed).toBe(true);

    // Window expiry resets quota
    const afterReset = await limiter.check("1.2.3.4", t0 + 61_000);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(1);
  });
});
