-- Backfill and defaults to ensure lives/coins are never NULL and new users can always start game
-- 1) Backfill NULLs in profiles
UPDATE public.profiles
SET 
  coins = COALESCE(coins, 0),
  lives = COALESCE(lives, 15),
  max_lives = COALESCE(max_lives, 15),
  lives_regeneration_rate = COALESCE(lives_regeneration_rate, 12),
  last_life_regeneration = COALESCE(last_life_regeneration, now()),
  help_third_active = COALESCE(help_third_active, true),
  help_2x_answer_active = COALESCE(help_2x_answer_active, true),
  help_audience_active = COALESCE(help_audience_active, true),
  daily_gift_streak = COALESCE(daily_gift_streak, 0),
  question_swaps_available = COALESCE(question_swaps_available, 0),
  total_correct_answers = COALESCE(total_correct_answers, 0),
  country_code = COALESCE(country_code, 'HU')
WHERE 
  coins IS NULL OR lives IS NULL OR max_lives IS NULL OR 
  lives_regeneration_rate IS NULL OR last_life_regeneration IS NULL OR 
  help_third_active IS NULL OR help_2x_answer_active IS NULL OR help_audience_active IS NULL OR 
  daily_gift_streak IS NULL OR question_swaps_available IS NULL OR total_correct_answers IS NULL OR country_code IS NULL;

-- 2) Set sane defaults for future rows (keep columns nullable to avoid breaking existing codegen types)
ALTER TABLE public.profiles 
  ALTER COLUMN coins SET DEFAULT 0,
  ALTER COLUMN lives SET DEFAULT 15,
  ALTER COLUMN max_lives SET DEFAULT 15,
  ALTER COLUMN lives_regeneration_rate SET DEFAULT 12,
  ALTER COLUMN last_life_regeneration SET DEFAULT now(),
  ALTER COLUMN help_third_active SET DEFAULT true,
  ALTER COLUMN help_2x_answer_active SET DEFAULT true,
  ALTER COLUMN help_audience_active SET DEFAULT true,
  ALTER COLUMN daily_gift_streak SET DEFAULT 0,
  ALTER COLUMN question_swaps_available SET DEFAULT 0,
  ALTER COLUMN total_correct_answers SET DEFAULT 0,
  ALTER COLUMN country_code SET DEFAULT 'HU';

-- 3) Ensure handle_new_user continues to work with defaults (no change needed) but we fix welcome bonus math to be NULL-safe
CREATE OR REPLACE FUNCTION public.claim_welcome_bonus()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  already_claimed BOOLEAN;
  user_id uuid := auth.uid();
  v_coins_before integer;
  v_lives_before integer;
  v_max_lives integer;
BEGIN
  -- Check if user exists and get current values
  SELECT welcome_bonus_claimed, COALESCE(coins,0), COALESCE(lives,15), COALESCE(max_lives,15)
  INTO already_claimed, v_coins_before, v_lives_before, v_max_lives
  FROM profiles 
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Felhasználó nem található');
  END IF;
  
  IF already_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Már igényelted az üdvözlő bónuszt');
  END IF;
  
  -- Award coins and lives directly (transactionally), NULL-safe
  UPDATE profiles
  SET 
    coins = COALESCE(coins,0) + 2500,
    lives = LEAST(COALESCE(lives,15) + 50, COALESCE(max_lives,15) + 50), -- Allow lives to exceed max temporarily
    welcome_bonus_claimed = true,
    updated_at = now()
  WHERE id = user_id;
  
  -- Record in wallet ledger for coins
  INSERT INTO wallet_ledger (user_id, idempotency_key, delta_coins, delta_lives, source, metadata)
  VALUES (user_id, 'welcome_coins:' || user_id::text, 2500, 0, 'welcome', jsonb_build_object('bonus_type', 'welcome'))
  ON CONFLICT (idempotency_key) DO NOTHING;
  
  -- Record in lives ledger
  INSERT INTO lives_ledger (user_id, correlation_id, delta_lives, source, metadata)
  VALUES (user_id, 'welcome_lives:' || user_id::text, 50, 'welcome', jsonb_build_object('bonus_type', 'welcome'))
  ON CONFLICT (correlation_id) DO NOTHING;
  
  RETURN json_build_object(
    'success', true, 
    'coins', 2500, 
    'lives', 50
  );
END;
$function$;

-- 4) Defensive: if any existing rows still have future timestamps, normalize them now
UPDATE public.profiles 
SET last_life_regeneration = now()
WHERE last_life_regeneration IS NOT NULL AND last_life_regeneration > now();
