import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/marketing';
import { createPageMetadata, site } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Changelog',
  description: `Stay up to date with the latest ${site.name} features, improvements, and fixes.`,
});

export default function ChangelogPage() {
  return (
    <PlaceholderPage
      title="Changelog"
      description="Our changelog will show all the latest updates, new features, and improvements to the platform. Check back soon!"
    />
  );
}
