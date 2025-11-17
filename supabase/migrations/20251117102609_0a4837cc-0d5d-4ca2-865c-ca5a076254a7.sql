-- Drop dependent objects first
DROP POLICY IF EXISTS "Genius subscribers can view active videos" ON public.tips_tricks_videos;
DROP POLICY IF EXISTS "Genius members can view videos" ON storage.objects;
DROP MATERIALIZED VIEW IF EXISTS internal.admin_stats_summary;

-- Remove Genius subscription related columns from profiles table
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS is_subscriber CASCADE,
  DROP COLUMN IF EXISTS is_subscribed CASCADE,
  DROP COLUMN IF EXISTS subscriber_since CASCADE,
  DROP COLUMN IF EXISTS subscriber_renew_at CASCADE,
  DROP COLUMN IF EXISTS subscriber_type CASCADE,
  DROP COLUMN IF EXISTS subscription_tier CASCADE,
  DROP COLUMN IF EXISTS sub_promo_last_shown CASCADE,
  DROP COLUMN IF EXISTS speed_booster_active CASCADE,
  DROP COLUMN IF EXISTS speed_booster_expires_at CASCADE,
  DROP COLUMN IF EXISTS speed_booster_multiplier CASCADE,
  DROP COLUMN IF EXISTS speed_coins_per_tick CASCADE,
  DROP COLUMN IF EXISTS speed_lives_per_tick CASCADE,
  DROP COLUMN IF EXISTS speed_tick_interval_seconds CASCADE,
  DROP COLUMN IF EXISTS speed_tick_last_processed_at CASCADE;

-- Remove Genius-related columns from other tables
ALTER TABLE public.device_geo_analytics DROP COLUMN IF EXISTS is_genius_user CASCADE;
ALTER TABLE public.error_logs DROP COLUMN IF EXISTS is_genius_user CASCADE;
ALTER TABLE public.game_question_analytics DROP COLUMN IF EXISTS is_genius_user CASCADE;
ALTER TABLE public.session_details DROP COLUMN IF EXISTS is_genius CASCADE;
ALTER TABLE public.bonus_claim_events DROP COLUMN IF EXISTS is_subscriber CASCADE;

-- Remove Genius-specific functions
DROP FUNCTION IF EXISTS public.regenerate_lives_for_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.regenerate_lives_background() CASCADE;
DROP FUNCTION IF EXISTS public.start_speed_booster(integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.activate_speed_booster(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.claim_daily_gift() CASCADE;

-- Recreate simplified claim_daily_gift without Genius logic
CREATE OR REPLACE FUNCTION public.claim_daily_gift()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_current_streak integer;
  v_last_claimed timestamptz;
  v_granted_coins integer;
  v_new_balance integer;
  v_now timestamptz := now();
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT 
    COALESCE(daily_gift_streak, 0),
    daily_gift_last_claimed
  INTO v_current_streak, v_last_claimed
  FROM profiles
  WHERE id = v_user_id;

  IF v_last_claimed IS NOT NULL AND DATE(v_last_claimed) = DATE(v_now) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Már átvettél ma ajándékot');
  END IF;

  -- Calculate base reward (cycles through 7 days)
  v_granted_coins := CASE (v_current_streak % 7)
    WHEN 0 THEN 50
    WHEN 1 THEN 75
    WHEN 2 THEN 110
    WHEN 3 THEN 160
    WHEN 4 THEN 220
    WHEN 5 THEN 300
    WHEN 6 THEN 500
  END;

  UPDATE profiles
  SET 
    coins = coins + v_granted_coins,
    daily_gift_streak = v_current_streak + 1,
    daily_gift_last_claimed = v_now
  WHERE id = v_user_id
  RETURNING coins INTO v_new_balance;

  INSERT INTO wallet_ledger (user_id, amount, transaction_type, description)
  VALUES (v_user_id, v_granted_coins, 'daily_gift', 'Napi ajándék (' || (v_current_streak + 1) || '. nap)');

  RETURN jsonb_build_object(
    'success', true,
    'grantedCoins', v_granted_coins,
    'walletBalance', v_new_balance,
    'streak', v_current_streak + 1
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Recreate simplified regenerate_lives without Genius logic
CREATE OR REPLACE FUNCTION public.regenerate_lives()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile RECORD;
  minutes_passed NUMERIC;
  lives_to_add INTEGER;
  regen_rate_minutes NUMERIC := 12;
BEGIN
  SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();
  IF NOT FOUND THEN RETURN; END IF;
  
  minutes_passed := EXTRACT(EPOCH FROM (NOW() - user_profile.last_life_regeneration)) / 60;
  lives_to_add := FLOOR(minutes_passed / regen_rate_minutes)::INTEGER;
  
  IF lives_to_add > 0 THEN
    UPDATE profiles
    SET 
      lives = LEAST(lives + lives_to_add, max_lives),
      last_life_regeneration = last_life_regeneration + (lives_to_add * regen_rate_minutes * INTERVAL '1 minute')
    WHERE id = auth.uid();
  END IF;
END;
$$;