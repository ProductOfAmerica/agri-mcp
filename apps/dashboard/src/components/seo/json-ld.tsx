import { PRICING_PLANS } from '@/lib/pricing';
import { site } from '@/lib/seo';

interface JsonLdProps {
  baseUrl: string;
}

export function SoftwareApplicationJsonLd({ baseUrl }: JsonLdProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: site.name,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: site.description,
    url: baseUrl,
    offers: PRICING_PLANS.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      description: plan.description,
      price: plan.price.toFixed(2),
      priceCurrency: 'USD',
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: site.name,
      },
    })),
    provider: {
      '@type': 'Organization',
      name: site.name,
      url: baseUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires dangerouslySetInnerHTML per Next.js docs. XSS is mitigated by escaping < characters.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
      }}
    />
  );
}
