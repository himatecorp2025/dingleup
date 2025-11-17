-- Performance optimization: Additional composite indexes for frequently queried tables

-- Optimize game_sessions queries (active sessions, user sessions by category)
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_active ON public.game_sessions(user_id, completed_at) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_category ON public.game_sessions(user_id, category, created_at DESC);

-- Optimize dm_messages queries (thread messages with pagination)
CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_created ON public.dm_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender ON public.dm_messages(sender_id, created_at DESC);

-- Optimize message_reads queries (unread message tracking)
CREATE INDEX IF NOT EXISTS idx_message_reads_user_thread ON public.message_reads(user_id, thread_id);

-- Optimize friendships queries (friend lists, pending requests)
CREATE INDEX IF NOT EXISTS idx_friendships_status_updated ON public.friendships(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_friendships_user_a_status ON public.friendships(user_id_a, status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_b_status ON public.friendships(user_id_b, status);

-- Optimize user_presence queries (online users)
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON public.user_presence(is_online, last_seen DESC);

-- Optimize invitations queries (active invitations)
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(invitation_code) WHERE accepted = false;
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_accepted ON public.invitations(inviter_id, accepted);

-- Optimize global_leaderboard queries (top rankings)
CREATE INDEX IF NOT EXISTS idx_global_leaderboard_rank ON public.global_leaderboard(rank) WHERE rank IS NOT NULL;

-- Optimize analytics tables for faster aggregation queries
CREATE INDEX IF NOT EXISTS idx_app_session_events_user_created ON public.app_session_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_navigation_events_user_created ON public.navigation_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_route_created ON public.performance_metrics(page_route, created_at DESC);

-- Add partial indexes for common filtered queries
CREATE INDEX IF NOT EXISTS idx_game_results_completed ON public.game_results(user_id, completed_at DESC) WHERE completed = true;
CREATE INDEX IF NOT EXISTS idx_dm_threads_active ON public.dm_threads(user_id_a, user_id_b, last_message_at DESC) 
  WHERE archived_by_user_a = false AND archived_by_user_b = false;

-- Optimize purchases table for revenue queries
CREATE INDEX IF NOT EXISTS idx_purchases_user_date ON public.purchases(user_id, purchase_date DESC) WHERE status = 'completed';