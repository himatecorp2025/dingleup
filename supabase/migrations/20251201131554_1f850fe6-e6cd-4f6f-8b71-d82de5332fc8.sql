-- PHASE 2: RPC FUNCTIONS ALIGNMENT - Fix use_life() and claim_welcome_bonus()

-- ============================================================
-- 1. use_life() - Add speed boost support and wallet_ledger logging
-- ============================================================
CREATE OR REPLACE FUNCTION public.use_life()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id UUID;
  v_current_lives INTEGER;
  v_max_lives INTEGER;
  v_last_regen TIMESTAMPTZ;
  v_regen_rate INTEGER;
  v_now TIMESTAMPTZ;
  v_minutes_passed NUMERIC;
  v_lives_to_add INTEGER;
  v_updated_lives INTEGER;
  v_idempotency_key TEXT;
  v_active_speed_expires TIMESTAMPTZ;
  v_has_active_speed BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  v_now := NOW();
  v_idempotency_key := 'game_start:' || v_user_id::text || ':' || extract(epoch from v_now)::text;
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Lock and fetch user profile WITH speed token check
  SELECT 
    COALESCE(lives, 0),
    COALESCE(max_lives, 15),
    COALESCE(last_life_regeneration, v_now),
    COALESCE(lives_regeneration_rate, 12),
    active_speed_expires_at
  INTO v_current_lives, v_max_lives, v_last_regen, v_regen_rate, v_active_speed_expires
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;
  
  -- Normalize future timestamps (CRITICAL guard)
  IF v_last_regen > v_now THEN
    v_last_regen := v_now;
    UPDATE public.profiles SET last_life_regeneration = v_now WHERE id = v_user_id;
  END IF;
  
  -- Check if speed boost is active
  v_has_active_speed := (v_active_speed_expires IS NOT NULL AND v_active_speed_expires > v_now);
  
  -- Apply speed boost: 2x faster regeneration (half the time)
  IF v_has_active_speed THEN
    v_regen_rate := v_regen_rate / 2;
  END IF;
  
  -- CRITICAL: Only regenerate if below max_lives, preserve bonus lives above max
  IF v_current_lives < v_max_lives THEN
    -- Calculate regenerated lives with speed boost applied
    v_minutes_passed := GREATEST(0, EXTRACT(EPOCH FROM (v_now - v_last_regen)) / 60);
    v_lives_to_add := FLOOR(v_minutes_passed / v_regen_rate)::INTEGER;
    v_updated_lives := LEAST(v_current_lives + v_lives_to_add, v_max_lives);
  ELSE
    -- Above max_lives (bonus lives) - preserve them, no regeneration
    v_updated_lives := v_current_lives;
  END IF;
  
  -- Check if user has at least 1 life after regeneration
  IF v_updated_lives < 1 THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct 1 life
  UPDATE public.profiles
  SET 
    lives = v_updated_lives - 1,
    last_life_regeneration = v_now
  WHERE id = v_user_id;
  
  -- Log to wallet_ledger (NOT lives_ledger) with idempotency_key
  INSERT INTO public.wallet_ledger (user_id, delta_coins, delta_lives, source, idempotency_key, metadata)
  VALUES (
    v_user_id,
    0,
    -1,
    'game_start',
    v_idempotency_key,
    jsonb_build_object('timestamp', v_now, 'speed_boost_active', v_has_active_speed)
  )
  ON CONFLICT (idempotency_key) DO NOTHING;
  
  RETURN TRUE;
END;
$function$;

-- ============================================================
-- 2. claim_welcome_bonus() - Use credit_wallet() for atomic operation
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_welcome_bonus()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid;
  v_already_claimed BOOLEAN;
  v_credit_result jsonb;
  v_idempotency_key text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'NOT_LOGGED_IN');
  END IF;

  -- Check if already claimed
  SELECT COALESCE(welcome_bonus_claimed, false)
  INTO v_already_claimed
  FROM profiles 
  WHERE id = v_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'PROFILE_NOT_FOUND');
  END IF;
  
  IF v_already_claimed THEN
    RETURN json_build_object('success', false, 'error', 'ALREADY_CLAIMED');
  END IF;

  -- Build idempotency key for credit_wallet
  v_idempotency_key := 'welcome_bonus:' || v_user_id::text;

  -- Use credit_wallet() for atomic, idempotent crediting (+2500 coins, +50 lives)
  SELECT public.credit_wallet(
    v_user_id,
    2500,  -- delta_coins
    50,    -- delta_lives
    'welcome',
    v_idempotency_key,
    jsonb_build_object('bonus_type', 'welcome')
  ) INTO v_credit_result;

  -- Check if credit was successful
  IF NOT (v_credit_result->>'success')::boolean THEN
    RETURN json_build_object('success', false, 'error', 'CREDIT_FAILED');
  END IF;

  -- Mark welcome bonus as claimed
  UPDATE profiles
  SET 
    welcome_bonus_claimed = true,
    updated_at = now()
  WHERE id = v_user_id;

  -- Return success with new balances from credit_wallet result
  RETURN json_build_object(
    'success', true, 
    'coins', 2500, 
    'lives', 50,
    'new_coins', (v_credit_result->'new_coins')::integer,
    'new_lives', (v_credit_result->'new_lives')::integer
  );
END;
$function$;

COMMENT ON FUNCTION public.use_life IS 'Atomic life spending with speed boost support and inline regeneration (with future timestamp guard). Logs to wallet_ledger for unified audit trail.';
COMMENT ON FUNCTION public.claim_welcome_bonus IS 'Welcome bonus claim (+2500 coins, +50 lives) using credit_wallet() for atomic transactional safety and idempotency.';