import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';

export async function getApiKeys(userId: string) {
  noStore();
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('api_keys')
    .select('*')
    .eq('developer_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return data ?? [];
}
