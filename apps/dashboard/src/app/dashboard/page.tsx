import { Suspense } from 'react';
import { QuickStartCard } from '@/components/dashboard/quick-start-card';
import { RealtimeStats } from '@/components/dashboard/realtime-stats';
import { RealtimeUsageChart } from '@/components/dashboard/realtime-usage-chart';
import { StatsSkeleton, UsageChartSkeleton } from '@/components/skeletons';
import { getSubscription, getUsageCount, getUsageStats } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

async function StatsWrapper({ userId }: { userId: string }) {
  const [subscription, usageCount] = await Promise.all([
    getSubscription(userId),
    getUsageCount(userId),
  ]);

  return (
    <RealtimeStats
      serverSubscription={subscription}
      serverUsageCount={usageCount}
      userId={userId}
    />
  );
}

async function UsageChartWrapper({ userId }: { userId: string }) {
  const usageStats = await getUsageStats(userId);

  return <RealtimeUsageChart serverUsageLogs={usageStats} userId={userId} />;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your API usage.
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsWrapper userId={user!.id} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<UsageChartSkeleton />}>
          <UsageChartWrapper userId={user!.id} />
        </Suspense>
        <QuickStartCard />
      </div>
    </div>
  );
}
