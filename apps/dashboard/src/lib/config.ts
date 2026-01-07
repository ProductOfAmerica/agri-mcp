export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  isProduction: process.env.NODE_ENV === 'production',

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY ?? '',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    prices: {
      developer: process.env.STRIPE_DEVELOPER_PRICE_ID!,
      startup: process.env.STRIPE_STARTUP_PRICE_ID!,
    },
  },

  johnDeere: {
    clientId: process.env.JOHN_DEERE_CLIENT_ID ?? '',
    clientSecret: process.env.JOHN_DEERE_CLIENT_SECRET ?? '',
    redirectUri: process.env.JOHN_DEERE_REDIRECT_URI ?? '',
    authUrl:
      'https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/authorize',
    tokenUrl:
      'https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/token',
  },
} as const;

export const TIER_TO_PRICE: Record<string, string> = {
  developer: config.stripe.prices.developer,
  startup: config.stripe.prices.startup,
};
