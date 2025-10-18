-- Fix daily gift rewards
DROP FUNCTION IF EXISTS public.claim_daily_gift();

CREATE OR REPLACE FUNCTION public.claim_daily_gift()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  last_claimed TIMESTAMP WITH TIME ZONE;
  current_streak INTEGER;
  new_streak INTEGER;
  reward_coins INTEGER;
  reward_amounts INTEGER[] := ARRAY[50, 75, 110, 160, 220, 300, 500];
BEGIN
  SELECT daily_gift_last_claimed, daily_gift_streak 
  INTO last_claimed, current_streak
  FROM profiles WHERE id = auth.uid();
  
  -- Check if already claimed today
  IF last_claimed IS NOT NULL AND 
     DATE(last_claimed) = CURRENT_DATE THEN
    RETURN json_build_object('success', false, 'error', 'Már igényelted a mai ajándékot');
  END IF;
  
  -- Check if it's a new week (Monday reset)
  IF last_claimed IS NOT NULL AND 
     EXTRACT(DOW FROM CURRENT_DATE) = 1 AND 
     EXTRACT(DOW FROM last_claimed) != 1 THEN
    current_streak := 0;
  -- Check if streak continues (claimed yesterday or today)
  ELSIF last_claimed IS NOT NULL AND 
        DATE(last_claimed) < CURRENT_DATE - INTERVAL '1 day' THEN
    current_streak := 0;
  END IF;
  
  new_streak := (current_streak + 1) % 7;
  IF new_streak = 0 THEN new_streak := 7; END IF;
  
  -- Get reward from array (1-indexed in PostgreSQL)
  reward_coins := reward_amounts[new_streak];
  
  UPDATE profiles
  SET daily_gift_last_claimed = NOW(),
      daily_gift_streak = new_streak,
      coins = coins + reward_coins
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true, 'coins', reward_coins, 'streak', new_streak);
END;
$function$;