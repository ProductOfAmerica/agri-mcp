import { cacheLife, cacheTag } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';

export async function getSubscription(userId: string) {
  'use cache';
  cacheTag(`subscription-${userId}`);
  cacheLife({ revalidate: 60 });

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('developer_id', userId)
    .single();

  return data;
}
