import { cacheLife, cacheTag } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';

export async function getDeveloper(userId: string) {
  'use cache';
  cacheTag(`developer-${userId}`);
  cacheLife({ revalidate: 60 });

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('developers')
    .select('*, subscriptions(*)')
    .eq('id', userId)
    .single();

  return data;
}
