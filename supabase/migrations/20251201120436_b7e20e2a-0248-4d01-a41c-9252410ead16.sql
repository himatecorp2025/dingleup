-- PHASE 1 OPTIMIZATION: Composite indexes for hot paths
-- These indexes dramatically speed up the most frequent queries

-- Index for daily rankings queries (day + category + performance ordering)
CREATE INDEX IF NOT EXISTS idx_daily_rankings_day_category_score
ON public.daily_rankings (day_date DESC, category, total_correct_answers DESC, average_response_time ASC);

-- Index for user game history queries (user + completion status + date ordering)
CREATE INDEX IF NOT EXISTS idx_game_results_user_completed_date
ON public.game_results (user_id, completed, completed_at DESC)
WHERE completed = true;

-- Index for wallet ledger user queries (user + time ordering for transaction history)
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_created
ON public.wallet_ledger (user_id, created_at DESC);

-- Index for lives ledger user queries
CREATE INDEX IF NOT EXISTS idx_lives_ledger_user_created
ON public.lives_ledger (user_id, created_at DESC);

-- Index for game sessions cleanup (finding expired sessions)
CREATE INDEX IF NOT EXISTS idx_game_sessions_expires_completed
ON public.game_sessions (expires_at, completed_at)
WHERE completed_at IS NULL;

-- Index for question analytics aggregations
CREATE INDEX IF NOT EXISTS idx_game_question_analytics_session
ON public.game_question_analytics (session_id, question_index);

-- Analyze tables to update query planner statistics
ANALYZE public.daily_rankings;
ANALYZE public.game_results;
ANALYZE public.wallet_ledger;
ANALYZE public.lives_ledger;
ANALYZE public.game_sessions;