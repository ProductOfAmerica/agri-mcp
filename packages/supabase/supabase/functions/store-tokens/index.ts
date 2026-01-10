import { CORS_HEADERS } from '../_shared/core/constants.ts';
import { encryptToken } from '../_shared/core/crypto/token-crypto.ts';
import { cacheDelete } from '../_shared/core/routing/cache.ts';
import { getSupabaseClient } from '../_shared/core/supabase-client.ts';

const INTERNAL_SECRET = Deno.env.get('INTERNAL_SECRET');

interface StoreTokensRequest {
  developerId: string;
  farmerId: string;
  provider: 'john_deere' | 'climate_fieldview' | 'cnhi';
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scopes: string[];
  providerUserId?: string;
  organizations?: unknown;
}

function jsonResponse(
  data: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

function validateRequest(body: unknown): StoreTokensRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const req = body as Record<string, unknown>;

  if (typeof req.developerId !== 'string' || !req.developerId) {
    throw new Error('Missing or invalid developerId');
  }
  if (typeof req.farmerId !== 'string' || !req.farmerId) {
    throw new Error('Missing or invalid farmerId');
  }
  if (
    !['john_deere', 'climate_fieldview', 'cnhi'].includes(
      req.provider as string,
    )
  ) {
    throw new Error('Invalid provider');
  }
  if (typeof req.accessToken !== 'string' || !req.accessToken) {
    throw new Error('Missing or invalid accessToken');
  }
  if (typeof req.refreshToken !== 'string' || !req.refreshToken) {
    throw new Error('Missing or invalid refreshToken');
  }
  if (typeof req.expiresIn !== 'number' || req.expiresIn <= 0) {
    throw new Error('Missing or invalid expiresIn');
  }
  if (!Array.isArray(req.scopes)) {
    throw new Error('Missing or invalid scopes');
  }

  return {
    developerId: req.developerId,
    farmerId: req.farmerId,
    provider: req.provider as 'john_deere' | 'climate_fieldview' | 'cnhi',
    accessToken: req.accessToken,
    refreshToken: req.refreshToken,
    expiresIn: req.expiresIn,
    scopes: req.scopes as string[],
    providerUserId:
      typeof req.providerUserId === 'string' ? req.providerUserId : undefined,
    organizations: req.organizations,
  };
}

async function handleStoreTokens(request: Request): Promise<Response> {
  // Validate internal secret
  const secret = request.headers.get('X-Internal-Secret');
  if (!INTERNAL_SECRET || secret !== INTERNAL_SECRET) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  // Validate request
  let req: StoreTokensRequest;
  try {
    req = validateRequest(body);
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Validation failed' },
      400,
    );
  }

  try {
    // Encrypt tokens
    const [accessTokenEncrypted, refreshTokenEncrypted] = await Promise.all([
      encryptToken(req.accessToken),
      encryptToken(req.refreshToken),
    ]);

    // Calculate expiration time
    const tokenExpiresAt = new Date(
      Date.now() + req.expiresIn * 1000,
    ).toISOString();

    // Upsert to farmer_connections
    const supabase = getSupabaseClient();

    const { error: upsertError } = await supabase
      .from('farmer_connections')
      .upsert(
        {
          developer_id: req.developerId,
          farmer_identifier: req.farmerId,
          provider: req.provider,
          provider_user_id: req.providerUserId ?? null,
          access_token_encrypted: accessTokenEncrypted,
          refresh_token_encrypted: refreshTokenEncrypted,
          token_expires_at: tokenExpiresAt,
          scopes: req.scopes,
          organizations: req.organizations ?? null,
          is_active: true,
          needs_reauth: false,
          last_refresh_error: null,
          last_refresh_at: new Date().toISOString(),
        },
        {
          onConflict: 'developer_id,farmer_identifier,provider',
        },
      );

    if (upsertError) {
      console.error('Failed to upsert farmer connection:', upsertError);
      return jsonResponse({ error: 'Failed to store connection' }, 500);
    }

    // Invalidate token cache for this connection
    const cacheKey = `token:${req.developerId}:${req.farmerId}:${req.provider}`;
    await cacheDelete('token_cache', cacheKey);

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error('Error storing tokens:', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Internal error' },
      500,
    );
  }
}

Deno.serve(async (request: Request): Promise<Response> => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // Only accept POST
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  return handleStoreTokens(request);
});
