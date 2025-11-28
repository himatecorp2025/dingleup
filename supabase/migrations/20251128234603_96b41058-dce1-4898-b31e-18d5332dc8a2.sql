-- Add daily_gift_last_seen column for tracking when user last saw the popup
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_gift_last_seen DATE;

-- Update existing users to have their last_seen match their last_claimed
UPDATE profiles 
SET daily_gift_last_seen = DATE(daily_gift_last_claimed AT TIME ZONE COALESCE(user_timezone, 'UTC'))
WHERE daily_gift_last_claimed IS NOT NULL AND daily_gift_last_seen IS NULL;

-- Update claim_daily_gift function to be fully timezone-aware and update both last_seen and last_claimed
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
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_LOGGED_IN');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROFILE_NOT_FOUND');
  END IF;

  v_user_timezone := COALESCE(v_profile.user_timezone, 'UTC');
  v_today := TO_CHAR(NOW() AT TIME ZONE v_user_timezone, 'YYYY-MM-DD');
  
  -- Check if already claimed today
  IF v_profile.daily_gift_last_claimed IS NOT NULL THEN
    v_last_claimed_date := TO_CHAR(v_profile.daily_gift_last_claimed AT TIME ZONE v_user_timezone, 'YYYY-MM-DD');
    IF v_last_claimed_date = v_today THEN
      RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED_TODAY');
    END IF;
  END IF;

  -- Idempotency check
  v_idempotency_key := 'daily-gift:' || v_user_id || ':' || v_today;
  SELECT * INTO v_existing_claim FROM wallet_ledger WHERE idempotency_key = v_idempotency_key LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED_TODAY');
  END IF;

  -- Calculate reward
  v_current_streak := COALESCE(v_profile.daily_gift_streak, 0);
  v_new_streak := v_current_streak + 1;
  v_cycle_position := v_current_streak % 7;
  v_reward_coins := CASE v_cycle_position
    WHEN 0 THEN 50 WHEN 1 THEN 75 WHEN 2 THEN 110 WHEN 3 THEN 160
    WHEN 4 THEN 220 WHEN 5 THEN 300 WHEN 6 THEN 500
  END;

  -- Credit coins
  INSERT INTO wallet_ledger (user_id, delta_coins, delta_lives, source, idempotency_key, metadata)
  VALUES (v_user_id, v_reward_coins, 0, 'daily', v_idempotency_key,
    jsonb_build_object('streak', v_new_streak, 'cycle_position', v_cycle_position, 'date', v_today, 'timezone', v_user_timezone));

  -- Update profile: both last_claimed AND last_seen
  UPDATE profiles
  SET coins = COALESCE(coins, 0) + v_reward_coins,
      daily_gift_streak = v_new_streak,
      daily_gift_last_claimed = NOW(),
      daily_gift_last_seen = v_today::date
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'grantedCoins', v_reward_coins, 
    'walletBalance', COALESCE(v_profile.coins, 0) + v_reward_coins, 'streak', v_new_streak);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'SERVER_ERROR');
END;
$function$;