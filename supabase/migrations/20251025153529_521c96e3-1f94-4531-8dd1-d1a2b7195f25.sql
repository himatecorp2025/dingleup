-- ============================================
-- PERFORMANCE OPTIMIZATION: Realtime & Indexes
-- ============================================

-- Enable realtime for critical tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.purchases REPLICA IDENTITY FULL;
ALTER TABLE public.invitations REPLICA IDENTITY FULL;
ALTER TABLE public.reports REPLICA IDENTITY FULL;
ALTER TABLE public.dm_messages REPLICA IDENTITY FULL;
ALTER TABLE public.game_results REPLICA IDENTITY FULL;
ALTER TABLE public.weekly_rankings REPLICA IDENTITY FULL;
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;

-- Add missing composite indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_subscriber ON public.profiles(email, is_subscriber);
CREATE INDEX IF NOT EXISTS idx_game_results_user_created ON public.game_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_accepted ON public.invitations(inviter_id, accepted, accepted_at DESC);

-- Optimize wallet ledger queries
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_created ON public.wallet_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_idempotency ON public.wallet_ledger(idempotency_key);

-- Optimize lives ledger queries
CREATE INDEX IF NOT EXISTS idx_lives_ledger_user_created ON public.lives_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lives_ledger_correlation ON public.lives_ledger(correlation_id);

-- Speed up admin queries
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role, user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status, created_at DESC);

-- Optimize chat performance
CREATE INDEX IF NOT EXISTS idx_dm_threads_last_message ON public.dm_threads(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_message_reads_thread_user ON public.message_reads(thread_id, user_id, last_read_at DESC);

-- Improve presence tracking
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON public.user_presence(is_online, last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_user_presence_user_online ON public.user_presence(user_id, is_online);

-- Optimize game session queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_expires ON public.game_sessions(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_help_usage_user_created ON public.game_help_usage(user_id, created_at DESC);

-- Create materialized view for fast admin stats (refreshed every 5 minutes)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.admin_stats_summary AS
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE is_subscriber = true) as genius_count,
  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
  (SELECT COUNT(*) FROM purchases WHERE status = 'completed') as total_purchases,
  (SELECT COALESCE(SUM(amount_usd), 0) FROM purchases WHERE status = 'completed') as total_revenue,
  (SELECT COUNT(*) FROM reports WHERE status IN ('pending', 'reviewing')) as pending_reports,
  (SELECT COUNT(*) FROM invitations WHERE accepted = true) as total_accepted_invitations,
  NOW() as last_refreshed
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_stats_summary_refresh ON public.admin_stats_summary(last_refreshed);

-- Function to refresh admin stats (called by cron every 5 minutes)
CREATE OR REPLACE FUNCTION public.refresh_admin_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_stats_summary;
END;
$$;

-- Grant access
GRANT SELECT ON public.admin_stats_summary TO authenticated;

-- Optimize vacuum and analyze for better performance
ANALYZE public.profiles;
ANALYZE public.purchases;
ANALYZE public.game_results;
ANALYZE public.dm_messages;
ANALYZE public.invitations;