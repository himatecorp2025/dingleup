-- Fix Security Linter Issues: Add SET search_path and move extensions

-- Drop and recreate use_life() with correct return type
DROP FUNCTION IF EXISTS public.use_life();

CREATE FUNCTION public.use_life()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_current_lives INTEGER;
  v_max_lives INTEGER;
  v_last_regen TIMESTAMPTZ;
  v_regen_rate INTEGER;
  v_now TIMESTAMPTZ;
  v_minutes_passed NUMERIC;
  v_lives_to_add INTEGER;
  v_updated_lives INTEGER;
BEGIN
  v_user_id := auth.uid();
  v_now := NOW();
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Lock and fetch user profile
  SELECT 
    COALESCE(lives, 0),
    COALESCE(max_lives, 15),
    COALESCE(last_life_regeneration, v_now),
    COALESCE(lives_regeneration_rate, 12)
  INTO v_current_lives, v_max_lives, v_last_regen, v_regen_rate
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;
  
  -- Normalize future timestamps
  IF v_last_regen > v_now THEN
    v_last_regen := v_now;
    v_updated_lives := v_current_lives;
  ELSE
    -- Calculate regenerated lives
    v_minutes_passed := EXTRACT(EPOCH FROM (v_now - v_last_regen)) / 60;
    v_lives_to_add := FLOOR(v_minutes_passed / v_regen_rate)::INTEGER;
    v_updated_lives := LEAST(v_current_lives + v_lives_to_add, v_max_lives);
  END IF;
  
  -- Check if user has at least 1 life
  IF v_updated_lives < 1 THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct 1 life
  UPDATE public.profiles
  SET 
    lives = v_updated_lives - 1,
    last_life_regeneration = v_now
  WHERE id = v_user_id;
  
  -- Log to wallet_ledger
  INSERT INTO public.wallet_ledger (user_id, delta_coins, delta_lives, source, metadata)
  VALUES (
    v_user_id,
    0,
    -1,
    'game_start',
    jsonb_build_object('timestamp', v_now)
  );
  
  RETURN TRUE;
END;
$$;

-- Update other functions with SET search_path
CREATE OR REPLACE FUNCTION public.regenerate_lives()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_user RECORD;
BEGIN
  v_now := NOW();
  
  FOR v_user IN 
    SELECT id, lives, max_lives, last_life_regeneration, lives_regeneration_rate
    FROM public.profiles
    WHERE lives < max_lives
  LOOP
    DECLARE
      v_last_regen TIMESTAMPTZ;
      v_minutes_passed NUMERIC;
      v_lives_to_add INTEGER;
      v_new_lives INTEGER;
    BEGIN
      IF v_user.last_life_regeneration > v_now THEN
        v_last_regen := v_now;
        UPDATE public.profiles SET last_life_regeneration = v_now WHERE id = v_user.id;
      ELSE
        v_last_regen := v_user.last_life_regeneration;
      END IF;
      
      v_minutes_passed := EXTRACT(EPOCH FROM (v_now - v_last_regen)) / 60;
      v_lives_to_add := FLOOR(v_minutes_passed / COALESCE(v_user.lives_regeneration_rate, 12));
      
      IF v_lives_to_add > 0 THEN
        v_new_lives := LEAST(COALESCE(v_user.lives, 0) + v_lives_to_add, v_user.max_lives);
        UPDATE public.profiles SET lives = v_new_lives, last_life_regeneration = v_last_regen + (v_lives_to_add * INTERVAL '1 minute' * COALESCE(v_user.lives_regeneration_rate, 12)) WHERE id = v_user.id;
      END IF;
    END;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_weekly_ranking_for_user(p_user_id UUID, p_correct_answers INTEGER, p_average_response_time NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_week_start DATE;
BEGIN
  v_week_start := get_current_week_start();
  
  INSERT INTO weekly_rankings (user_id, category, week_start, total_correct_answers, average_response_time)
  VALUES (p_user_id, 'mixed', v_week_start, p_correct_answers, p_average_response_time)
  ON CONFLICT (user_id, category, week_start)
  DO UPDATE SET
    total_correct_answers = weekly_rankings.total_correct_answers + EXCLUDED.total_correct_answers,
    average_response_time = ((weekly_rankings.average_response_time * weekly_rankings.total_correct_answers) + (EXCLUDED.average_response_time * EXCLUDED.total_correct_answers)) / (weekly_rankings.total_correct_answers + EXCLUDED.total_correct_answers);
    
  WITH ranked_users AS (
    SELECT user_id, category, week_start, ROW_NUMBER() OVER (PARTITION BY category, week_start ORDER BY total_correct_answers DESC, average_response_time ASC) as new_rank
    FROM weekly_rankings WHERE week_start = v_week_start AND category = 'mixed'
  )
  UPDATE weekly_rankings wr SET rank = ru.new_rank FROM ranked_users ru WHERE wr.user_id = ru.user_id AND wr.category = ru.category AND wr.week_start = ru.week_start;
END;
$$;