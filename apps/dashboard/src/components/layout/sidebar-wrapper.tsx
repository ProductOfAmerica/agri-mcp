import { getDeveloper, getUsageStats } from '@/lib/data';
import { AppSidebar } from './app-sidebar';

interface SidebarWrapperProps {
  userId: string;
}

export async function SidebarWrapper({ userId }: SidebarWrapperProps) {
  const [developer, usageStats] = await Promise.all([
    getDeveloper(userId),
    getUsageStats(userId),
  ]);

  const subscription = developer?.subscriptions?.[0];
  const usage = {
    used: usageStats.length,
    limit: subscription?.monthly_request_limit ?? 1000,
  };

  return <AppSidebar usage={usage} plan={subscription?.tier ?? 'Free'} />;
}
