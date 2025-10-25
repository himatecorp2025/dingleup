-- Fix use_life to update last_life_regeneration when life is spent
-- This ensures the regeneration timer starts correctly after spending a life

CREATE OR REPLACE FUNCTION public.use_life()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_lives INTEGER;
  current_max_lives INTEGER;
BEGIN
  -- First regenerate any lives that should have regenerated
  PERFORM regenerate_lives();
  
  -- Get current lives and max_lives
  SELECT lives, max_lives INTO current_lives, current_max_lives
  FROM profiles
  WHERE id = auth.uid();
  
  IF current_lives < 1 THEN
    RETURN false;
  END IF;
  
  -- Spend one life
  UPDATE profiles
  SET lives = lives - 1
  WHERE id = auth.uid();
  
  -- CRITICAL: If we just went from max lives to below max, reset last_life_regeneration to NOW
  -- This ensures the timer starts correctly for the first life regeneration
  IF current_lives = current_max_lives THEN
    UPDATE profiles
    SET last_life_regeneration = now()
    WHERE id = auth.uid();
  END IF;
  
  RETURN true;
END;
$$;