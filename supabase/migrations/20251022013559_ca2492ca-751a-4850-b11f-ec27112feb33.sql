-- Speed booster configuration and activation
-- Speed packages: 
-- 2x: 60 min, 100 coins + 10 lives (1.67 coins/min, 0.17 lives/min)
-- 4x: 60 min, 250 coins + 25 lives (4.17 coins/min, 0.42 lives/min)
-- 12x: 60 min, 500 coins + 50 lives (8.33 coins/min, 0.83 lives/min)
-- 24x: 60 min, 1000 coins + 100 lives (16.67 coins/min, 1.67 lives/min)

CREATE OR REPLACE FUNCTION public.start_speed_booster(
  p_multiplier integer,
  p_duration_minutes integer DEFAULT 60
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_id uuid := auth.uid();
  v_coins_per_tick integer;
  v_lives_per_tick integer;
  v_tick_interval_seconds integer := 60; -- 1 minute ticks
  v_total_coins integer;
  v_total_lives integer;
  v_expires_at timestamp with time zone;
  v_max_lives integer;
BEGIN
  -- Calculate total rewards based on multiplier
  CASE p_multiplier
    WHEN 2 THEN 
      v_total_coins := 100;
      v_total_lives := 10;
      v_max_lives := 25;
    WHEN 4 THEN 
      v_total_coins := 250;
      v_total_lives := 25;
      v_max_lives := 35;
    WHEN 12 THEN 
      v_total_coins := 500;
      v_total_lives := 50;
      v_max_lives := 75;
    WHEN 24 THEN 
      v_total_coins := 1000;
      v_total_lives := 100;
      v_max_lives := 135;
    ELSE
      RETURN json_build_object('success', false, 'error', 'Invalid multiplier');
  END CASE;

  -- Calculate per-tick amounts (distribute over 60 minutes)
  v_coins_per_tick := CEIL(v_total_coins::numeric / p_duration_minutes);
  v_lives_per_tick := CEIL(v_total_lives::numeric / p_duration_minutes);
  
  v_expires_at := now() + (p_duration_minutes || ' minutes')::interval;

  -- Activate speed booster
  UPDATE profiles
  SET 
    speed_booster_active = true,
    speed_booster_expires_at = v_expires_at,
    speed_booster_multiplier = p_multiplier,
    speed_tick_last_processed_at = now(),
    speed_coins_per_tick = v_coins_per_tick,
    speed_lives_per_tick = v_lives_per_tick,
    speed_tick_interval_seconds = v_tick_interval_seconds,
    max_lives = v_max_lives,
    lives_regeneration_rate = FLOOR(12 / p_multiplier),
    updated_at = now()
  WHERE id = user_id;

  RETURN json_build_object(
    'success', true,
    'multiplier', p_multiplier,
    'expires_at', v_expires_at,
    'coins_per_tick', v_coins_per_tick,
    'lives_per_tick', v_lives_per_tick,
    'total_coins', v_total_coins,
    'total_lives', v_total_lives,
    'max_lives', v_max_lives
  );
END;
$$;

COMMENT ON FUNCTION public.start_speed_booster IS 'Activate speed booster with time-distributed rewards over 60 minutes';

-- Update activate_speed_booster to use the new function
CREATE OR REPLACE FUNCTION public.activate_speed_booster(booster_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_booster RECORD;
  v_multiplier INTEGER;
  v_result json;
BEGIN
  SELECT * INTO v_booster
  FROM public.user_boosters
  WHERE id = booster_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booster not found or not owned by user';
  END IF;

  IF v_booster.activated THEN
    RETURN true;
  END IF;

  -- Extract multiplier from booster type
  CASE v_booster.booster_type
    WHEN 'DoubleSpeed' THEN v_multiplier := 2;
    WHEN 'MegaSpeed' THEN v_multiplier := 4;
    WHEN 'GigaSpeed' THEN v_multiplier := 12;
    WHEN 'DingleSpeed' THEN v_multiplier := 24;
    ELSE RAISE EXCEPTION 'Unknown booster type: %', v_booster.booster_type;
  END CASE;

  -- Start speed booster with time-distributed rewards
  SELECT start_speed_booster(v_multiplier, 60) INTO v_result;

  IF (v_result->>'success')::boolean = false THEN
    RAISE EXCEPTION 'Failed to start speed booster: %', v_result->>'error';
  END IF;

  -- Mark booster as activated
  UPDATE public.user_boosters
  SET activated = true,
      activated_at = now(),
      expires_at = (v_result->>'expires_at')::timestamp with time zone
  WHERE id = booster_id AND user_id = auth.uid();

  RETURN true;
END;
$$;