-- =====================================================
-- SECURITY FIX: Add RLS policies for friend_requests view and friendships table
-- =====================================================

-- Enable RLS on friendships table (if not already enabled)
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can update their friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;

-- SELECT: Users can view friendships where they are involved
CREATE POLICY "Users can view their friendships"
ON public.friendships
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id_a OR auth.uid() = user_id_b
);

-- INSERT: Users can create friendships where they are involved
CREATE POLICY "Users can create friendships"
ON public.friendships
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id_a OR auth.uid() = user_id_b
);

-- UPDATE: Users can update friendships where they are involved
CREATE POLICY "Users can update their friendships"
ON public.friendships
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id_a OR auth.uid() = user_id_b)
WITH CHECK (auth.uid() = user_id_a OR auth.uid() = user_id_b);

-- DELETE: Users can delete friendships where they are involved
CREATE POLICY "Users can delete their friendships"
ON public.friendships
FOR DELETE
TO authenticated
USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);

-- =====================================================
-- SECURITY FIX: Fix all SECURITY DEFINER functions to have immutable search_path
-- =====================================================

-- Fix: has_role function (already has SET search_path, but ensure it's correct)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Fix: regenerate_lives_background
CREATE OR REPLACE FUNCTION public.regenerate_lives_background()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  profile_rec RECORD;
  minutes_passed NUMERIC;
  lives_to_add INTEGER;
  regen_rate_minutes NUMERIC;
  effective_max_lives INTEGER;
BEGIN
  FOR profile_rec IN 
    SELECT * FROM public.profiles 
  LOOP
    IF profile_rec.speed_booster_active THEN
      IF profile_rec.speed_booster_expires_at > now() THEN
        CASE profile_rec.speed_booster_multiplier
          WHEN 2 THEN 
            regen_rate_minutes := 6;
            effective_max_lives := 25;
          WHEN 4 THEN 
            regen_rate_minutes := 3;
            effective_max_lives := 35;
          WHEN 12 THEN 
            regen_rate_minutes := 1;
            effective_max_lives := 75;
          WHEN 24 THEN 
            regen_rate_minutes := 0.5;
            effective_max_lives := 135;
          ELSE 
            regen_rate_minutes := 12;
            effective_max_lives := 15;
        END CASE;
      ELSE
        UPDATE public.profiles
        SET speed_booster_active = false,
            speed_booster_expires_at = null,
            speed_booster_multiplier = 1,
            max_lives = 15,
            lives_regeneration_rate = 12
        WHERE id = profile_rec.id;
        
        regen_rate_minutes := 12;
        effective_max_lives := 15;
      END IF;
    ELSE
      regen_rate_minutes := 12;
      effective_max_lives := 15;
    END IF;
    
    IF profile_rec.lives < effective_max_lives THEN
      minutes_passed := EXTRACT(EPOCH FROM (NOW() - profile_rec.last_life_regeneration)) / 60;
      lives_to_add := FLOOR(minutes_passed / regen_rate_minutes)::INTEGER;
      
      IF lives_to_add > 0 THEN
        UPDATE public.profiles
        SET 
          lives = LEAST(lives + lives_to_add, effective_max_lives),
          last_life_regeneration = last_life_regeneration + (lives_to_add * regen_rate_minutes * INTERVAL '1 minute')
        WHERE id = profile_rec.id;
      END IF;
    END IF;
  END LOOP;
END;
$function$;

-- Fix: credit_wallet
CREATE OR REPLACE FUNCTION public.credit_wallet(p_user_id uuid, p_delta_coins integer, p_delta_lives integer, p_source text, p_idempotency_key text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_current_coins integer;
  v_current_lives integer;
  v_max_lives integer;
  v_new_lives integer;
BEGIN
  IF EXISTS (SELECT 1 FROM public.wallet_ledger WHERE idempotency_key = p_idempotency_key) THEN
    RETURN json_build_object('success', true, 'already_processed', true);
  END IF;

  SELECT coins, lives, max_lives INTO v_current_coins, v_current_lives, v_max_lives
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  IF (v_current_coins + p_delta_coins) < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient coins');
  END IF;
  
  IF (v_current_lives + p_delta_lives) < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient lives');
  END IF;

  v_new_lives := v_current_lives + p_delta_lives;

  INSERT INTO public.wallet_ledger (
    user_id, delta_coins, delta_lives, source, idempotency_key, metadata
  ) VALUES (
    p_user_id, p_delta_coins, p_delta_lives, p_source, p_idempotency_key, p_metadata
  );

  UPDATE public.profiles
  SET 
    coins = coins + p_delta_coins,
    lives = v_new_lives,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'new_coins', v_current_coins + p_delta_coins,
    'new_lives', v_new_lives
  );
END;
$function$;

-- Fix: activate_speed_booster
CREATE OR REPLACE FUNCTION public.activate_speed_booster(booster_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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

  CASE v_booster.booster_type
    WHEN 'DoubleSpeed' THEN v_multiplier := 2;
    WHEN 'MegaSpeed' THEN v_multiplier := 4;
    WHEN 'GigaSpeed' THEN v_multiplier := 12;
    WHEN 'DingleSpeed' THEN v_multiplier := 24;
    ELSE RAISE EXCEPTION 'Unknown booster type: %', v_booster.booster_type;
  END CASE;

  SELECT public.start_speed_booster(v_multiplier, 60) INTO v_result;

  IF (v_result->>'success')::boolean = false THEN
    RAISE EXCEPTION 'Failed to start speed booster: %', v_result->>'error';
  END IF;

  UPDATE public.user_boosters
  SET activated = true,
      activated_at = now(),
      expires_at = (v_result->>'expires_at')::timestamp with time zone
  WHERE id = booster_id AND user_id = auth.uid();

  RETURN true;
END;
$function$;

-- Fix: start_speed_booster
CREATE OR REPLACE FUNCTION public.start_speed_booster(p_multiplier integer, p_duration_minutes integer DEFAULT 60)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_id uuid := auth.uid();
  v_lives_per_tick numeric;
  v_tick_interval_seconds integer := 60;
  v_total_lives integer;
  v_expires_at timestamp with time zone;
  v_max_lives_increase integer;
  v_current_max_lives integer;
  v_new_max_lives integer;
BEGIN
  SELECT COALESCE(max_lives, 15) INTO v_current_max_lives
  FROM public.profiles
  WHERE id = user_id;

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

  v_lives_per_tick := v_total_lives::numeric / p_duration_minutes;
  v_expires_at := now() + (p_duration_minutes || ' minutes')::interval;
  v_new_max_lives := v_current_max_lives + v_max_lives_increase;

  UPDATE public.profiles
  SET 
    speed_booster_active = true,
    speed_booster_expires_at = v_expires_at,
    speed_booster_multiplier = p_multiplier,
    speed_tick_last_processed_at = now(),
    speed_coins_per_tick = 0,
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
$function$;

-- Fix remaining SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.archive_thread_for_user(p_thread_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_thread RECORD;
  v_user_id uuid := auth.uid();
BEGIN
  SELECT * INTO v_thread
  FROM public.dm_threads
  WHERE id = p_thread_id
    AND (user_id_a = v_user_id OR user_id_b = v_user_id);

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Thread not found');
  END IF;

  IF v_thread.user_id_a = v_user_id THEN
    UPDATE public.dm_threads
    SET archived_by_user_a = true
    WHERE id = p_thread_id;
  ELSIF v_thread.user_id_b = v_user_id THEN
    UPDATE public.dm_threads
    SET archived_by_user_b = true
    WHERE id = p_thread_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_next_life_at(p_user_id uuid)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_last_regen timestamp with time zone;
  v_regen_rate integer;
  v_lives integer;
  v_max_lives integer;
  v_next_life_at timestamp with time zone;
BEGIN
  SELECT last_life_regeneration, lives_regeneration_rate, lives, max_lives
  INTO v_last_regen, v_regen_rate, v_lives, v_max_lives
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND OR v_lives >= v_max_lives THEN
    RETURN NULL;
  END IF;

  v_next_life_at := v_last_regen + (v_regen_rate * INTERVAL '1 minute');
  
  RETURN v_next_life_at;
END;
$function$;