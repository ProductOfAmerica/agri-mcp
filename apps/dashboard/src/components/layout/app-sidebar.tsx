'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@fieldmcp/ui/components/sidebar';
import { CreditCardIcon, GaugeIcon, KeyIcon, LinkIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import icon from '@/app/icon.svg';
import { RealtimeSidebarUsage } from './realtime-sidebar-usage';

const navItems = [
  {
    icon: GaugeIcon,
    label: 'Overview',
    href: '/dashboard',
  },
  {
    icon: KeyIcon,
    label: 'API Keys',
    href: '/dashboard/keys',
  },
  {
    icon: LinkIcon,
    label: 'Connections',
    href: '/dashboard/connections',
  },
  {
    icon: CreditCardIcon,
    label: 'Billing',
    href: '/dashboard/billing',
  },
];

interface AppSidebarProps {
  usage: {
    used: number;
    limit: number;
  };
  plan: string;
  userId: string;
}

export function AppSidebar({ usage, plan, userId }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <Image src={icon} alt="FieldMCP" className="size-8" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">FieldMCP</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Developer Platform
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-4 p-3 transition-[padding] duration-200 [[data-state=collapsed]_&]:p-2">
        <RealtimeSidebarUsage
          serverUsageCount={usage.used}
          serverLimit={usage.limit}
          serverPlan={plan}
          userId={userId}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
