-- Fix Daily Gift to use user timezone instead of UTC
-- This ensures users get new Daily Gift at their local midnight, not UTC midnight

CREATE OR REPLACE FUNCTION public.claim_daily_gift()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_user_timezone text;
  v_current_streak int;
  v_new_streak int;
  v_cycle_position int;
  v_reward_coins int;
  v_today text;
  v_last_claimed_date text;
  v_idempotency_key text;
  v_existing_claim record;
  v_can_claim boolean;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NOT_LOGGED_IN'
    );
  END IF;

  -- Get user profile
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PROFILE_NOT_FOUND'
    );
  END IF;

  -- CRITICAL FIX: Use user's timezone, not UTC
  v_user_timezone := COALESCE(v_profile.user_timezone, 'UTC');
  
  -- Calculate today's date in user's timezone
  v_today := TO_CHAR(NOW() AT TIME ZONE v_user_timezone, 'YYYY-MM-DD');
  
  -- Check if already claimed today (in user's timezone)
  IF v_profile.daily_gift_last_claimed IS NOT NULL THEN
    v_last_claimed_date := TO_CHAR(v_profile.daily_gift_last_claimed AT TIME ZONE v_user_timezone, 'YYYY-MM-DD');
    
    IF v_last_claimed_date = v_today THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'ALREADY_CLAIMED_TODAY'
      );
    END IF;
  END IF;

  -- Idempotency check (timezone-aware date key)
  v_idempotency_key := 'daily-gift:' || v_user_id || ':' || v_today;

  SELECT * INTO v_existing_claim
  FROM wallet_ledger
  WHERE idempotency_key = v_idempotency_key
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ALREADY_CLAIMED_TODAY'
    );
  END IF;

  -- Calculate streak and reward
  v_current_streak := COALESCE(v_profile.daily_gift_streak, 0);
  v_new_streak := v_current_streak + 1;
  v_cycle_position := v_current_streak % 7;
  
  -- Reward amounts for 7-day cycle
  v_reward_coins := CASE v_cycle_position
    WHEN 0 THEN 50
    WHEN 1 THEN 75
    WHEN 2 THEN 110
    WHEN 3 THEN 160
    WHEN 4 THEN 220
    WHEN 5 THEN 300
    WHEN 6 THEN 500
  END;

  -- Credit coins via wallet_ledger (idempotent)
  INSERT INTO wallet_ledger (
    user_id,
    delta_coins,
    delta_lives,
    source,
    idempotency_key,
    metadata
  ) VALUES (
    v_user_id,
    v_reward_coins,
    0,
    'daily',
    v_idempotency_key,
    jsonb_build_object(
      'streak', v_new_streak,
      'cycle_position', v_cycle_position,
      'date', v_today,
      'timezone', v_user_timezone
    )
  );

  -- Update profile (atomic with transaction)
  UPDATE profiles
  SET 
    coins = COALESCE(coins, 0) + v_reward_coins,
    daily_gift_streak = v_new_streak,
    daily_gift_last_claimed = NOW()
  WHERE id = v_user_id;

  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'grantedCoins', v_reward_coins,
    'walletBalance', COALESCE(v_profile.coins, 0) + v_reward_coins,
    'streak', v_new_streak
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SERVER_ERROR'
    );
END;
$function$;