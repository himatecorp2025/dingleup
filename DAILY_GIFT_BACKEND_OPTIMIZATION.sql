-- DAILY GIFT BACKEND OPTIMIZATION
-- Execute this manually in your Supabase SQL editor
-- NO business logic changes - only performance and concurrency improvements

-- 1. Add composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_source_created
  ON public.wallet_ledger (user_id, source, created_at DESC);

-- 2. Recreate claim_daily_gift() with atomicity and row-level locking
DROP FUNCTION IF EXISTS public.claim_daily_gift() CASCADE;

CREATE FUNCTION public.claim_daily_gift()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_user_timezone text;
  v_current_streak int;
  v_new_streak int;
  v_cycle_position int;
  v_reward_coins int;
  v_now_utc timestamptz;
  v_local_timestamp timestamp;
  v_local_date date;
  v_last_seen_date date;
  v_idempotency_key text;
  v_existing_delta int;
  v_new_coins int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_LOGGED_IN');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROFILE_NOT_FOUND');
  END IF;

  v_user_timezone := COALESCE(v_profile.user_timezone, 'UTC');
  v_now_utc := NOW();
  v_local_timestamp := v_now_utc AT TIME ZONE v_user_timezone;
  v_local_date := CAST(v_local_timestamp AS DATE);

  v_last_seen_date := v_profile.daily_gift_last_seen;
  IF v_last_seen_date IS NOT NULL AND v_last_seen_date = v_local_date THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED_TODAY');
  END IF;

  v_idempotency_key := 'daily-gift:' || v_user_id || ':' || v_local_date;
  SELECT wl.delta_coins INTO v_existing_delta FROM public.wallet_ledger wl WHERE wl.idempotency_key = v_idempotency_key LIMIT 1;
  IF v_existing_delta IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED_TODAY');
  END IF;

  v_current_streak := COALESCE(v_profile.daily_gift_streak, 0);
  v_cycle_position := v_current_streak % 7;
  v_reward_coins := CASE v_cycle_position
    WHEN 0 THEN 50 WHEN 1 THEN 75 WHEN 2 THEN 110 WHEN 3 THEN 160
    WHEN 4 THEN 220 WHEN 5 THEN 300 WHEN 6 THEN 500
  END;
  v_new_streak := v_current_streak + 1;

  INSERT INTO public.wallet_ledger (user_id, delta_coins, delta_lives, source, idempotency_key, metadata)
  VALUES (v_user_id, v_reward_coins, 0, 'daily', v_idempotency_key,
    jsonb_build_object('streak', v_new_streak, 'cycle_position', v_cycle_position, 'date', v_local_date, 'timezone', v_user_timezone));

  v_new_coins := COALESCE(v_profile.coins, 0) + v_reward_coins;
  UPDATE public.profiles SET coins = v_new_coins, daily_gift_streak = v_new_streak, 
    daily_gift_last_claimed = v_now_utc, daily_gift_last_seen = v_local_date WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'grantedCoins', v_reward_coins, 'walletBalance', v_new_coins, 'streak', v_new_streak);

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED_TODAY');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'SERVER_ERROR');
END;
$$;
