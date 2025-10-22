-- Fix Speed booster values - NO COINS, only lives as specified
-- Speed packages (Free player, 60 min):
-- DoubleSpeed 2x: 10 lives total, +10 max lives stacking
-- MegaSpeed 4x: 20 lives total, +20 max lives stacking
-- GigaSpeed 12x: 60 lives total, +60 max lives stacking
-- DingleSpeed 24x: 120 lives total, +120 max lives stacking

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
  v_lives_per_tick numeric;
  v_tick_interval_seconds integer := 60; -- 1 minute ticks
  v_total_lives integer;
  v_expires_at timestamp with time zone;
  v_max_lives_increase integer;
  v_current_max_lives integer;
  v_new_max_lives integer;
BEGIN
  -- Get current max_lives
  SELECT COALESCE(max_lives, 15) INTO v_current_max_lives
  FROM profiles
  WHERE id = user_id;

  -- Calculate total rewards based on multiplier (Free player values)
  CASE p_multiplier
    WHEN 2 THEN 
      v_total_lives := 10;
      v_max_lives_increase := 10;
    WHEN 4 THEN 
      v_total_lives := 20;
      v_max_lives_increase := 20;
    WHEN 12 THEN 
      v_total_lives := 60;
      v_max_lives_increase := 60;
    WHEN 24 THEN 
      v_total_lives := 120;
      v_max_lives_increase := 120;
    ELSE
      RETURN json_build_object('success', false, 'error', 'Invalid multiplier');
  END CASE;

  -- Calculate per-tick amounts (distribute over 60 minutes, decimal precision)
  v_lives_per_tick := v_total_lives::numeric / p_duration_minutes;
  
  v_expires_at := now() + (p_duration_minutes || ' minutes')::interval;
  v_new_max_lives := v_current_max_lives + v_max_lives_increase;

  -- Activate speed booster (NO COINS)
  UPDATE profiles
  SET 
    speed_booster_active = true,
    speed_booster_expires_at = v_expires_at,
    speed_booster_multiplier = p_multiplier,
    speed_tick_last_processed_at = now(),
    speed_coins_per_tick = 0, -- NO COINS
    speed_lives_per_tick = v_lives_per_tick,
    speed_tick_interval_seconds = v_tick_interval_seconds,
    max_lives = v_new_max_lives,
    lives_regeneration_rate = FLOOR(12 / p_multiplier),
    updated_at = now()
  WHERE id = user_id;

  RETURN json_build_object(
    'success', true,
    'multiplier', p_multiplier,
    'expires_at', v_expires_at,
    'lives_per_tick', v_lives_per_tick,
    'total_lives', v_total_lives,
    'max_lives', v_new_max_lives
  );
END;
$$;

COMMENT ON FUNCTION public.start_speed_booster IS 'Activate speed booster with time-distributed life rewards (NO COINS) over 60 minutes';