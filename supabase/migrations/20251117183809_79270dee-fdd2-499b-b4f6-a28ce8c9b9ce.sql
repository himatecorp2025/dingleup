-- Recreate regenerate_lives_background function with uniform 12-minute regeneration for all users
CREATE OR REPLACE FUNCTION public.regenerate_lives_background()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_rec RECORD;
  minutes_passed NUMERIC;
  lives_to_add INTEGER;
  regen_rate_minutes NUMERIC := 12; -- All users now have 12 minutes per life
  effective_max_lives INTEGER := 15; -- Standard max lives for all users
BEGIN
  FOR profile_rec IN 
    SELECT * FROM public.profiles 
  LOOP
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
$$;

-- Ensure all users have 12-minute regeneration rate
UPDATE public.profiles
SET lives_regeneration_rate = 12
WHERE lives_regeneration_rate IS NULL OR lives_regeneration_rate != 12;

-- Ensure all users have standard max lives
UPDATE public.profiles
SET max_lives = 15
WHERE max_lives IS NULL OR max_lives != 15;