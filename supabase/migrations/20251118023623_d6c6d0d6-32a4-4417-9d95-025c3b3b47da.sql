-- Fix critical bug: regenerate_lives() must not reduce lives when above max_lives
-- This bug causes users to lose their welcome bonus lives (50) when starting a game

-- 1. Fix regenerate_lives() to NEVER reduce lives
CREATE OR REPLACE FUNCTION regenerate_lives()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
  hours_passed NUMERIC;
  lives_to_add INTEGER;
  new_lives INTEGER;
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
  
  hours_passed := EXTRACT(EPOCH FROM (NOW() - user_profile.last_life_regeneration)) / 3600;
  lives_to_add := FLOOR(hours_passed / COALESCE(user_profile.lives_regeneration_rate, 12))::INTEGER;
  
  IF lives_to_add > 0 THEN
    -- CRITICAL FIX: Only regenerate if current lives is below max_lives
    -- Never reduce lives that are above max (from welcome bonus)
    IF user_profile.lives < user_profile.max_lives THEN
      new_lives := LEAST(user_profile.lives + lives_to_add, user_profile.max_lives);
      
      UPDATE profiles
      SET 
        lives = new_lives,
        last_life_regeneration = last_life_regeneration + (lives_to_add * lives_regeneration_rate * INTERVAL '1 hour')
      WHERE id = auth.uid();
    ELSE
      -- Lives already at or above max - just update timestamp to prevent infinite loops
      UPDATE profiles
      SET last_life_regeneration = last_life_regeneration + (lives_to_add * lives_regeneration_rate * INTERVAL '1 hour')
      WHERE id = auth.uid();
    END IF;
  END IF;
END;
$$;

-- 2. Fix use_life() to handle NULL values and ensure it works correctly
CREATE OR REPLACE FUNCTION use_life()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_lives INTEGER;
BEGIN
  -- Regenerate first
  PERFORM regenerate_lives();
  
  -- Get current lives after regeneration
  SELECT COALESCE(lives, 0) INTO current_lives
  FROM profiles
  WHERE id = auth.uid();
  
  -- Check if user has at least 1 life
  IF current_lives < 1 THEN
    RETURN false;
  END IF;
  
  -- Deduct 1 life
  UPDATE profiles
  SET 
    lives = lives - 1,
    updated_at = NOW()
  WHERE id = auth.uid();
  
  -- Log to lives_ledger
  INSERT INTO lives_ledger (user_id, delta_lives, source, correlation_id, metadata)
  VALUES (
    auth.uid(), 
    -1, 
    'game_start', 
    'game_start:' || auth.uid()::text || ':' || NOW()::text,
    jsonb_build_object('timestamp', NOW())
  )
  ON CONFLICT DO NOTHING;
  
  RETURN true;
END;
$$;

-- 3. Fix claim_welcome_bonus() to be NULL-safe
CREATE OR REPLACE FUNCTION public.claim_welcome_bonus()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  already_claimed BOOLEAN;
  user_id uuid := auth.uid();
  v_coins_before integer;
  v_lives_before integer;
  v_max_lives integer;
BEGIN
  -- Check if user exists and get current values (NULL-safe)
  SELECT 
    COALESCE(welcome_bonus_claimed, false),
    COALESCE(coins, 0), 
    COALESCE(lives, 0), 
    COALESCE(max_lives, 15)
  INTO already_claimed, v_coins_before, v_lives_before, v_max_lives
  FROM profiles 
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Felhasználó nem található');
  END IF;
  
  IF already_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Már igényelted az üdvözlő bónuszt');
  END IF;
  
  -- Award coins and lives directly (transactionally)
  UPDATE profiles
  SET 
    coins = COALESCE(coins, 0) + 2500,
    lives = COALESCE(lives, 0) + 50,
    welcome_bonus_claimed = true,
    updated_at = now()
  WHERE id = user_id;
  
  -- Record in wallet ledger for coins
  INSERT INTO wallet_ledger (user_id, delta_coins, delta_lives, source, idempotency_key, metadata)
  VALUES (user_id, 2500, 0, 'welcome', 'welcome_coins:' || user_id::text, jsonb_build_object('bonus_type', 'welcome'))
  ON CONFLICT (idempotency_key) DO NOTHING;
  
  -- Record in lives ledger
  INSERT INTO lives_ledger (user_id, delta_lives, source, correlation_id, metadata)
  VALUES (user_id, 50, 'welcome', 'welcome_lives:' || user_id::text, jsonb_build_object('bonus_type', 'welcome'))
  ON CONFLICT DO NOTHING;
  
  RETURN json_build_object(
    'success', true, 
    'coins', 2500, 
    'lives', 50,
    'new_coins', v_coins_before + 2500,
    'new_lives', v_lives_before + 50
  );
END;
$$;

-- 4. Backfill NULL values in profiles table
UPDATE profiles
SET 
  coins = COALESCE(coins, 0),
  lives = COALESCE(lives, 15),
  max_lives = COALESCE(max_lives, 15),
  lives_regeneration_rate = COALESCE(lives_regeneration_rate, 12),
  last_life_regeneration = COALESCE(last_life_regeneration, NOW()),
  help_third_active = COALESCE(help_third_active, true),
  help_2x_answer_active = COALESCE(help_2x_answer_active, true),
  help_audience_active = COALESCE(help_audience_active, true),
  daily_gift_streak = COALESCE(daily_gift_streak, 0),
  question_swaps_available = COALESCE(question_swaps_available, 0),
  total_correct_answers = COALESCE(total_correct_answers, 0),
  country_code = COALESCE(country_code, 'HU'),
  welcome_bonus_claimed = COALESCE(welcome_bonus_claimed, false)
WHERE 
  coins IS NULL 
  OR lives IS NULL 
  OR max_lives IS NULL 
  OR lives_regeneration_rate IS NULL 
  OR last_life_regeneration IS NULL 
  OR help_third_active IS NULL 
  OR help_2x_answer_active IS NULL 
  OR help_audience_active IS NULL 
  OR daily_gift_streak IS NULL 
  OR question_swaps_available IS NULL 
  OR total_correct_answers IS NULL 
  OR country_code IS NULL
  OR welcome_bonus_claimed IS NULL;

-- 5. Set default values for future inserts
ALTER TABLE profiles 
  ALTER COLUMN coins SET DEFAULT 0,
  ALTER COLUMN lives SET DEFAULT 15,
  ALTER COLUMN max_lives SET DEFAULT 15,
  ALTER COLUMN lives_regeneration_rate SET DEFAULT 12,
  ALTER COLUMN last_life_regeneration SET DEFAULT NOW(),
  ALTER COLUMN help_third_active SET DEFAULT true,
  ALTER COLUMN help_2x_answer_active SET DEFAULT true,
  ALTER COLUMN help_audience_active SET DEFAULT true,
  ALTER COLUMN daily_gift_streak SET DEFAULT 0,
  ALTER COLUMN question_swaps_available SET DEFAULT 0,
  ALTER COLUMN total_correct_answers SET DEFAULT 0,
  ALTER COLUMN country_code SET DEFAULT 'HU',
  ALTER COLUMN welcome_bonus_claimed SET DEFAULT false;