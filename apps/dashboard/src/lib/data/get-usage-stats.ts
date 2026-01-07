import { createServiceClient } from '@/lib/supabase/service';

export async function getUsageStats(userId: string) {
  const supabase = createServiceClient();
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );

  const { data } = await supabase
    .from('usage_logs')
    .select('id, request_timestamp')
    .eq('developer_id', userId)
    .gte('request_timestamp', monthStart.toISOString());

  return data ?? [];
}
