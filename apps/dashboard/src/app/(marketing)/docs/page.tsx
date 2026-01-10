import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/marketing';
import { createPageMetadata, site } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Documentation',
  description: `Learn how to integrate ${site.name} into your applications with our comprehensive documentation.`,
});

export default function DocsPage() {
  return (
    <PlaceholderPage
      title="Documentation"
      description="Our comprehensive documentation is coming soon. It will include guides, API references, and examples to help you get started quickly."
    />
  );
}
