import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { config } from '@/lib/config';

const stateDataSchema = z.object({
  developerId: z.string().uuid(),
  farmerId: z.string().min(1).max(100),
  returnUrl: z.string().startsWith('/'),
});

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;
  const stateDataStr = cookieStore.get('oauth_state_data')?.value;

  if (error) {
    let returnUrl = '/dashboard/connections';
    if (stateDataStr) {
      try {
        const parsed = stateDataSchema.safeParse(JSON.parse(stateDataStr));
        if (parsed.success) {
          returnUrl = parsed.data.returnUrl;
        }
      } catch {
        // Use default returnUrl
      }
    }
    cookieStore.delete('oauth_state');
    cookieStore.delete('oauth_state_data');
    return NextResponse.redirect(
      new URL(
        `${returnUrl}?error=${encodeURIComponent(errorDescription || error)}`,
        request.url,
      ),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(
        '/dashboard/connections?error=Missing+authorization+code',
        request.url,
      ),
    );
  }

  if (state !== storedState) {
    cookieStore.delete('oauth_state');
    cookieStore.delete('oauth_state_data');
    return NextResponse.redirect(
      new URL(
        '/dashboard/connections?error=Invalid+state+parameter',
        request.url,
      ),
    );
  }

  if (!stateDataStr) {
    return NextResponse.redirect(
      new URL('/dashboard/connections?error=Missing+state+data', request.url),
    );
  }

  let stateData: z.infer<typeof stateDataSchema>;
  try {
    const parsed = stateDataSchema.safeParse(JSON.parse(stateDataStr));
    if (!parsed.success) {
      cookieStore.delete('oauth_state');
      cookieStore.delete('oauth_state_data');
      return NextResponse.redirect(
        new URL('/dashboard/connections?error=Invalid+state+data', request.url),
      );
    }
    stateData = parsed.data;
  } catch {
    cookieStore.delete('oauth_state');
    cookieStore.delete('oauth_state_data');
    return NextResponse.redirect(
      new URL('/dashboard/connections?error=Invalid+state+data', request.url),
    );
  }

  const basicAuth = Buffer.from(
    `${config.johnDeere.clientId}:${config.johnDeere.clientSecret}`,
  ).toString('base64');

  const tokenResponse = await fetch(config.johnDeere.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.johnDeere.redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token exchange failed:', errorText);
    cookieStore.delete('oauth_state');
    cookieStore.delete('oauth_state_data');
    return NextResponse.redirect(
      new URL(
        '/dashboard/connections?error=Token+exchange+failed',
        request.url,
      ),
    );
  }

  const tokens = (await tokenResponse.json()) as TokenResponse;

  // Store tokens via Edge Function (handles encryption)
  const storeResponse = await fetch(
    `${config.gateway.url}/functions/v1/store-tokens`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': config.gateway.internalSecret,
      },
      body: JSON.stringify({
        developerId: stateData.developerId,
        farmerId: stateData.farmerId,
        provider: 'john_deere',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        scopes: tokens.scope.split(' '),
      }),
    },
  );

  cookieStore.delete('oauth_state');
  cookieStore.delete('oauth_state_data');

  if (!storeResponse.ok) {
    const errorData = await storeResponse.text();
    console.error('Failed to store tokens:', errorData);
    return NextResponse.redirect(
      new URL(
        '/dashboard/connections?error=Failed+to+store+connection',
        request.url,
      ),
    );
  }

  revalidatePath('/dashboard/connections');

  return NextResponse.redirect(
    new URL(`${stateData.returnUrl}?success=true`, request.url),
  );
}
