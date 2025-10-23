-- Fix regenerate_lives_background to handle Genius users correctly
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
  base_max_lives INTEGER;
BEGIN
  FOR profile_rec IN 
    SELECT * FROM public.profiles 
  LOOP
    -- Determine base values based on subscription
    IF profile_rec.is_subscriber THEN
      base_max_lives := 30;
      regen_rate_minutes := 6;
    ELSE
      base_max_lives := 15;
      regen_rate_minutes := 12;
    END IF;
    
    effective_max_lives := base_max_lives;
    
    -- Apply booster bonuses if active
    IF profile_rec.speed_booster_active THEN
      IF profile_rec.speed_booster_expires_at > now() THEN
        -- Booster overrides regen rate and adds extra lives
        regen_rate_minutes := GREATEST(0.5, 12.0 / profile_rec.speed_booster_multiplier);
        
        CASE profile_rec.speed_booster_multiplier
          WHEN 2 THEN 
            effective_max_lives := base_max_lives + 10;
          WHEN 4 THEN 
            effective_max_lives := base_max_lives + 20;
          WHEN 12 THEN 
            effective_max_lives := base_max_lives + 60;
          WHEN 24 THEN 
            effective_max_lives := base_max_lives + 120;
          ELSE 
            effective_max_lives := base_max_lives;
        END CASE;
      ELSE
        -- Booster expired, deactivate it
        UPDATE public.profiles
        SET speed_booster_active = false,
            speed_booster_expires_at = null,
            speed_booster_multiplier = 1,
            max_lives = base_max_lives,
            lives_regeneration_rate = CASE WHEN is_subscriber THEN 6 ELSE 12 END
        WHERE id = profile_rec.id;
      END IF;
    END IF;
    
    -- Regenerate lives if below max
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