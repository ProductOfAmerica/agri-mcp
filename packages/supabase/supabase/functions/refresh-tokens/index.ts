import { CORS_HEADERS } from '../_shared/core/constants.ts';
import {
  decryptTokenCompat,
  encryptToken,
} from '../_shared/core/crypto/token-crypto.ts';
import { cacheDelete } from '../_shared/core/routing/cache.ts';
import { getSupabaseClient } from '../_shared/core/supabase-client.ts';

const JOHN_DEERE_TOKEN_URL =
  'https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/token';

// Buffer time: refresh tokens expiring in next 20 minutes
const EXPIRY_BUFFER_MINUTES = 20;

interface RefreshResult {
  processed: number;
  failed: number;
  errors: string[];
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
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

async function refreshJohnDeereToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenResponse> {
  const response = await fetch(JOHN_DEERE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
  }

  return (await response.json()) as TokenResponse;
}

async function handleRefreshTokens(): Promise<Response> {
  const clientId = Deno.env.get('JOHN_DEERE_CLIENT_ID');
  const clientSecret = Deno.env.get('JOHN_DEERE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.log('John Deere credentials not configured - skipping refresh');
    return jsonResponse(
      { processed: 0, failed: 0, message: 'No credentials configured' },
      200,
    );
  }

  const supabase = getSupabaseClient();

  // Find connections expiring in the next 20 minutes
  const expiryThreshold = new Date(
    Date.now() + EXPIRY_BUFFER_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: connections, error: queryError } = await supabase
    .from('farmer_connections')
    .select(
      'id, developer_id, farmer_identifier, provider, refresh_token_encrypted',
    )
    .eq('is_active', true)
    .eq('needs_reauth', false)
    .eq('provider', 'john_deere')
    .lt('token_expires_at', expiryThreshold);

  if (queryError) {
    console.error('Failed to query expiring connections:', queryError);
    return jsonResponse({ error: 'Database query failed' }, 500);
  }

  if (!connections || connections.length === 0) {
    return jsonResponse(
      { processed: 0, failed: 0, message: 'No tokens need refresh' },
      200,
    );
  }

  console.log(`Found ${connections.length} connections to refresh`);

  const result: RefreshResult = {
    processed: 0,
    failed: 0,
    errors: [],
  };

  for (const connection of connections) {
    try {
      // Decrypt refresh token (handles both encrypted and legacy formats)
      const refreshToken = await decryptTokenCompat(
        connection.refresh_token_encrypted,
      );

      // Call John Deere to refresh
      const tokens = await refreshJohnDeereToken(
        refreshToken,
        clientId,
        clientSecret,
      );

      // Encrypt new tokens
      const [encryptedAccess, encryptedRefresh] = await Promise.all([
        encryptToken(tokens.access_token),
        encryptToken(tokens.refresh_token),
      ]);

      // Calculate new expiry
      const tokenExpiresAt = new Date(
        Date.now() + tokens.expires_in * 1000,
      ).toISOString();

      // Update database
      const { error: updateError } = await supabase
        .from('farmer_connections')
        .update({
          access_token_encrypted: encryptedAccess,
          refresh_token_encrypted: encryptedRefresh,
          token_expires_at: tokenExpiresAt,
          needs_reauth: false,
          last_refresh_error: null,
          last_refresh_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Invalidate token cache
      const cacheKey = `token:${connection.developer_id}:${connection.farmer_identifier}:${connection.provider}`;
      await cacheDelete('token_cache', cacheKey);

      result.processed++;
      console.log(`Refreshed token for connection ${connection.id}`);
    } catch (err) {
      result.failed++;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(`${connection.id}: ${errorMessage}`);

      console.error(`Failed to refresh connection ${connection.id}:`, err);

      // Mark connection as needing re-authentication
      await supabase
        .from('farmer_connections')
        .update({
          needs_reauth: true,
          last_refresh_error: errorMessage,
        })
        .eq('id', connection.id);
    }
  }

  console.log(
    `Token refresh complete: ${result.processed} processed, ${result.failed} failed`,
  );

  return jsonResponse(result, 200);
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

  // Verify authorization (service role key)
  const authHeader = request.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing authorization' }, 401);
  }

  const token = authHeader.slice(7);
  if (token !== serviceRoleKey) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  return handleRefreshTokens();
});
