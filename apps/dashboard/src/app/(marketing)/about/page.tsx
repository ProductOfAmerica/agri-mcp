import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/marketing';
import { createPageMetadata, site } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'About',
  description: `Learn about the team behind ${site.name} and our mission to make agricultural data accessible.`,
});

export default function AboutPage() {
  return (
    <PlaceholderPage
      title="About Us"
      description="Our about page is coming soon. Learn about our mission to connect AI with agricultural data and the team building FieldMCP."
    />
  );
}
