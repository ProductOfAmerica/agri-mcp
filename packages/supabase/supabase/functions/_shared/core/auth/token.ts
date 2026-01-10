import { TOKEN_CACHE_TTL } from '../constants.ts';
import { decryptTokenCompat, encryptToken } from '../crypto/token-crypto.ts';
import { FetchError, fetchWithTimeout } from '../fetch-utils.ts';
import { cacheGet, cacheSet } from '../routing/cache.ts';
import { getSupabaseClient } from '../supabase-client.ts';

/** Timeout for OAuth token refresh requests */
const TOKEN_REFRESH_TIMEOUT_MS = 15_000;

interface TokenData {
  accessToken: string;
  expiresAt: number;
}

export async function getToken(
  developerId: string,
  farmerId: string,
): Promise<string> {
  const cacheKey = `token:${developerId}:${farmerId}:john_deere`;

  const cached = await cacheGet<TokenData>('token_cache', cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.accessToken;
  }

  const supabase = getSupabaseClient();

  const { data: connection, error } = await supabase
    .from('farmer_connections')
    .select(
      'id, access_token_encrypted, refresh_token_encrypted, token_expires_at, needs_reauth',
    )
    .eq('developer_id', developerId)
    .eq('farmer_identifier', farmerId)
    .eq('provider', 'john_deere')
    .eq('is_active', true)
    .single();

  if (error || !connection) {
    throw new Error('No active John Deere connection found');
  }

  // If connection already needs re-authentication, don't attempt refresh
  if (connection.needs_reauth) {
    throw new Error(
      'Connection requires re-authentication. Please reconnect via the dashboard.',
    );
  }

  // Decrypt tokens (handles both encrypted and legacy Base64 formats)
  const accessToken = await decryptTokenCompat(
    connection.access_token_encrypted,
  );
  const refreshToken = await decryptTokenCompat(
    connection.refresh_token_encrypted,
  );
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;

  if (expiresAt < Date.now() + 300000) {
    try {
      const refreshed = await refreshAccessToken(refreshToken);

      // Encrypt new tokens before storing
      const [encryptedAccess, encryptedRefresh] = await Promise.all([
        encryptToken(refreshed.accessToken),
        encryptToken(refreshed.refreshToken),
      ]);

      await supabase
        .from('farmer_connections')
        .update({
          access_token_encrypted: encryptedAccess,
          refresh_token_encrypted: encryptedRefresh,
          token_expires_at: new Date(refreshed.expiresAt).toISOString(),
          needs_reauth: false,
          last_refresh_error: null,
          last_refresh_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      await cacheSet(
        'token_cache',
        cacheKey,
        {
          accessToken: refreshed.accessToken,
          expiresAt: refreshed.expiresAt,
        },
        {
          expirationTtl: TOKEN_CACHE_TTL,
        },
      );

      return refreshed.accessToken;
    } catch (refreshError) {
      // Mark connection as needing re-authentication
      const errorMessage =
        refreshError instanceof Error ? refreshError.message : 'Unknown error';

      await supabase
        .from('farmer_connections')
        .update({
          needs_reauth: true,
          last_refresh_error: errorMessage,
        })
        .eq('id', connection.id);

      throw new Error(
        `Token refresh failed: ${errorMessage}. Please reconnect via the dashboard.`,
      );
    }
  }

  await cacheSet(
    'token_cache',
    cacheKey,
    { accessToken, expiresAt },
    {
      expirationTtl: Math.floor((expiresAt - Date.now()) / 1000),
    },
  );

  return accessToken;
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const clientId = Deno.env.get('JOHN_DEERE_CLIENT_ID');
  const clientSecret = Deno.env.get('JOHN_DEERE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Missing John Deere client credentials');
  }

  const tokenUrl =
    'https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/token';

  let response: Response;
  try {
    response = await fetchWithTimeout(
      tokenUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      },
      { timeoutMs: TOKEN_REFRESH_TIMEOUT_MS },
    );
  } catch (error) {
    if (error instanceof FetchError && error.isTimeout) {
      throw new Error(
        'Token refresh timed out - John Deere auth server may be slow',
      );
    }
    throw new Error(
      `Token refresh network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  if (!response.ok) {
    // Try to get more error details from response body
    let errorDetail = '';
    try {
      const errorBody = (await response.json()) as {
        error?: string;
        error_description?: string;
      };
      errorDetail = errorBody.error_description || errorBody.error || '';
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(
      `Token refresh failed: ${response.status}${errorDetail ? ` - ${errorDetail}` : ''}`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}
