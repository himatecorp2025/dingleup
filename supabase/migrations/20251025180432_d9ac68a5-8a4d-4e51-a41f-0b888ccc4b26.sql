-- Fix regenerate_lives to work in MINUTES instead of HOURS
-- This aligns with the correct spec: 12 minutes for normal users, 6 minutes for Genius users

CREATE OR REPLACE FUNCTION public.regenerate_lives()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile RECORD;
  minutes_passed NUMERIC;
  lives_to_add INTEGER;
  regen_rate_minutes NUMERIC;
BEGIN
  SELECT * INTO user_profile
  FROM profiles
  WHERE id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Use lives_regeneration_rate which is now in MINUTES (12 for normal, 6 for Genius)
  regen_rate_minutes := COALESCE(user_profile.lives_regeneration_rate, 12);
  
  -- Calculate minutes passed since last regeneration
  minutes_passed := EXTRACT(EPOCH FROM (NOW() - user_profile.last_life_regeneration)) / 60;
  
  -- Calculate how many lives to add based on minutes
  lives_to_add := FLOOR(minutes_passed / regen_rate_minutes)::INTEGER;
  
  IF lives_to_add > 0 THEN
    UPDATE profiles
    SET 
      lives = LEAST(lives + lives_to_add, max_lives),
      last_life_regeneration = last_life_regeneration + (lives_to_add * regen_rate_minutes * INTERVAL '1 minute')
    WHERE id = auth.uid();
  END IF;
END;
$$;