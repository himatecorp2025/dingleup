-- Fix use_life() to preserve bonus lives above max_lives
CREATE OR REPLACE FUNCTION public.use_life()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
BEGIN
  v_user_id := auth.uid();
  v_now := NOW();
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Lock and fetch user profile
  SELECT 
    COALESCE(lives, 0),
    COALESCE(max_lives, 15),
    COALESCE(last_life_regeneration, v_now),
    COALESCE(lives_regeneration_rate, 12)
  INTO v_current_lives, v_max_lives, v_last_regen, v_regen_rate
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;
  
  -- Normalize future timestamps
  IF v_last_regen > v_now THEN
    v_last_regen := v_now;
  END IF;
  
  -- CRITICAL FIX: Only regenerate if below max_lives, preserve bonus lives above max
  IF v_current_lives < v_max_lives THEN
    -- Calculate regenerated lives
    v_minutes_passed := GREATEST(0, EXTRACT(EPOCH FROM (v_now - v_last_regen)) / 60);
    v_lives_to_add := FLOOR(v_minutes_passed / v_regen_rate)::INTEGER;
    v_updated_lives := LEAST(v_current_lives + v_lives_to_add, v_max_lives);
  ELSE
    -- Above max_lives (bonus lives) - preserve them, no regeneration
    v_updated_lives := v_current_lives;
  END IF;
  
  -- Check if user has at least 1 life
  IF v_updated_lives < 1 THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct 1 life
  UPDATE public.profiles
  SET 
    lives = v_updated_lives - 1,
    last_life_regeneration = v_now
  WHERE id = v_user_id;
  
  -- Log to wallet_ledger
  INSERT INTO public.wallet_ledger (user_id, delta_coins, delta_lives, source, metadata)
  VALUES (
    v_user_id,
    0,
    -1,
    'game_start',
    jsonb_build_object('timestamp', v_now)
  );
  
  RETURN TRUE;
END;
$function$;