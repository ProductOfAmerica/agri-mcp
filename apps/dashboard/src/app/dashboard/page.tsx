import { ActivityIcon, CheckCircleIcon, GaugeIcon } from 'lucide-react';
import { Suspense } from 'react';
import { QuickStartCard } from '@/components/dashboard/quick-start-card';
import { StatsCard } from '@/components/dashboard/stats-card';
import { UsageChart } from '@/components/dashboard/usage-chart';
import { StatsSkeleton, UsageChartSkeleton } from '@/components/skeletons';
import { getDeveloper, getUsageStats } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

async function DashboardStats({ userId }: { userId: string }) {
  const [developer, usageStats] = await Promise.all([
    getDeveloper(userId),
    getUsageStats(userId),
  ]);

  const requestsThisMonth = usageStats.length;
  const subscription = developer?.subscriptions?.[0];
  const limit = subscription?.monthly_request_limit ?? 1000;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatsCard
        title="Current Plan"
        value={subscription?.tier ?? 'Free'}
        description="Upgrade to increase limits"
        icon={GaugeIcon}
        iconClassName="bg-primary/10 text-primary"
      />
      <StatsCard
        title="Requests This Month"
        value={`${requestsThisMonth.toLocaleString()} / ${limit.toLocaleString()}`}
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

async function DashboardUsageChart({ userId }: { userId: string }) {
  const usageStats = await getUsageStats(userId, 7);

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayRequests = usageStats.filter((log) => {
      const logDate = new Date(log.request_timestamp)
        .toISOString()
        .split('T')[0];
      return logDate === dateStr;
    }).length;
    chartData.push({ date: dateStr, requests: dayRequests });
  }

  return <UsageChart data={chartData} />;
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
        <DashboardStats userId={user!.id} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<UsageChartSkeleton />}>
          <DashboardUsageChart userId={user!.id} />
        </Suspense>
        <QuickStartCard />
      </div>
    </div>
  );
}
