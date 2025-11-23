-- =====================================================
-- P0 CRITICAL PERFORMANCE INDEXES
-- Profiles, Game Results, Wallet Ledger, Daily Rankings, Questions
-- Expected Impact: 50-80% faster queries under load
-- =====================================================

-- ========== PROFILES TABLE INDEXES ==========
-- Leaderboard country filtering (high frequency)
CREATE INDEX IF NOT EXISTS idx_profiles_country_code 
ON public.profiles(country_code);

-- Registration chronology queries
CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
ON public.profiles(created_at DESC);

-- ========== GAME_RESULTS TABLE INDEXES ==========
-- User stats by category (dashboard, profile pages)
CREATE INDEX IF NOT EXISTS idx_game_results_user_category 
ON public.game_results(user_id, category);

-- Completed games chronological queries (analytics, leaderboards)
CREATE INDEX IF NOT EXISTS idx_game_results_completed_created 
ON public.game_results(completed, created_at DESC) 
WHERE completed = true;

-- User game history (profile page, recent games)
CREATE INDEX IF NOT EXISTS idx_game_results_user_created 
ON public.game_results(user_id, created_at DESC);

-- ========== WALLET_LEDGER TABLE INDEXES ==========
-- User transaction history (high frequency)
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_created 
ON public.wallet_ledger(user_id, created_at DESC);

-- Idempotency key lookups (every wallet operation)
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_idempotency 
ON public.wallet_ledger(idempotency_key);

-- ========== DAILY_RANKINGS TABLE INDEXES ==========
-- Daily leaderboard queries (most critical - accessed every dashboard load)
CREATE INDEX IF NOT EXISTS idx_daily_rankings_leaderboard 
ON public.daily_rankings(day_date, category, total_correct_answers DESC);

-- User daily stats lookup
CREATE INDEX IF NOT EXISTS idx_daily_rankings_user_date 
ON public.daily_rankings(user_id, day_date);

-- Category + date filtering (analytics)
CREATE INDEX IF NOT EXISTS idx_daily_rankings_category_date 
ON public.daily_rankings(category, day_date DESC);

-- ========== QUESTIONS TABLE INDEXES ==========
-- Random question selection by category (every game start)
CREATE INDEX IF NOT EXISTS idx_questions_category 
ON public.questions(source_category);