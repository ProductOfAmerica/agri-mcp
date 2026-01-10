import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/marketing';
import { createPageMetadata, site } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'System Status',
  description: `Check the current operational status of ${site.name} services.`,
});

export default function StatusPage() {
  return (
    <PlaceholderPage
      title="System Status"
      badge="Under Development"
      description="Our status page will provide real-time information about service availability and any ongoing incidents. All systems are currently operational."
    />
  );
}
