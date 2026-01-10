import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/marketing';
import { createPageMetadata, site } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Customers',
  description: `See how companies are using ${site.name} to build AI-powered agricultural applications.`,
});

export default function CustomersPage() {
  return (
    <PlaceholderPage
      title="Customer Stories"
      description="We're working on gathering success stories from our customers. Check back soon to see how teams are using FieldMCP to transform agricultural data."
    />
  );
}
