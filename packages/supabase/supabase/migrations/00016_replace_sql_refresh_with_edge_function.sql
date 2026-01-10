-- Replace SQL-based token refresh with Edge Function call via pg_net
-- The SQL function can't do app-level encryption, so we need to use an Edge Function

-- Enable pg_net extension for async HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop the old SQL-based refresh function
DROP FUNCTION IF EXISTS refresh_expiring_tokens();

-- Unschedule the old cron job (if it exists)
SELECT cron.unschedule('refresh-expiring-tokens');

-- Create a wrapper function that calls the Edge Function via pg_net
CREATE OR REPLACE FUNCTION call_refresh_tokens_edge_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Get Supabase URL and service role key from app settings
  -- These are set via: ALTER DATABASE postgres SET app.settings.supabase_url = '...';
  BEGIN
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_service_role_key := current_setting('app.settings.service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    v_supabase_url := NULL;
    v_service_role_key := NULL;
  END;

  -- If settings not configured, try environment-style approach
  IF v_supabase_url IS NULL OR v_service_role_key IS NULL THEN
    RAISE LOG 'Token refresh: app.settings not configured, skipping Edge Function call';
    RETURN;
  END IF;

  -- Call the Edge Function asynchronously via pg_net
  PERFORM extensions.http_post(
    url := v_supabase_url || '/functions/v1/refresh-tokens',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_service_role_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );

  RAISE LOG 'Token refresh Edge Function called successfully';
END;
$$;

-- Schedule the new cron job to call the Edge Function every 15 minutes
SELECT cron.schedule(
  'refresh-expiring-tokens',
  '*/15 * * * *',
  $$SELECT call_refresh_tokens_edge_function()$$
);

-- Add comment explaining the setup requirement
COMMENT ON FUNCTION call_refresh_tokens_edge_function() IS
'Calls the refresh-tokens Edge Function via pg_net. Requires app.settings.supabase_url and app.settings.service_role_key to be set via ALTER DATABASE.';
