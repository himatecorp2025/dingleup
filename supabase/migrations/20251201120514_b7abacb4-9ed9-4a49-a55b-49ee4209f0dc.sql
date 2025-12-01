-- PHASE 2 OPTIMIZATION: Optimized regenerate_lives_background() using denormalized speed token
-- This eliminates the EXISTS subquery that was causing slowdowns

CREATE OR REPLACE FUNCTION public.regenerate_lives_background()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_rec RECORD;
  minutes_passed NUMERIC;
  lives_to_add INTEGER;
  regen_rate_minutes NUMERIC;
  effective_max_lives INTEGER;
  current_time TIMESTAMP WITH TIME ZONE := NOW();
  last_regen_ts TIMESTAMP WITH TIME ZONE;
  has_active_speed BOOLEAN;
BEGIN
  FOR profile_rec IN 
    SELECT id, lives, max_lives, lives_regeneration_rate, last_life_regeneration, active_speed_expires_at
    FROM public.profiles 
  LOOP
    effective_max_lives := COALESCE(profile_rec.max_lives, 15);
    regen_rate_minutes := COALESCE(profile_rec.lives_regeneration_rate, 12);
    
    -- OPTIMIZATION: Check active speed from denormalized column (NO subquery!)
    has_active_speed := (profile_rec.active_speed_expires_at IS NOT NULL 
                         AND profile_rec.active_speed_expires_at > current_time);
    
    -- Apply speed boost: 2x faster (half the time)
    IF has_active_speed THEN
      regen_rate_minutes := regen_rate_minutes / 2;
    END IF;
    
    -- Proper type handling for last_life_regeneration
    IF profile_rec.last_life_regeneration IS NULL THEN
      last_regen_ts := current_time;
    ELSE
      last_regen_ts := profile_rec.last_life_regeneration::TIMESTAMP WITH TIME ZONE;
    END IF;
    
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
$$;