-- ============================================
-- CRITICAL SECURITY FIX: RLS Policies (Fixed)
-- ============================================

-- FIX 1: friend_request_rate_limit - Remove public access to user relationships
DROP POLICY IF EXISTS "System can manage rate limits" ON public.friend_request_rate_limit;

-- Only users can view their OWN rate limits
CREATE POLICY "Users view own rate limits"
ON public.friend_request_rate_limit
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = target_user_id);

-- System (service role) can manage rate limits
CREATE POLICY "Service role manages rate limits"
ON public.friend_request_rate_limit
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- FIX 2: global_leaderboard - Hide user_id from public view
-- Create a secure view that doesn't expose user_id
DROP VIEW IF EXISTS public.leaderboard_public;
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

-- Grant select on the view
GRANT SELECT ON public.leaderboard_public TO authenticated, anon;

-- Revoke direct access to global_leaderboard for non-authenticated users
ALTER TABLE public.global_leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view global leaderboard" ON public.global_leaderboard;

CREATE POLICY "Only owners and admins can view full leaderboard"
ON public.global_leaderboard
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- FIX 3: weekly_rankings - Hide user_id and detailed performance data
DROP VIEW IF EXISTS public.weekly_rankings_public;
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

-- Restrict direct access to weekly_rankings
ALTER TABLE public.weekly_rankings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view weekly rankings" ON public.weekly_rankings;
DROP POLICY IF EXISTS "Users can view weekly rankings" ON public.weekly_rankings;

CREATE POLICY "Only owners and admins can view full rankings"
ON public.weekly_rankings
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- FIX 4: weekly_login_rewards & weekly_prize_table - Restrict config access
ALTER TABLE public.weekly_login_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_prize_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view weekly login rewards" ON public.weekly_login_rewards;
DROP POLICY IF EXISTS "Anyone can view prize table" ON public.weekly_prize_table;

-- Only authenticated users can view rewards (prevent scraping)
CREATE POLICY "Authenticated users can view login rewards"
ON public.weekly_login_rewards
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view prize table"
ON public.weekly_prize_table
FOR SELECT
TO authenticated
USING (true);

-- Create safe public functions to get reward info when needed
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
  -- Calculate current day of week (1-7)
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