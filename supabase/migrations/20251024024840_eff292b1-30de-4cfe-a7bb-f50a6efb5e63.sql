-- Fix: Remove SECURITY DEFINER from views
-- Views don't need SECURITY DEFINER if tables have proper RLS policies

DROP VIEW IF EXISTS public.performance_by_page;
DROP VIEW IF EXISTS public.error_rate_by_page;

-- Recreate views WITHOUT security definer
CREATE VIEW public.performance_by_page AS
SELECT 
  page_route,
  COUNT(*) as sample_count,
  AVG(load_time_ms)::INTEGER as avg_load_time_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY load_time_ms)::INTEGER as median_load_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY load_time_ms)::INTEGER as p95_load_time_ms,
  AVG(ttfb_ms)::INTEGER as avg_ttfb_ms,
  AVG(lcp_ms)::INTEGER as avg_lcp_ms,
  device_type,
  browser
FROM public.performance_metrics
GROUP BY page_route, device_type, browser;

CREATE VIEW public.error_rate_by_page AS
SELECT 
  page_route,
  error_type,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_id) as affected_users,
  MAX(created_at) as last_occurrence
FROM public.error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY page_route, error_type
ORDER BY error_count DESC;

-- Kommentek
COMMENT ON VIEW public.performance_by_page IS 'Aggregated performance metrics by page and device';
COMMENT ON VIEW public.error_rate_by_page IS 'Error occurrence rate by page (last 7 days)';