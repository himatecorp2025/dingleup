-- ============================================
-- CRITICAL SECURITY FIX: RLS Policies (Clean Slate)
-- ============================================

-- ====== FIX 1: friend_request_rate_limit ======
-- Remove ALL existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "System can manage rate limits" ON public.friend_request_rate_limit;
    DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.friend_request_rate_limit;
    DROP POLICY IF EXISTS "Users view own rate limits" ON public.friend_request_rate_limit;
    DROP POLICY IF EXISTS "Service role manages rate limits" ON public.friend_request_rate_limit;
END $$;

-- Create new secure policies
CREATE POLICY "Users view own rate limits"
ON public.friend_request_rate_limit
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = target_user_id);

CREATE POLICY "Service role manages rate limits"
ON public.friend_request_rate_limit
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ====== FIX 2: global_leaderboard ======
-- Drop existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view global leaderboard" ON public.global_leaderboard;
    DROP POLICY IF EXISTS "Only owners and admins can view full leaderboard" ON public.global_leaderboard;
    DROP POLICY IF EXISTS "Users can insert their own leaderboard stats" ON public.global_leaderboard;
    DROP POLICY IF EXISTS "Users can update their own leaderboard stats" ON public.global_leaderboard;
END $$;

-- Create secure view (without user_id)
DROP VIEW IF EXISTS public.leaderboard_public CASCADE;
CREATE VIEW public.leaderboard_public
WITH (security_invoker=on)
AS
SELECT 
  rank,
  username,
  avatar_url,
  total_correct_answers,
  created_at,
  updated_at
FROM global_leaderboard
ORDER BY rank ASC
LIMIT 100;

GRANT SELECT ON public.leaderboard_public TO authenticated, anon;

-- Enable RLS and restrict access
ALTER TABLE public.global_leaderboard ENABLE ROW LEVEL SECURITY;

-- Only owner and admins can see full data (including user_id)
CREATE POLICY "Owners and admins view full leaderboard"
ON public.global_leaderboard
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  has_role(auth.uid(), 'admin')
);

-- Keep existing insert/update policies
CREATE POLICY "Users can insert own leaderboard stats"
ON public.global_leaderboard
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard stats"
ON public.global_leaderboard
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ====== FIX 3: weekly_rankings ======
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view weekly rankings" ON public.weekly_rankings;
    DROP POLICY IF EXISTS "Users can view weekly rankings" ON public.weekly_rankings;
    DROP POLICY IF EXISTS "Only owners and admins can view full rankings" ON public.weekly_rankings;
END $$;

-- Create public view without sensitive data
DROP VIEW IF EXISTS public.weekly_rankings_public CASCADE;
CREATE VIEW public.weekly_rankings_public
WITH (security_invoker=on)
AS
SELECT 
  week_start,
  category,
  rank,
  username,
  total_correct_answers,
  created_at
FROM weekly_rankings
WHERE rank <= 10
ORDER BY week_start DESC, category, rank ASC;

GRANT SELECT ON public.weekly_rankings_public TO authenticated, anon;

-- Enable RLS
ALTER TABLE public.weekly_rankings ENABLE ROW LEVEL SECURITY;

-- Only owner and admins see full data
CREATE POLICY "Owners and admins view full rankings"
ON public.weekly_rankings
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  has_role(auth.uid(), 'admin')
);

-- ====== FIX 4: weekly_login_rewards & weekly_prize_table ======
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view weekly login rewards" ON public.weekly_login_rewards;
    DROP POLICY IF EXISTS "Authenticated users can view login rewards" ON public.weekly_login_rewards;
    DROP POLICY IF EXISTS "Anyone can view prize table" ON public.weekly_prize_table;
    DROP POLICY IF EXISTS "Authenticated users can view prize table" ON public.weekly_prize_table;
END $$;

ALTER TABLE public.weekly_login_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_prize_table ENABLE ROW LEVEL SECURITY;

-- Only authenticated users (no public scraping)
CREATE POLICY "Authenticated users view login rewards"
ON public.weekly_login_rewards
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users view prize table"
ON public.weekly_prize_table
FOR SELECT
TO authenticated
USING (true);

-- Safe function to get current reward
CREATE OR REPLACE FUNCTION public.get_current_week_reward()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_day INTEGER;
  reward_data JSON;
BEGIN
  current_day := EXTRACT(DOW FROM CURRENT_DATE);
  IF current_day = 0 THEN current_day := 7; END IF;
  
  SELECT json_build_object(
    'day', day,
    'coins', coins,
    'genius_coins', genius_coins
  ) INTO reward_data
  FROM weekly_login_rewards
  WHERE day = current_day;
  
  RETURN reward_data;
END;
$$;