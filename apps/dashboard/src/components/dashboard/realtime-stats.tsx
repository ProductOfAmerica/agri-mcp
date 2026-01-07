'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { ActivityIcon, CheckCircleIcon, GaugeIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatsCard } from './stats-card';

interface Subscription {
  id: string;
  developer_id: string;
  tier: string;
  monthly_request_limit: number;
}

interface RealtimeStatsProps {
  serverSubscription: Subscription | null;
  serverUsageCount: number;
  userId: string;
}

export function RealtimeStats({
  serverSubscription,
  serverUsageCount,
  userId,
}: RealtimeStatsProps) {
  const [subscription, setSubscription] = useState(serverSubscription);
  const [usageCount, setUsageCount] = useState(serverUsageCount);
  const supabase = useMemo(() => createClient(), []);
  const pendingCount = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    setSubscription(serverSubscription);
  }, [serverSubscription]);

  useEffect(() => {
    setUsageCount(serverUsageCount);
  }, [serverUsageCount]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCurrentData() {
      if (!isMounted) return;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      pendingCount.current = 0;

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('developer_id', userId)
        .single();
      if (sub && isMounted) setSubscription(sub);

      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { count } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', userId)
        .gte('request_timestamp', since.toISOString());
      if (count !== null && isMounted) {
        setUsageCount(count);
      }
    }

    function handleFocus() {
      fetchCurrentData();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        fetchCurrentData();
      }
    }

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    async function setupRealtime() {
      if (!isMounted) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await supabase.realtime.setAuth(session.access_token);
      if (!isMounted) return;

      const subscriptionChannel = supabase
        .channel(`subscription-changes-${userId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscriptions',
            filter: `developer_id=eq.${userId}`,
          },
          (payload) => {
            if (
              payload.eventType === 'UPDATE' ||
              payload.eventType === 'INSERT'
            ) {
              setSubscription(payload.new as Subscription);
            }
          },
        )
        .subscribe();

      const usageChannel = supabase
        .channel(`usage-changes-${userId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'usage_logs',
            filter: `developer_id=eq.${userId}`,
          },
          async () => {
            pendingCount.current++;
            if (debounceTimer.current) {
              clearTimeout(debounceTimer.current);
            }
            debounceTimer.current = setTimeout(async () => {
              pendingCount.current = 0;
              const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
              const { count } = await supabase
                .from('usage_logs')
                .select('*', { count: 'exact', head: true })
                .eq('developer_id', userId)
                .gte('request_timestamp', since.toISOString());
              if (count !== null) setUsageCount(count);
            }, 1000);
          },
        )
        .subscribe();

      channelsRef.current = [subscriptionChannel, usageChannel];
    }

    setupRealtime();

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      for (const channel of channelsRef.current) {
        supabase.removeChannel(channel);
      }
      channelsRef.current = [];
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [supabase, userId]);

  const tier = subscription?.tier ?? 'free';
  const limit = subscription?.monthly_request_limit ?? 1000;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatsCard
        title="Current Plan"
        value={tier.charAt(0).toUpperCase() + tier.slice(1)}
        description="Upgrade to increase limits"
        icon={GaugeIcon}
        iconClassName="bg-primary/10 text-primary"
      />
      <StatsCard
        title="Requests This Month"
        value={`${usageCount.toLocaleString()} / ${limit.toLocaleString()}`}
        description="Monthly API requests"
        icon={ActivityIcon}
        iconClassName="bg-primary/10 text-primary"
      />
      <StatsCard
        title="Status"
        value="Active"
        description="All systems operational"
        icon={CheckCircleIcon}
        iconClassName="bg-primary/10 text-primary"
      />
    </div>
  );
}
