import type { Env } from '../lib/types.js';

export type Provider = 'john_deere' | 'climate' | 'cnhi';

const PROVIDER_MAP: Record<Provider, string> = {
  john_deere: 'john-deere',
  climate: 'climate',
  cnhi: 'cnhi',
};

export async function getFarmerConnections(
  developerId: string,
  farmerId: string,
  env: Env,
): Promise<Provider[]> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/farmer_connections?developer_id=eq.${developerId}&farmer_identifier=eq.${farmerId}&is_active=eq.true&select=provider`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    },
  );

  if (!response.ok) {
    console.error(
      '[error] Failed to fetch farmer connections:',
      response.status,
    );
    return [];
  }

  const connections = (await response.json()) as Array<{ provider: Provider }>;
  return connections.map((c) => c.provider);
}

export async function routeToProvider(
  request: Request,
  provider: Provider,
  env: Env,
): Promise<Response> {
  const internalProvider = PROVIDER_MAP[provider];

  switch (internalProvider) {
    case 'john-deere': {
      const headers = new Headers(request.headers);
      headers.set('X-Gateway-Secret', env.GATEWAY_SECRET);
      const modifiedRequest = new Request(request, { headers });
      return env.JOHN_DEERE_MCP.fetch(modifiedRequest);
    }
    default:
      return new Response(
        JSON.stringify({
          error: {
            message: `Provider not yet supported: ${provider}`,
            code: 'NOT_IMPLEMENTED',
          },
        }),
        { status: 501, headers: { 'Content-Type': 'application/json' } },
      );
  }
}
