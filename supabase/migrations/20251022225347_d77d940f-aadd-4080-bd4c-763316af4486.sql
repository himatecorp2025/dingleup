-- Fix daily gift to give double rewards to Genius members
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
  is_genius BOOLEAN;
  credit_result json;
BEGIN
  SELECT daily_gift_last_claimed, daily_gift_streak, is_subscriber
  INTO last_claimed, current_streak, is_genius
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
  
  -- Double reward for Genius members
  IF is_genius THEN
    reward_coins := reward_coins * 2;
  END IF;
  
  -- Use credit_wallet for idempotent operation
  SELECT credit_wallet(
    user_id,
    reward_coins,  -- coins
    0,             -- lives
    'daily',
    'daily:' || user_id::text || ':' || today::text,
    json_build_object('streak', new_streak, 'date', today, 'genius_bonus', is_genius)::jsonb
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
  
  RETURN json_build_object('success', true, 'coins', reward_coins, 'streak', new_streak, 'is_genius', is_genius);
END;
$$;