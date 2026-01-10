import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/marketing';
import { createPageMetadata, site } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Security',
  description: `Learn about ${site.name}'s security practices, compliance certifications, and how we protect your data.`,
});

export default function SecurityPage() {
  return (
    <PlaceholderPage
      title="Security"
      description="Our detailed security documentation is being prepared. It will cover our security practices, SOC 2 compliance, data encryption, and more."
    />
  );
}
