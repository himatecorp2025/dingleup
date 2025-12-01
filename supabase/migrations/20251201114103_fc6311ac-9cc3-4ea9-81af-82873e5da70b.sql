-- ============================================
-- SECURITY FIX: Materialized Views Access Control
-- Revoke public API access to materialized views
-- (Admin edge functions use service role to access)
-- ============================================

-- Revoke all public access to materialized views
REVOKE ALL ON public.mv_daily_engagement_metrics FROM anon, authenticated;
REVOKE ALL ON public.mv_hourly_engagement FROM anon, authenticated;
REVOKE ALL ON public.mv_feature_usage_summary FROM anon, authenticated;

-- Grant SELECT only to service_role (used by admin edge functions)
GRANT SELECT ON public.mv_daily_engagement_metrics TO service_role;
GRANT SELECT ON public.mv_hourly_engagement TO service_role;
GRANT SELECT ON public.mv_feature_usage_summary TO service_role;

COMMENT ON MATERIALIZED VIEW public.mv_daily_engagement_metrics IS 
  'Admin-only view: Accessible via service role in edge functions only';
COMMENT ON MATERIALIZED VIEW public.mv_hourly_engagement IS 
  'Admin-only view: Accessible via service role in edge functions only';
COMMENT ON MATERIALIZED VIEW public.mv_feature_usage_summary IS 
  'Admin-only view: Accessible via service role in edge functions only';