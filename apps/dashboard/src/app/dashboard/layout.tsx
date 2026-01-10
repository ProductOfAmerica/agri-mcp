import { Separator } from '@fieldmcp/ui/components/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
} from '@fieldmcp/ui/components/sidebar';
import { Skeleton } from '@fieldmcp/ui/components/skeleton';
import { type ReactNode, Suspense } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

function LayoutSkeleton() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="pointer-events-none">
                <Skeleton className="size-8 rounded-lg" />
                <div className="grid flex-1 gap-1 text-left">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>
              <Skeleton className="h-3 w-16" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[1, 2, 3, 4].map((i) => (
                  <SidebarMenuSkeleton key={i} showIcon />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-4 p-3">
          <div className="flex flex-col gap-3 rounded-md border p-4 [[data-state=collapsed]_&]:hidden">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Header skeleton matching actual floating header design */}
        <header className="sticky top-0 z-50">
          <div className="mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-[calc(1280px-3rem)] items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-2 shadow-md sm:w-[calc(100%-3rem)] sm:px-6">
            <div className="flex items-center gap-1.5 sm:gap-4">
              <Skeleton className="size-7" />
              <Separator
                orientation="vertical"
                className="hidden h-4 sm:block"
              />
            </div>
            <Skeleton className="size-8 rounded-full" />
          </div>
        </header>
        <main className="mx-auto size-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-5 w-64" />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LayoutSkeleton />}>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  );
}
