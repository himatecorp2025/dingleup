-- Fix the COALESCE type conversion error in regenerate_lives_background
-- The issue is that last_life_regeneration might have incorrect type constraint

-- First, check and fix the column type if needed
DO $$ 
BEGIN
  -- Ensure last_life_regeneration is TIMESTAMP WITH TIME ZONE
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_life_regeneration'
    AND data_type != 'timestamp with time zone'
  ) THEN
    ALTER TABLE public.profiles 
    ALTER COLUMN last_life_regeneration TYPE TIMESTAMP WITH TIME ZONE 
    USING last_life_regeneration::TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Recreate the function with better error handling
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
  current_time TIMESTAMP WITH TIME ZONE := NOW();
  last_regen_ts TIMESTAMP WITH TIME ZONE;
BEGIN
  FOR profile_rec IN 
    SELECT id, lives, max_lives, lives_regeneration_rate, last_life_regeneration
    FROM public.profiles 
  LOOP
    effective_max_lives := COALESCE(profile_rec.max_lives, 15);
    regen_rate_minutes := COALESCE(profile_rec.lives_regeneration_rate, 12);
    
    -- Safe handling of last_life_regeneration with explicit type check
    BEGIN
      IF profile_rec.last_life_regeneration IS NULL THEN
        last_regen_ts := current_time;
      ELSE
        -- Direct assignment without COALESCE to avoid type confusion
        last_regen_ts := profile_rec.last_life_regeneration;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Fallback to current time on any conversion error
      last_regen_ts := current_time;
    END;
    
    -- Guard: if last_life_regeneration is in the future, normalize it to now
    IF last_regen_ts > current_time THEN
      UPDATE public.profiles
      SET last_life_regeneration = current_time
      WHERE id = profile_rec.id;
      last_regen_ts := current_time;
    END IF;
    
    -- Regenerate lives if below max
    IF profile_rec.lives < effective_max_lives THEN
      -- Calculate minutes passed (ensure non-negative)
      minutes_passed := GREATEST(0, EXTRACT(EPOCH FROM (current_time - last_regen_ts)) / 60);
      
      lives_to_add := FLOOR(minutes_passed / regen_rate_minutes)::INTEGER;
      
      IF lives_to_add > 0 THEN
        UPDATE public.profiles
        SET 
          lives = LEAST(lives + lives_to_add, effective_max_lives),
          last_life_regeneration = last_regen_ts + (lives_to_add * regen_rate_minutes * INTERVAL '1 minute')
        WHERE id = profile_rec.id;
      END IF;
    END IF;
  END LOOP;
END;
$function$;