-- Fix regenerate_lives() function to handle future timestamps
CREATE OR REPLACE FUNCTION public.regenerate_lives()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_profile RECORD;
  minutes_passed NUMERIC;
  lives_to_add INTEGER;
  regen_rate_minutes NUMERIC := 12;
  current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();
  IF NOT FOUND THEN RETURN; END IF;
  
  -- Guard: if last_life_regeneration is in the future, normalize it to now
  IF user_profile.last_life_regeneration > current_time THEN
    UPDATE profiles
    SET last_life_regeneration = current_time
    WHERE id = auth.uid();
    user_profile.last_life_regeneration := current_time;
  END IF;
  
  minutes_passed := EXTRACT(EPOCH FROM (current_time - user_profile.last_life_regeneration)) / 60;
  -- Ensure minutes_passed is never negative
  IF minutes_passed < 0 THEN
    minutes_passed := 0;
  END IF;
  
  lives_to_add := FLOOR(minutes_passed / regen_rate_minutes)::INTEGER;
  
  IF lives_to_add > 0 AND user_profile.lives < user_profile.max_lives THEN
    UPDATE profiles
    SET 
      lives = LEAST(lives + lives_to_add, max_lives),
      last_life_regeneration = last_life_regeneration + (lives_to_add * regen_rate_minutes * INTERVAL '1 minute')
    WHERE id = auth.uid();
  END IF;
END;
$$;

-- Fix regenerate_lives_background() function to handle future timestamps
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
  regen_rate_minutes NUMERIC := 12;
  effective_max_lives INTEGER := 15;
  current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  FOR profile_rec IN 
    SELECT * FROM public.profiles 
  LOOP
    -- Guard: if last_life_regeneration is in the future, normalize it to now
    IF profile_rec.last_life_regeneration > current_time THEN
      UPDATE public.profiles
      SET last_life_regeneration = current_time
      WHERE id = profile_rec.id;
      profile_rec.last_life_regeneration := current_time;
    END IF;
    
    -- Regenerate lives if below max
    IF profile_rec.lives < effective_max_lives THEN
      minutes_passed := EXTRACT(EPOCH FROM (current_time - profile_rec.last_life_regeneration)) / 60;
      
      -- Ensure minutes_passed is never negative
      IF minutes_passed < 0 THEN
        minutes_passed := 0;
      END IF;
      
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