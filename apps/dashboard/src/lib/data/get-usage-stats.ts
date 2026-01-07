import { cacheLife, cacheTag } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';

export async function getUsageStats(userId: string, days = 30) {
  'use cache';
  cacheTag(`usage-${userId}`);
  cacheLife({ revalidate: 30 });

  const supabase = createServiceClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const { data } = await supabase
    .from('usage_logs')
    .select('id, request_timestamp')
    .eq('developer_id', userId)
    .gte('request_timestamp', since.toISOString());

  return data ?? [];
}
