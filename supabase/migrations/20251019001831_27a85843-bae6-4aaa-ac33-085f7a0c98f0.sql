-- Migration to support weekly rewards system
-- Add function to distribute weekly rewards

CREATE OR REPLACE FUNCTION public.distribute_weekly_rewards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  week_start DATE;
  reward_record RECORD;
  reward_coins INTEGER;
  reward_lives INTEGER;
BEGIN
  -- Calculate the Monday of the previous week
  week_start := CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 6;
  
  -- Define rewards for each rank (1-10)
  FOR reward_record IN
    SELECT 
      user_id,
      rank,
      category
    FROM weekly_rankings
    WHERE week_start = week_start
      AND rank <= 10
    ORDER BY category, rank
  LOOP
    -- Determine reward amounts based on rank
    CASE reward_record.rank
      WHEN 1 THEN reward_coins := 5000; reward_lives := 100;
      WHEN 2 THEN reward_coins := 2500; reward_lives := 50;
      WHEN 3 THEN reward_coins := 1500; reward_lives := 30;
      WHEN 4 THEN reward_coins := 1000; reward_lives := 20;
      WHEN 5 THEN reward_coins := 800; reward_lives := 15;
      WHEN 6 THEN reward_coins := 700; reward_lives := 10;
      WHEN 7 THEN reward_coins := 600; reward_lives := 10;
      WHEN 8 THEN reward_coins := 500; reward_lives := 8;
      WHEN 9 THEN reward_coins := 500; reward_lives := 6;
      WHEN 10 THEN reward_coins := 500; reward_lives := 5;
      ELSE CONTINUE;
    END CASE;
    
    -- Award coins and lives to the user
    UPDATE profiles
    SET 
      coins = coins + reward_coins,
      lives = LEAST(lives + reward_lives, max_lives + reward_lives)
    WHERE id = reward_record.user_id;
  END LOOP;
END;
$$;