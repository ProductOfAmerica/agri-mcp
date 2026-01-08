import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../lib/middleware.js';
import type { Env } from '../lib/types.js';

export function getMinuteKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}`;
}

export async function handleCacheInvalidation(
  request: Request,
  env: Env,
): Promise<Response> {
  console.log('[cache] invalidation request');

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const secret = request.headers.get('X-Internal-Secret');
  if (secret !== env.INTERNAL_SECRET) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  let body: { developerId?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { developerId } = body;
  if (!developerId) {
    return jsonResponse({ error: 'Missing developerId' }, 400);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('key_prefix')
    .eq('developer_id', developerId);

  const deletions: Promise<void>[] = [];

  if (apiKeys && apiKeys.length > 0) {
    for (const key of apiKeys) {
      deletions.push(env.API_KEY_CACHE.delete(`key:${key.key_prefix}`));
    }
  }

  const now = new Date();
  const prevMinute = new Date(now.getTime() - 60000);
  const currentKey = getMinuteKey(now);
  const prevKey = getMinuteKey(prevMinute);

  deletions.push(
    env.RATE_LIMITS.delete(`ratelimit:${developerId}:${currentKey}`),
  );
  deletions.push(env.RATE_LIMITS.delete(`ratelimit:${developerId}:${prevKey}`));

  console.log(`[cache] clearing: developer=${developerId}`);

  await Promise.all(deletions);

  console.log(`[cache] cleared: ${apiKeys?.length ?? 0} api keys`);

  return jsonResponse({
    invalidated: apiKeys?.length ?? 0,
    rateLimitCleared: true,
  });
}
