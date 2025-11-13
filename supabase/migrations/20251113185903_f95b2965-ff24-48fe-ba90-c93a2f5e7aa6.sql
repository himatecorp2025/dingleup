-- Performance Optimization: Composite indexes for frequently used queries (NO PURCHASES)

-- Optimize profiles table queries
CREATE INDEX IF NOT EXISTS idx_profiles_country_correct_answers ON public.profiles(country_code, total_correct_answers DESC) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(is_subscribed, is_subscriber) WHERE is_subscribed = true OR is_subscriber = true;
CREATE INDEX IF NOT EXISTS idx_profiles_speed_booster ON public.profiles(speed_booster_active, speed_booster_expires_at) WHERE speed_booster_active = true;

-- Optimize game_results for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_game_results_user_completed ON public.game_results(user_id, completed, created_at DESC) WHERE completed = true;
CREATE INDEX IF NOT EXISTS idx_game_results_correct_answers ON public.game_results(correct_answers DESC, average_response_time ASC) WHERE completed = true;

-- Optimize wallet_ledger for transaction history
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_created ON public.wallet_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_source ON public.wallet_ledger(source, created_at DESC);

-- Optimize lives_ledger
CREATE INDEX IF NOT EXISTS idx_lives_ledger_user_created ON public.lives_ledger(user_id, created_at DESC);

-- Optimize friendships for lookups
CREATE INDEX IF NOT EXISTS idx_friendships_status_users ON public.friendships(status, user_id_a, user_id_b) WHERE status = 'active';

-- Optimize dm_threads for chat queries
CREATE INDEX IF NOT EXISTS idx_dm_threads_last_message ON public.dm_threads(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_dm_threads_users_archived ON public.dm_threads(user_id_a, user_id_b, archived_by_user_a, archived_by_user_b);

-- Optimize dm_messages for thread queries
CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_created ON public.dm_messages(thread_id, created_at DESC);

-- Optimize invitations for referral tracking
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_accepted ON public.invitations(inviter_id, accepted, accepted_at DESC) WHERE accepted = true;

-- Optimize user_presence for online status
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON public.user_presence(is_online, last_seen DESC) WHERE is_online = true;

-- Optimize game_sessions for active session lookups
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_active ON public.game_sessions(user_id, created_at DESC) WHERE completed_at IS NULL;

-- Optimize app_session_events for analytics
CREATE INDEX IF NOT EXISTS idx_app_session_events_user_created ON public.app_session_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_session_events_type_created ON public.app_session_events(event_type, created_at DESC);