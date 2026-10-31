import { localStore } from './db';

interface RateLimitResult {
  allowed: boolean;
  delayMs: number;
  remainingAttempts: number;
  retryAfterSec?: number;
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15-minute window
  const record = localStore.rateLimitRecords.get(key);

  if (!record || now > record.expiresAt) {
    // New window
    localStore.rateLimitRecords.set(key, {
      count: 1,
      expiresAt: now + windowMs,
      firstAttemptAt: now,
    });
    return { allowed: true, delayMs: 0, remainingAttempts: 5 };
  }

  // Window active
  record.count += 1;
  const count = record.count;

  if (count <= 3) {
    // Normal timing
    return { allowed: true, delayMs: 0, remainingAttempts: 6 - count };
  }

  if (count === 4) {
    // 2-second progressive delay
    return { allowed: true, delayMs: 2000, remainingAttempts: 2 };
  }

  if (count === 5) {
    // 5-second progressive delay
    return { allowed: true, delayMs: 5000, remainingAttempts: 1 };
  }

  // 6 or more attempts -> Rate limit blocked (429)
  const retryAfterSec = Math.ceil((record.expiresAt - now) / 1000);
  return {
    allowed: false,
    delayMs: 0,
    remainingAttempts: 0,
    retryAfterSec: Math.max(retryAfterSec, 1),
  };
}

export function resetRateLimit(key: string) {
  localStore.rateLimitRecords.delete(key);
}
