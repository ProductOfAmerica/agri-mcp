import type { ApiKeyValidation } from '@agrimcp/types';
import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  API_KEY_CACHE: KVNamespace;
}

async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function validateApiKey(
  apiKey: string | null,
  env: Env,
): Promise<ApiKeyValidation> {
  if (!apiKey || !apiKey.startsWith('agri_live_')) {
    return { valid: false };
  }

  const keyHash = await sha256(apiKey);
  const keyPrefix = apiKey.slice(0, 15);

  const cached = await env.API_KEY_CACHE.get(`key:${keyPrefix}`, 'json');
  if (cached) {
    return cached as ApiKeyValidation;
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  const { data: keyData, error: keyError } = await supabase
    .from('api_keys')
    .select(
      `
      id,
      developer_id,
      is_active,
      developers (
        id,
        email,
        company_name
      )
    `,
    )
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (keyError || !keyData) {
    return { valid: false };
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('developer_id', keyData.developer_id)
    .single();

  const developer = keyData.developers as unknown as {
    id: string;
    email: string;
    company_name: string | null;
  };

  const result: ApiKeyValidation = {
    valid: true,
    developer: {
      id: developer.id,
      email: developer.email,
      company_name: developer.company_name,
      created_at: '',
      updated_at: '',
    },
    subscription: subscription || undefined,
    keyId: keyData.id,
  };

  await env.API_KEY_CACHE.put(`key:${keyPrefix}`, JSON.stringify(result), {
    expirationTtl: 300,
  });

  return result;
}

export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}
