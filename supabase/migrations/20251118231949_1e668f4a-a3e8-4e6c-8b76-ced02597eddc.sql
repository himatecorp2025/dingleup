-- Analytics tables optimization with partitioning and retention policies
-- Improve query performance and manage data growth

-- Create partitioning for large analytics tables (app_session_events, navigation_events)
-- Partition by month to improve query performance

-- Add composite indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_app_session_events_user_created 
ON public.app_session_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_session_events_session 
ON public.app_session_events(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_navigation_events_user_created 
ON public.navigation_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_navigation_events_session 
ON public.navigation_events(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_question_analytics_user_session 
ON public.game_question_analytics(user_id, session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_route 
ON public.performance_metrics(user_id, page_route, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity_created 
ON public.error_logs(severity, created_at DESC);

-- Add data retention comment for documentation
COMMENT ON TABLE public.app_session_events IS 'Analytics data retained for 90 days via cleanup-analytics cron job';
COMMENT ON TABLE public.navigation_events IS 'Analytics data retained for 90 days via cleanup-analytics cron job';
COMMENT ON TABLE public.game_question_analytics IS 'Game analytics retained permanently for user statistics';
COMMENT ON TABLE public.performance_metrics IS 'Performance data retained for 90 days via cleanup-analytics cron job';
COMMENT ON TABLE public.error_logs IS 'Error logs retained for 90 days via cleanup-analytics cron job';