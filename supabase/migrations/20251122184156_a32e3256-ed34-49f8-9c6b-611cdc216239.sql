-- ============================================
-- CRITICAL OPTIMIZATION #1: Leaderboard Pre-Computed Cache
-- ============================================

-- Create leaderboard_cache table for pre-computed TOP 100 per country
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  country_code TEXT NOT NULL,
  rank INT NOT NULL,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  total_correct_answers INT NOT NULL,
  avatar_url TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (country_code, rank)
);

-- Indexes for fast country lookup
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_country ON leaderboard_cache(country_code);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_timestamp ON leaderboard_cache(cached_at);

-- Refresh function to populate cache (called by cron or after game completion)
CREATE OR REPLACE FUNCTION refresh_leaderboard_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear old cache
  TRUNCATE leaderboard_cache;
  
  -- Insert TOP 100 per country from daily_rankings
  INSERT INTO leaderboard_cache (country_code, rank, user_id, username, total_correct_answers, avatar_url)
  SELECT 
    p.country_code,
    ROW_NUMBER() OVER (PARTITION BY p.country_code ORDER BY dr.total_correct_answers DESC, dr.average_response_time ASC) as rank,
    dr.user_id,
    p.username,
    dr.total_correct_answers,
    p.avatar_url
  FROM daily_rankings dr
  JOIN profiles p ON dr.user_id = p.id
  WHERE dr.day_date = CURRENT_DATE
    AND p.country_code IS NOT NULL
  ORDER BY p.country_code, rank
  LIMIT 10000;
  
  -- Keep only TOP 100 per country
  DELETE FROM leaderboard_cache
  WHERE rank > 100;
END;
$$;

-- ============================================
-- CRITICAL OPTIMIZATION #2: Essential Composite Indexes
-- ============================================

-- Daily Rankings: user + date lookup
CREATE INDEX IF NOT EXISTS idx_daily_rankings_user_date 
ON daily_rankings(user_id, day_date);

-- Daily Rankings: date + score for ranking calculations
CREATE INDEX IF NOT EXISTS idx_daily_rankings_date_score 
ON daily_rankings(day_date, total_correct_answers DESC);

-- Profiles: username lookup
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Profiles: country code for leaderboard joins
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country_code);

-- Game results: user + created_at for history
CREATE INDEX IF NOT EXISTS idx_game_results_user_created 
ON game_results(user_id, created_at DESC);

-- Wallet ledger: user + created_at for transaction history
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_created 
ON wallet_ledger(user_id, created_at DESC);

-- Lives ledger: user + created_at for life history
CREATE INDEX IF NOT EXISTS idx_lives_ledger_user_created 
ON lives_ledger(user_id, created_at DESC);

-- Question translations: question_id + lang for multi-language queries
CREATE INDEX IF NOT EXISTS idx_question_translations_qid_lang 
ON question_translations(question_id, lang);

-- Initial population of cache
SELECT refresh_leaderboard_cache();