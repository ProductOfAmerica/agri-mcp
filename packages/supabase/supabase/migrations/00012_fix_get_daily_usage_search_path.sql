-- Fix security issue: Function search_path mutable for get_daily_usage
-- Set search_path to empty string and qualify all table references

CREATE OR REPLACE FUNCTION public.get_daily_usage(p_developer_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE(date TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(request_timestamp::DATE, 'YYYY-MM-DD') as date,
    COUNT(*)::BIGINT as count
  FROM public.usage_logs
  WHERE developer_id = p_developer_id
    AND request_timestamp >= (CURRENT_DATE - p_days * INTERVAL '1 day')
  GROUP BY request_timestamp::DATE
  ORDER BY request_timestamp::DATE;
END;
$$;