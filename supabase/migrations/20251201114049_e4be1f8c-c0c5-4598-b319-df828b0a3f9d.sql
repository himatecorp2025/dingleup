-- ============================================
-- ADMIN PERFORMANCE OPTIMIZATION - Phase 1
-- Materialized Views + Composite Indexes
-- ============================================

-- MATERIALIZED VIEW: Daily Engagement Metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_daily_engagement_metrics AS
SELECT 
  DATE(created_at) as metric_date,
  COUNT(DISTINCT CASE WHEN event_type = 'app_opened' THEN session_id END) as total_sessions,
  COUNT(DISTINCT user_id) as active_users,
  AVG(CASE WHEN event_type = 'app_closed' AND session_duration_seconds IS NOT NULL 
      THEN session_duration_seconds END) as avg_session_duration_seconds
FROM public.app_session_events
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_engagement_date 
  ON public.mv_daily_engagement_metrics (metric_date);

-- MATERIALIZED VIEW: Hourly Engagement Patterns
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_hourly_engagement AS
SELECT 
  DATE(created_at) as metric_date,
  EXTRACT(HOUR FROM created_at)::int as hour,
  COUNT(*) as event_count
FROM public.app_session_events
WHERE event_type = 'app_opened'
  AND created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at), EXTRACT(HOUR FROM created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_hourly_engagement_unique 
  ON public.mv_hourly_engagement (metric_date, hour);

-- MATERIALIZED VIEW: Feature Usage Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_feature_usage_summary AS
SELECT 
  DATE(created_at) as metric_date,
  feature_name,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.feature_usage_events
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at), feature_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_feature_usage_unique 
  ON public.mv_feature_usage_summary (metric_date, feature_name);

-- COMPOSITE INDEXES on large tables for admin queries
CREATE INDEX IF NOT EXISTS idx_app_session_events_user_created 
  ON public.app_session_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_session_events_event_created 
  ON public.app_session_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_results_user_completed_created 
  ON public.game_results (user_id, completed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booster_purchases_user_created 
  ON public.booster_purchases (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booster_purchases_type_created 
  ON public.booster_purchases (booster_type_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_page_created 
  ON public.performance_metrics (page_route, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_type_created 
  ON public.error_logs (error_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_created 
  ON public.feature_usage_events (feature_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_topic_stats_user 
  ON public.user_topic_stats (user_id, topic_id);

-- FUNCTION: Refresh admin materialized views (called hourly)
CREATE OR REPLACE FUNCTION public.refresh_admin_materialized_views()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_duration_ms INTEGER;
BEGIN
  v_start_time := clock_timestamp();
  
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_daily_engagement_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_hourly_engagement;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_feature_usage_summary;
  
  v_end_time := clock_timestamp();
  v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
  
  RETURN jsonb_build_object(
    'success', true,
    'refreshed_at', v_end_time,
    'duration_ms', v_duration_ms,
    'views_refreshed', 3
  );
END;
$$;

-- Initial population
SELECT public.refresh_admin_materialized_views();