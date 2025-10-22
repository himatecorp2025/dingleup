-- Update daily gift logic: weekly cycle resets on Monday; no consecutive-day requirement
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
  today DATE := CURRENT_DATE;
BEGIN
  SELECT daily_gift_last_claimed, daily_gift_streak
  INTO last_claimed, current_streak
  FROM profiles WHERE id = auth.uid();
  
  -- Check if already claimed today
  IF last_claimed IS NOT NULL AND DATE(last_claimed) = today THEN
    RETURN json_build_object('success', false, 'error', 'Már igényelted a mai ajándékot');
  END IF;
  
  -- Reset at the start of a new week (ISO weeks start on Monday)
  IF last_claimed IS NULL OR date_trunc('week', today::timestamp) > date_trunc('week', last_claimed) THEN
    current_streak := 0;
  END IF;
  
  -- Advance reward step within the week regardless of skipped days
  new_streak := (COALESCE(current_streak, 0) % 7) + 1;
  
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