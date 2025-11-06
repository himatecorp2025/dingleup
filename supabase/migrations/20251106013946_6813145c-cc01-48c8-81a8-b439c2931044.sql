-- Drop existing function first
DROP FUNCTION IF EXISTS claim_daily_gift();

-- Create new claim_daily_gift RPC function with correct return type
CREATE OR REPLACE FUNCTION claim_daily_gift()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_is_subscriber boolean;
  v_current_streak integer;
  v_last_claimed timestamptz;
  v_base_reward integer;
  v_granted_coins integer;
  v_new_balance integer;
  v_now timestamptz := now();
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized'
    );
  END IF;

  -- Get user profile data
  SELECT 
    COALESCE(is_subscribed, false),
    COALESCE(daily_gift_streak, 0),
    daily_gift_last_claimed
  INTO v_is_subscriber, v_current_streak, v_last_claimed
  FROM profiles
  WHERE id = v_user_id;

  -- Check if already claimed today (server timezone)
  IF v_last_claimed IS NOT NULL AND 
     DATE(v_last_claimed) = DATE(v_now) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Már átvettél ma ajándékot'
    );
  END IF;

  -- Calculate base reward (cycles through 7 days)
  v_base_reward := CASE (v_current_streak % 7)
    WHEN 0 THEN 50
    WHEN 1 THEN 75
    WHEN 2 THEN 110
    WHEN 3 THEN 160
    WHEN 4 THEN 220
    WHEN 5 THEN 300
    WHEN 6 THEN 500
  END;

  -- Double for Genius subscribers
  v_granted_coins := CASE 
    WHEN v_is_subscriber THEN v_base_reward * 2
    ELSE v_base_reward
  END;

  -- Update profile: add coins, increment streak, set last claimed
  UPDATE profiles
  SET 
    coins = coins + v_granted_coins,
    daily_gift_streak = v_current_streak + 1,
    daily_gift_last_claimed = v_now
  WHERE id = v_user_id
  RETURNING coins INTO v_new_balance;

  -- Log transaction in wallet_ledger
  INSERT INTO wallet_ledger (user_id, delta_coins, delta_lives, source, idempotency_key, metadata)
  VALUES (
    v_user_id, 
    v_granted_coins,
    0,
    'daily_gift', 
    'daily_gift:' || v_user_id::text || ':' || DATE(v_now)::text,
    jsonb_build_object('day', v_current_streak + 1, 'base_reward', v_base_reward)
  );

  RETURN jsonb_build_object(
    'success', true,
    'isSubscriber', v_is_subscriber,
    'baseCoins', v_base_reward,
    'grantedCoins', v_granted_coins,
    'walletBalance', v_new_balance,
    'streak', v_current_streak + 1
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;