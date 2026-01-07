import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export const PRICE_IDS = {
  developer: process.env.STRIPE_DEVELOPER_PRICE_ID!,
  startup: process.env.STRIPE_STARTUP_PRICE_ID!,
} as const;

export const TIER_TO_PRICE: Record<string, string> = {
  developer: PRICE_IDS.developer,
  startup: PRICE_IDS.startup,
};
