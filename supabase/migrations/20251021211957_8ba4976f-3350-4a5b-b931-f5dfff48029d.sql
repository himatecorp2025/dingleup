-- Fill global_leaderboard with real user data from game_results
INSERT INTO global_leaderboard (user_id, username, avatar_url, total_correct_answers, rank)
SELECT 
  p.id as user_id,
  p.username,
  p.avatar_url,
  COALESCE(SUM(gr.correct_answers), 0) as total_correct_answers,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(gr.correct_answers), 0) DESC) as rank
FROM profiles p
LEFT JOIN game_results gr ON p.id = gr.user_id AND gr.completed = true
GROUP BY p.id, p.username, p.avatar_url
ON CONFLICT (user_id) 
DO UPDATE SET
  username = EXCLUDED.username,
  avatar_url = EXCLUDED.avatar_url,
  total_correct_answers = EXCLUDED.total_correct_answers,
  rank = EXCLUDED.rank,
  updated_at = now();

-- Fix the activate_speed_booster function to NOT add lives immediately
-- Only change regeneration rate and max_lives for future regeneration
CREATE OR REPLACE FUNCTION public.activate_speed_booster(booster_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booster RECORD;
  v_multiplier INTEGER;
  v_max_lives INTEGER;
  v_regen_rate_minutes NUMERIC;
  v_expires_at TIMESTAMPTZ := now() + interval '60 minutes';
BEGIN
  SELECT * INTO v_booster
  FROM public.user_boosters
  WHERE id = booster_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booster not found or not owned by user';
  END IF;

  IF v_booster.activated THEN
    RETURN true;
  END IF;

  -- Set multiplier, max_lives and regen rate based on booster type
  CASE v_booster.booster_type
    WHEN 'DoubleSpeed' THEN 
      v_multiplier := 2; 
      v_max_lives := 25;
      v_regen_rate_minutes := 6;  -- 6 minutes per life
    WHEN 'MegaSpeed' THEN 
      v_multiplier := 4; 
      v_max_lives := 35;
      v_regen_rate_minutes := 3;  -- 3 minutes per life
    WHEN 'GigaSpeed' THEN 
      v_multiplier := 12; 
      v_max_lives := 75;
      v_regen_rate_minutes := 1;  -- 1 minute per life
    WHEN 'DingleSpeed' THEN 
      v_multiplier := 24; 
      v_max_lives := 135;
      v_regen_rate_minutes := 0.5;  -- 30 seconds per life
    ELSE 
      RAISE EXCEPTION 'Unknown booster type: %', v_booster.booster_type;
  END CASE;

  -- Mark booster as activated
  UPDATE public.user_boosters
  SET activated = true,
      activated_at = now(),
      expires_at = v_expires_at
  WHERE id = booster_id AND user_id = auth.uid();

  -- Update profile with booster settings
  -- IMPORTANT: Do NOT add lives immediately, only change max_lives and regeneration rate
  UPDATE public.profiles
  SET speed_booster_active = true,
      speed_booster_expires_at = v_expires_at,
      speed_booster_multiplier = v_multiplier,
      max_lives = v_max_lives,
      lives_regeneration_rate = v_regen_rate_minutes,
      updated_at = now()
  WHERE id = auth.uid();

  RETURN true;
END;
$function$;