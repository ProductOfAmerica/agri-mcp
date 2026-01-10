import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/marketing';
import { createPageMetadata, site } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Integrations',
  description: `Explore the agricultural platforms and AI tools that integrate with ${site.name}.`,
});

export default function IntegrationsPage() {
  return (
    <PlaceholderPage
      title="Integrations"
      description="Our integrations page will showcase all supported agricultural platforms and AI tools. Currently supporting John Deere, with Climate FieldView coming soon."
    />
  );
}
