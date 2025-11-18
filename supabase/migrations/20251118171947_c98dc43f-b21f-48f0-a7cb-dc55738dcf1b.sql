-- Fix COALESCE type conversion error in regenerate_lives_background function
CREATE OR REPLACE FUNCTION public.regenerate_lives_background()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  profile_rec RECORD;
  minutes_passed NUMERIC;
  lives_to_add INTEGER;
  regen_rate_minutes NUMERIC;
  effective_max_lives INTEGER;
  current_time TIMESTAMP WITH TIME ZONE := NOW();
  last_regen_ts TIMESTAMP WITH TIME ZONE;
BEGIN
  FOR profile_rec IN 
    SELECT id, lives, max_lives, lives_regeneration_rate, last_life_regeneration
    FROM public.profiles 
  LOOP
    effective_max_lives := COALESCE(profile_rec.max_lives, 15);
    regen_rate_minutes := COALESCE(profile_rec.lives_regeneration_rate, 12);
    
    -- CRITICAL: Ensure last_life_regeneration is properly cast to TIMESTAMP WITH TIME ZONE
    -- Use explicit CAST instead of :: to avoid type ambiguity
    last_regen_ts := COALESCE(
      CAST(profile_rec.last_life_regeneration AS TIMESTAMP WITH TIME ZONE),
      current_time
    );
    
    -- Guard: if last_life_regeneration is in the future, normalize it to now
    IF last_regen_ts > current_time THEN
      UPDATE public.profiles
      SET last_life_regeneration = current_time
      WHERE id = profile_rec.id;
      last_regen_ts := current_time;
    END IF;
    
    -- Regenerate lives if below max
    IF profile_rec.lives < effective_max_lives THEN
      -- Calculate minutes passed (ensure non-negative)
      minutes_passed := GREATEST(0, EXTRACT(EPOCH FROM (current_time - last_regen_ts)) / 60);
      
      lives_to_add := FLOOR(minutes_passed / regen_rate_minutes)::INTEGER;
      
      IF lives_to_add > 0 THEN
        UPDATE public.profiles
        SET 
          lives = LEAST(lives + lives_to_add, effective_max_lives),
          last_life_regeneration = last_life_regeneration + (lives_to_add * regen_rate_minutes * INTERVAL '1 minute')
        WHERE id = profile_rec.id;
      END IF;
    END IF;
  END LOOP;
END;
$function$;

-- Add composite indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_profiles_lives_regen ON public.profiles(lives, last_life_regeneration) WHERE lives < max_lives;
CREATE INDEX IF NOT EXISTS idx_game_results_user_completed ON public.game_results(user_id, completed_at) WHERE completed = true;
CREATE INDEX IF NOT EXISTS idx_weekly_rankings_week_category ON public.weekly_rankings(week_start, category, total_correct_answers DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_created ON public.wallet_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_likes_question ON public.question_likes(question_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_created ON public.dm_messages(thread_id, created_at DESC) WHERE is_deleted = false;

-- Create materialized view for leaderboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS public.leaderboard_cache AS
SELECT 
  p.id as user_id,
  p.username,
  p.avatar_url,
  p.country_code,
  COALESCE(SUM(gr.correct_answers), 0) as total_correct_answers,
  COALESCE(AVG(gr.average_response_time), 0) as avg_response_time,
  ROW_NUMBER() OVER (PARTITION BY p.country_code ORDER BY COALESCE(SUM(gr.correct_answers), 0) DESC, COALESCE(AVG(gr.average_response_time), 999999) ASC) as country_rank
FROM public.profiles p
LEFT JOIN public.game_results gr ON gr.user_id = p.id AND gr.completed = true
GROUP BY p.id, p.username, p.avatar_url, p.country_code;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_cache_user ON public.leaderboard_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_country_rank ON public.leaderboard_cache(country_code, country_rank);

-- Create function to refresh leaderboard cache
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_cache()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_cache;
END;
$function$;