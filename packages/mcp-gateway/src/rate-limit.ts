import type { RateLimitResult, SubscriptionTier } from '@agrimcp/types';
import { TIER_LIMITS } from '@agrimcp/types';

interface Env {
  RATE_LIMITS: KVNamespace;
}

function getCurrentMinuteKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
}

export async function checkRateLimit(
  developerId: string,
  tier: SubscriptionTier,
  env: Env,
): Promise<RateLimitResult> {
  const limits = TIER_LIMITS[tier];
  const minuteKey = getCurrentMinuteKey();
  const kvKey = `ratelimit:${developerId}:${minuteKey}`;

  const current = (await env.RATE_LIMITS.get(kvKey, 'json')) as number | null;
  const count = current ?? 0;

  if (count >= limits.perMinute) {
    const now = new Date();
    const resetAt = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes() + 1,
      0,
    ).getTime();

    return { allowed: false, remaining: 0, resetAt };
  }

  await env.RATE_LIMITS.put(kvKey, JSON.stringify(count + 1), {
    expirationTtl: 120,
  });

  return { allowed: true, remaining: limits.perMinute - count - 1, resetAt: 0 };
}
