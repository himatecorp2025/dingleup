-- Fix security definer views by recreating them with SECURITY INVOKER
-- This ensures views respect RLS policies and user permissions

-- Drop and recreate error_rate_by_page with SECURITY INVOKER
DROP VIEW IF EXISTS public.error_rate_by_page;
CREATE VIEW public.error_rate_by_page
WITH (security_invoker=on)
AS
SELECT 
  page_route,
  error_type,
  count(*) AS error_count,
  count(DISTINCT user_id) AS affected_users,
  max(created_at) AS last_occurrence
FROM error_logs
WHERE created_at > (now() - '7 days'::interval)
GROUP BY page_route, error_type
ORDER BY count(*) DESC;

-- Drop and recreate performance_by_page with SECURITY INVOKER
DROP VIEW IF EXISTS public.performance_by_page;
CREATE VIEW public.performance_by_page
WITH (security_invoker=on)
AS
SELECT 
  page_route,
  count(*) AS sample_count,
  (avg(load_time_ms))::integer AS avg_load_time_ms,
  (percentile_cont(0.5) WITHIN GROUP (ORDER BY load_time_ms::double precision))::integer AS median_load_time_ms,
  (percentile_cont(0.95) WITHIN GROUP (ORDER BY load_time_ms::double precision))::integer AS p95_load_time_ms,
  (avg(ttfb_ms))::integer AS avg_ttfb_ms,
  (avg(lcp_ms))::integer AS avg_lcp_ms,
  device_type,
  browser
FROM performance_metrics
GROUP BY page_route, device_type, browser;

-- Drop and recreate public_profiles with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker=on)
AS
SELECT 
  id,
  username,
  avatar_url,
  invitation_code,
  created_at
FROM profiles;

-- Note: The extension pg_net in public schema cannot be moved as it doesn't support SET SCHEMA
-- This is a known Supabase limitation and the warning can be safely ignored