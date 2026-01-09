import type { SubscriptionTier } from '@fieldmcp/types';

export interface PricingPlan {
  name: string;
  tier: Exclude<SubscriptionTier, 'free' | 'enterprise'>;
  price: number;
  priceDisplay: string;
  description: string;
  features: string[];
  popular: boolean;
  monthlyRequests: number;
  requestsPerMinute: number;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Developer',
    tier: 'developer',
    price: 99,
    priceDisplay: '$99',
    monthlyRequests: 50000,
    requestsPerMinute: 100,
    description: 'For individual developers and small projects',
    features: [
      '50,000 requests/month',
      '100 requests/minute',
      'Production API access',
      'Email support',
    ],
    popular: false,
  },
  {
    name: 'Startup',
    tier: 'startup',
    price: 299,
    priceDisplay: '$299',
    monthlyRequests: 250000,
    requestsPerMinute: 500,
    description: 'For growing teams and applications',
    features: [
      '250,000 requests/month',
      '500 requests/minute',
      'Production API access',
      'Priority support',
    ],
    popular: true,
  },
];

export function getPlanByTier(tier: string): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.tier === tier);
}
