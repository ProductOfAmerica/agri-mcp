import type { ReactNode } from 'react';
import { MarketingFooter, MarketingNavbar } from '@/components/marketing';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
