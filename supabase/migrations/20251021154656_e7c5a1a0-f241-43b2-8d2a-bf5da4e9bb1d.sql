-- Segítségek visszaállítása játék kezdetekor
CREATE OR REPLACE FUNCTION public.reset_game_helps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles
  SET 
    help_50_50_active = true,
    help_2x_answer_active = true,
    help_audience_active = true
  WHERE id = auth.uid();
END;
$$;

-- Fix booster activation to set correct max_lives from start
CREATE OR REPLACE FUNCTION public.activate_speed_booster(booster_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_booster RECORD;
  v_multiplier INTEGER;
  v_max_lives INTEGER;
  v_expires_at TIMESTAMPTZ := now() + interval '60 minutes';
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
    WHEN 'DoubleSpeed' THEN v_multiplier := 2; v_max_lives := 25;
    WHEN 'MegaSpeed'   THEN v_multiplier := 4; v_max_lives := 35;
    WHEN 'GigaSpeed'   THEN v_multiplier := 12; v_max_lives := 75;
    WHEN 'DingleSpeed' THEN v_multiplier := 24; v_max_lives := 135;
    ELSE RAISE EXCEPTION 'Unknown booster type: %', v_booster.booster_type;
  END CASE;

  UPDATE public.user_boosters
  SET activated = true,
      activated_at = now(),
      expires_at = v_expires_at
  WHERE id = booster_id AND user_id = auth.uid();

  UPDATE public.profiles
  SET speed_booster_active = true,
      speed_booster_expires_at = v_expires_at,
      speed_booster_multiplier = v_multiplier,
      max_lives = v_max_lives,
      lives_regeneration_rate = CASE v_multiplier
        WHEN 2 THEN 6
        WHEN 4 THEN 3
        WHEN 12 THEN 1
        WHEN 24 THEN 1  -- 0.5 is handled in background function
        ELSE 12
      END,
      updated_at = now()
  WHERE id = auth.uid();

  RETURN true;
END;
$$;

-- Fix regenerate_lives_background to handle booster expiration correctly
CREATE OR REPLACE FUNCTION public.regenerate_lives_background()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_rec RECORD;
  minutes_passed NUMERIC;
  lives_to_add INTEGER;
  regen_rate_minutes NUMERIC;
  effective_max_lives INTEGER;
BEGIN
  FOR profile_rec IN 
    SELECT * FROM profiles 
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
        -- Booster expired, reset to defaults
        UPDATE profiles
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
        UPDATE profiles
        SET 
          lives = LEAST(lives + lives_to_add, effective_max_lives),
          last_life_regeneration = last_life_regeneration + (lives_to_add * regen_rate_minutes * INTERVAL '1 minute')
        WHERE id = profile_rec.id;
      END IF;
    END IF;
  END LOOP;
END;
$$;