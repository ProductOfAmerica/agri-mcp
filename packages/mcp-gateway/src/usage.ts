import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface UsageParams {
  developerId: string;
  apiKeyId: string;
  farmerConnectionId?: string;
  provider: string;
  toolName: string;
  responseTimeMs: number;
  statusCode: number;
  errorType?: string;
}

export async function logUsage(params: UsageParams, env: Env): Promise<void> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  const { error } = await supabase.from('usage_logs').insert({
    developer_id: params.developerId,
    api_key_id: params.apiKeyId,
    farmer_connection_id: params.farmerConnectionId,
    provider: params.provider,
    tool_name: params.toolName,
    response_time_ms: params.responseTimeMs,
    status_code: params.statusCode,
    error_type: params.errorType,
  });

  if (error) {
    console.error('Failed to log usage:', error);
  }
}
