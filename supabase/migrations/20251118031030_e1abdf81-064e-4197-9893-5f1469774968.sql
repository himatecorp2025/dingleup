-- Fix 1: regenerate_lives() - CRITICAL: Change INTERVAL '1 hour' to '1 minute'
CREATE OR REPLACE FUNCTION public.regenerate_lives()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_profile RECORD;
  minutes_passed NUMERIC;
  lives_to_add INTEGER;
  new_lives INTEGER;
  regen_rate_minutes NUMERIC;
BEGIN
  SELECT * INTO user_profile
  FROM profiles
  WHERE id = auth.uid();
  
  -- Handle NULL values gracefully
  IF user_profile.last_life_regeneration IS NULL THEN
    UPDATE profiles
    SET last_life_regeneration = NOW()
    WHERE id = auth.uid();
    RETURN;
  END IF;
  
  -- Normalize future timestamps
  IF user_profile.last_life_regeneration > NOW() THEN
    UPDATE profiles
    SET last_life_regeneration = NOW()
    WHERE id = auth.uid();
    RETURN;
  END IF;
  
  regen_rate_minutes := COALESCE(user_profile.lives_regeneration_rate, 12);
  minutes_passed := EXTRACT(EPOCH FROM (NOW() - user_profile.last_life_regeneration)) / 60;
  lives_to_add := FLOOR(minutes_passed / regen_rate_minutes)::INTEGER;
  
  IF lives_to_add > 0 THEN
    -- Only regenerate if current lives is below max_lives
    IF user_profile.lives < user_profile.max_lives THEN
      new_lives := LEAST(user_profile.lives + lives_to_add, user_profile.max_lives);
      
      UPDATE profiles
      SET 
        lives = new_lives,
        last_life_regeneration = last_life_regeneration + (lives_to_add * regen_rate_minutes * INTERVAL '1 minute')
      WHERE id = auth.uid();
    ELSE
      -- Lives already at or above max - just update timestamp
      UPDATE profiles
      SET last_life_regeneration = last_life_regeneration + (lives_to_add * regen_rate_minutes * INTERVAL '1 minute')
      WHERE id = auth.uid();
    END IF;
  END IF;
END;
$function$;

-- Fix 2: regenerate_lives_background() - CRITICAL: Fix minutes calculation and INTERVAL
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
    last_regen_ts := profile_rec.last_life_regeneration;
    
    -- Guard: if last_life_regeneration is in the future, normalize it to now
    IF last_regen_ts > current_time THEN
      UPDATE public.profiles
      SET last_life_regeneration = current_time
      WHERE id = profile_rec.id;
      last_regen_ts := current_time;
    END IF;
    
    -- Regenerate lives if below max
    IF profile_rec.lives < effective_max_lives THEN
      minutes_passed := EXTRACT(EPOCH FROM (current_time - last_regen_ts)) / 60;
      
      IF minutes_passed < 0 THEN
        minutes_passed := 0;
      END IF;
      
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

-- Fix 3: New function for instant weekly rankings update
CREATE OR REPLACE FUNCTION public.update_weekly_ranking_for_user(
  p_user_id UUID,
  p_correct_answers INTEGER,
  p_average_response_time NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_week_start DATE;
BEGIN
  -- Calculate current week's Monday
  v_week_start := get_current_week_start();
  
  -- Upsert user's weekly ranking (aggregated across all categories)
  INSERT INTO weekly_rankings (
    user_id, 
    category, 
    week_start, 
    total_correct_answers, 
    average_response_time
  )
  VALUES (
    p_user_id,
    'mixed',
    v_week_start,
    p_correct_answers,
    p_average_response_time
  )
  ON CONFLICT (user_id, category, week_start)
  DO UPDATE SET
    total_correct_answers = weekly_rankings.total_correct_answers + EXCLUDED.total_correct_answers,
    average_response_time = (
      (weekly_rankings.average_response_time * weekly_rankings.total_correct_answers) + 
      (EXCLUDED.average_response_time * EXCLUDED.total_correct_answers)
    ) / (weekly_rankings.total_correct_answers + EXCLUDED.total_correct_answers);
    
  -- Recalculate ranks for all users in this week
  WITH ranked_users AS (
    SELECT 
      user_id,
      category,
      week_start,
      ROW_NUMBER() OVER (
        PARTITION BY category, week_start 
        ORDER BY total_correct_answers DESC, average_response_time ASC
      ) as new_rank
    FROM weekly_rankings
    WHERE week_start = v_week_start
      AND category = 'mixed'
  )
  UPDATE weekly_rankings wr
  SET rank = ru.new_rank
  FROM ranked_users ru
  WHERE wr.user_id = ru.user_id
    AND wr.category = ru.category
    AND wr.week_start = ru.week_start;
END;
$function$;

-- Fix 4: Initialize all users in weekly_rankings
DO $$
DECLARE
  v_week_start DATE;
  v_user RECORD;
BEGIN
  v_week_start := (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int + 1);
  
  FOR v_user IN SELECT id FROM profiles
  LOOP
    INSERT INTO weekly_rankings (user_id, category, week_start, total_correct_answers, average_response_time, rank)
    VALUES (v_user.id, 'mixed', v_week_start, 0, 0, 999999)
    ON CONFLICT (user_id, category, week_start) DO NOTHING;
  END LOOP;
END $$;

-- Fix 5: Create analytics data retention policy (90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete analytics older than 90 days
  DELETE FROM app_session_events WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM navigation_events WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM bonus_claim_events WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM chat_interaction_events WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM conversion_events WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM feature_usage_events WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM game_exit_events WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM performance_metrics WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days';
END;
$function$;