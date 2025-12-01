-- Create RPC function to refresh the materialized view
-- This is called by the cron job every 5 minutes
CREATE OR REPLACE FUNCTION public.refresh_mv_daily_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_daily_rankings_current;
END;
$$;