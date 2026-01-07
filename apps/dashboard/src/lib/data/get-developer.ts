import { createServiceClient } from '@/lib/supabase/service';

export async function getDeveloper(userId: string) {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('developers')
    .select('*, subscriptions(*)')
    .eq('id', userId)
    .single();

  return data;
}
