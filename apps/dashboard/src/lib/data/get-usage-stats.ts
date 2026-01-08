import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';

function getMonthStart() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
}

export async function getUsageCount(userId: string) {
  noStore();
  const supabase = createServiceClient();

  const { count } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('developer_id', userId)
    .gte('request_timestamp', getMonthStart().toISOString());

  return count ?? 0;
}

export interface DailyUsage {
  date: string;
  count: number;
}

export async function getUsageStats(userId: string): Promise<DailyUsage[]> {
  noStore();
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('get_daily_usage', {
    p_developer_id: userId,
    p_days: 7,
  });

  if (error) {
    console.error('[error] getUsageStats rpc:', error.message);
    return [];
  }

  return (data as DailyUsage[]) ?? [];
}
