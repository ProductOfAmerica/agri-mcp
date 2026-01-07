import { cacheLife, cacheTag } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';

export async function getConnections(userId: string) {
  'use cache';
  cacheTag(`connections-${userId}`);
  cacheLife({ revalidate: 60 });

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('farmer_connections')
    .select('*')
    .eq('developer_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return data ?? [];
}
