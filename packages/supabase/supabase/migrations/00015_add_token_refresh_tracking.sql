-- Migration: Add token refresh tracking columns and background refresh job
-- Enables proactive token refresh via pg_cron + http extension (self-contained)
-- Credentials are read from Supabase Vault (one-time setup per environment)

-- Add columns to track refresh status
ALTER TABLE public.farmer_connections
ADD COLUMN IF NOT EXISTS needs_reauth BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_refresh_error TEXT,
ADD COLUMN IF NOT EXISTS last_refresh_at TIMESTAMPTZ;

-- Create index for cron job query (tokens expiring soon that need refresh)
CREATE INDEX IF NOT EXISTS idx_farmer_connections_token_refresh
ON public.farmer_connections (token_expires_at)
WHERE is_active = true AND needs_reauth = false;

-- Enable http extension for synchronous HTTP calls
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Function to refresh expiring tokens
-- Reads John Deere credentials from Vault, makes HTTP calls directly from Postgres
CREATE OR REPLACE FUNCTION refresh_expiring_tokens()
RETURNS TABLE(processed INT, failed INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_connection RECORD;
  v_client_id TEXT;
  v_client_secret TEXT;
  v_refresh_token TEXT;
  v_response RECORD;
  v_tokens JSONB;
  v_processed INT := 0;
  v_failed INT := 0;
BEGIN
  -- Get credentials from Vault
  SELECT decrypted_secret INTO v_client_id
  FROM vault.decrypted_secrets WHERE name = 'john_deere_client_id';

  SELECT decrypted_secret INTO v_client_secret
  FROM vault.decrypted_secrets WHERE name = 'john_deere_client_secret';

  IF v_client_id IS NULL OR v_client_secret IS NULL THEN
    RAISE LOG 'John Deere credentials not configured in Vault - skipping token refresh';
    RETURN QUERY SELECT 0, 0;
    RETURN;
  END IF;

  -- Find and refresh expiring connections (within 20 min buffer for 15-min cron)
  FOR v_connection IN
    SELECT id, refresh_token_encrypted
    FROM public.farmer_connections
    WHERE is_active = true
      AND needs_reauth = false
      AND token_expires_at < NOW() + INTERVAL '20 minutes'
  LOOP
    BEGIN
      -- Decode refresh token from base64
      v_refresh_token := convert_from(
        decode(v_connection.refresh_token_encrypted, 'base64'),
        'UTF8'
      );

      -- Make synchronous HTTP POST request to John Deere using http() with http_request
      -- Note: replace() removes newlines that encode() adds every 76 chars
      SELECT status, content::jsonb as body INTO v_response
      FROM extensions.http((
        'POST',
        'https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/token',
        ARRAY[extensions.http_header(
          'Authorization',
          'Basic ' || replace(encode(convert_to(v_client_id || ':' || v_client_secret, 'UTF8'), 'base64'), E'\n', '')
        )],
        'application/x-www-form-urlencoded',
        'grant_type=refresh_token&refresh_token=' || v_refresh_token
      )::extensions.http_request);

      IF v_response.status = 200 THEN
        v_tokens := v_response.body;

        -- Update connection with new tokens
        UPDATE public.farmer_connections
        SET access_token_encrypted = encode(convert_to(v_tokens->>'access_token', 'UTF8'), 'base64'),
            refresh_token_encrypted = encode(convert_to(v_tokens->>'refresh_token', 'UTF8'), 'base64'),
            token_expires_at = NOW() + ((v_tokens->>'expires_in')::int * INTERVAL '1 second'),
            needs_reauth = false,
            last_refresh_error = NULL,
            last_refresh_at = NOW()
        WHERE id = v_connection.id;

        v_processed := v_processed + 1;
        RAISE LOG 'Refreshed token for connection %', v_connection.id;
      ELSE
        -- Mark as needing reauth on non-200 response
        UPDATE public.farmer_connections
        SET needs_reauth = true,
            last_refresh_error = 'HTTP ' || v_response.status || ': ' || v_response.body::text
        WHERE id = v_connection.id;

        v_failed := v_failed + 1;
        RAISE LOG 'Failed to refresh token for connection %: HTTP %', v_connection.id, v_response.status;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Mark as needing reauth on any error
      UPDATE public.farmer_connections
      SET needs_reauth = true,
          last_refresh_error = SQLERRM
      WHERE id = v_connection.id;

      v_failed := v_failed + 1;
      RAISE LOG 'Exception refreshing token for connection %: %', v_connection.id, SQLERRM;
    END;
  END LOOP;

  RAISE LOG 'Token refresh complete: % processed, % failed', v_processed, v_failed;
  RETURN QUERY SELECT v_processed, v_failed;
END;
$$;

-- Schedule cron job every 15 minutes
SELECT cron.schedule(
  'refresh-expiring-tokens',
  '*/15 * * * *',
  $$SELECT * FROM refresh_expiring_tokens()$$
);

COMMENT ON COLUMN public.farmer_connections.needs_reauth IS 'True when refresh token is invalid and user must re-authenticate manually';
COMMENT ON COLUMN public.farmer_connections.last_refresh_error IS 'Error message from last failed refresh attempt';
COMMENT ON COLUMN public.farmer_connections.last_refresh_at IS 'Timestamp of last successful token refresh';
