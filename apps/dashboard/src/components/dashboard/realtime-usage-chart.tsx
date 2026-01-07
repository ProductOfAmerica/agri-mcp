'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@agrimcp/ui/components/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@agrimcp/ui/components/chart';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@agrimcp/ui/components/empty';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { BarChart3Icon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { createClient } from '@/lib/supabase/client';

const chartConfig = {
  requests: {
    label: 'Requests',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

interface UsageLog {
  id: string;
  request_timestamp: string;
}

interface RealtimeUsageChartProps {
  serverUsageLogs: UsageLog[];
  userId: string;
}

function buildChartData(logs: UsageLog[]) {
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayRequests = logs.filter((log) => {
      const logDate = new Date(log.request_timestamp)
        .toISOString()
        .split('T')[0];
      return logDate === dateStr;
    }).length;
    chartData.push({ date: dateStr, requests: dayRequests });
  }
  return chartData;
}

export function RealtimeUsageChart({
  serverUsageLogs,
  userId,
}: RealtimeUsageChartProps) {
  const [logs, setLogs] = useState(serverUsageLogs);
  const [chartData, setChartData] = useState(() =>
    buildChartData(serverUsageLogs),
  );
  const supabase = useMemo(() => createClient(), []);
  const pendingLogs = useRef<UsageLog[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    setLogs(serverUsageLogs);
  }, [serverUsageLogs]);

  useEffect(() => {
    setChartData(buildChartData(logs));
  }, [logs]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCurrentData() {
      if (!isMounted) return;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      pendingLogs.current = [];

      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { data } = await supabase
        .from('usage_logs')
        .select('id, request_timestamp')
        .eq('developer_id', userId)
        .gte('request_timestamp', since.toISOString());
      if (data && isMounted) setLogs(data);
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

      channelRef.current = supabase
        .channel(`usage-chart-${userId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'usage_logs',
            filter: `developer_id=eq.${userId}`,
          },
          (payload) => {
            const newLog = payload.new as UsageLog;
            pendingLogs.current.push(newLog);

            if (debounceTimer.current) {
              clearTimeout(debounceTimer.current);
            }
            debounceTimer.current = setTimeout(() => {
              const newLogs = [...pendingLogs.current];
              pendingLogs.current = [];
              setLogs((prev) => [...prev, ...newLogs]);
            }, 1000);
          },
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [supabase, userId]);

  const hasData = chartData.some((d) => d.requests > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>API Usage</CardTitle>
        <CardDescription>Requests over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={chartData} margin={{ left: -20, bottom: -5 }}>
              <CartesianGrid vertical={false} strokeDasharray="4" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: string) => value.slice(5)}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="requests" fill="var(--color-requests)" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Empty className="mb-6 border-0 p-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BarChart3Icon />
                </EmptyMedia>
                <EmptyTitle>No usage data</EmptyTitle>
                <EmptyDescription>
                  Make your first API request to see usage stats here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
