-- Update claim_welcome_bonus to use idempotent wallet credit
CREATE OR REPLACE FUNCTION public.claim_welcome_bonus()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  already_claimed BOOLEAN;
  user_id uuid := auth.uid();
  credit_result json;
BEGIN
  SELECT welcome_bonus_claimed INTO already_claimed
  FROM profiles WHERE id = user_id;
  
  IF already_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Már igényelted az üdvözlő bónuszt');
  END IF;
  
  -- Use credit_wallet for idempotent operation
  SELECT credit_wallet(
    user_id,
    2500,  -- coins
    50,    -- lives
    'welcome',
    'welcome:' || user_id::text,
    '{"bonus_type": "welcome"}'::jsonb
  ) INTO credit_result;
  
  -- Check if credit was successful
  IF (credit_result->>'success')::boolean = false THEN
    RETURN credit_result;
  END IF;
  
  -- Mark as claimed
  UPDATE profiles
  SET welcome_bonus_claimed = true
  WHERE id = user_id;
  
  RETURN json_build_object('success', true, 'coins', 2500, 'lives', 50);
END;
$$;

-- Update claim_daily_gift to use idempotent wallet credit
CREATE OR REPLACE FUNCTION public.claim_daily_gift()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  last_claimed TIMESTAMP WITH TIME ZONE;
  current_streak INTEGER;
  new_streak INTEGER;
  reward_coins INTEGER;
  reward_amounts INTEGER[] := ARRAY[50, 75, 110, 160, 220, 300, 500];
  today DATE := CURRENT_DATE;
  user_id uuid := auth.uid();
  credit_result json;
BEGIN
  SELECT daily_gift_last_claimed, daily_gift_streak
  INTO last_claimed, current_streak
  FROM profiles WHERE id = user_id;
  
  IF last_claimed IS NOT NULL AND DATE(last_claimed) = today THEN
    RETURN json_build_object('success', false, 'error', 'Már igényelted a mai ajándékot');
  END IF;
  
  -- Reset streak if week changed
  IF last_claimed IS NULL OR date_trunc('week', today::timestamp) > date_trunc('week', last_claimed) THEN
    current_streak := 0;
  END IF;
  
  new_streak := (COALESCE(current_streak, 0) % 7) + 1;
  reward_coins := reward_amounts[new_streak];
  
  -- Use credit_wallet for idempotent operation
  SELECT credit_wallet(
    user_id,
    reward_coins,  -- coins
    0,             -- lives
    'daily',
    'daily:' || user_id::text || ':' || today::text,
    json_build_object('streak', new_streak, 'date', today)::jsonb
  ) INTO credit_result;
  
  -- Check if credit was successful
  IF (credit_result->>'success')::boolean = false THEN
    RETURN credit_result;
  END IF;
  
  -- Update profile
  UPDATE profiles
  SET daily_gift_last_claimed = NOW(),
      daily_gift_streak = new_streak
  WHERE id = user_id;
  
  RETURN json_build_object('success', true, 'coins', reward_coins, 'streak', new_streak);
END;
$$;