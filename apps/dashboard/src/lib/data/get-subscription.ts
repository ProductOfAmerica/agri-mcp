import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';

export async function getSubscription(userId: string) {
  noStore();
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('developer_id', userId)
    .single();

  return data;
}
