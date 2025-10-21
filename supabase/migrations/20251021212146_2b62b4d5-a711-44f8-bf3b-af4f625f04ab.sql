-- Update regenerate_lives_background to use correct minutes-based regeneration
CREATE OR REPLACE FUNCTION public.regenerate_lives_background()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    -- Determine regeneration rate and max lives based on active booster
    IF profile_rec.speed_booster_active THEN
      IF profile_rec.speed_booster_expires_at > now() THEN
        CASE profile_rec.speed_booster_multiplier
          WHEN 2 THEN 
            regen_rate_minutes := 6;     -- DoubleSpeed: 6 minutes per life
            effective_max_lives := 25;   -- 15 base + 10 extra
          WHEN 4 THEN 
            regen_rate_minutes := 3;     -- MegaSpeed: 3 minutes per life
            effective_max_lives := 35;   -- 15 base + 20 extra
          WHEN 12 THEN 
            regen_rate_minutes := 1;     -- GigaSpeed: 1 minute per life
            effective_max_lives := 75;   -- 15 base + 60 extra
          WHEN 24 THEN 
            regen_rate_minutes := 0.5;   -- DingleSpeed: 30 seconds per life
            effective_max_lives := 135;  -- 15 base + 120 extra
          ELSE 
            regen_rate_minutes := 12;    -- Default: 12 minutes per life
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
      -- No active booster
      regen_rate_minutes := 12;
      effective_max_lives := 15;
    END IF;
    
    -- Only regenerate if below max lives
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
$function$;