-- Ensure lives column has proper defaults and fix regenerate_lives() to be NULL-safe
UPDATE public.profiles 
SET lives = COALESCE(lives, 15),
    max_lives = COALESCE(max_lives, 15),
    last_life_regeneration = COALESCE(last_life_regeneration, NOW())
WHERE lives IS NULL OR max_lives IS NULL OR last_life_regeneration IS NULL;

-- Fix regenerate_lives() to never reduce lives when above max_lives (bonus lives)
CREATE OR REPLACE FUNCTION public.regenerate_lives()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_now TIMESTAMPTZ;
  v_user RECORD;
BEGIN
  v_now := NOW();
  
  FOR v_user IN 
    SELECT id, COALESCE(lives, 15) as lives, COALESCE(max_lives, 15) as max_lives, 
           COALESCE(last_life_regeneration, v_now) as last_life_regeneration, 
           COALESCE(lives_regeneration_rate, 12) as lives_regeneration_rate
    FROM public.profiles
    WHERE COALESCE(lives, 15) < COALESCE(max_lives, 15)
  LOOP
    DECLARE
      v_last_regen TIMESTAMPTZ;
      v_minutes_passed NUMERIC;
      v_lives_to_add INTEGER;
      v_new_lives INTEGER;
    BEGIN
      -- Normalize future timestamps
      IF v_user.last_life_regeneration > v_now THEN
        v_last_regen := v_now;
        UPDATE public.profiles SET last_life_regeneration = v_now WHERE id = v_user.id;
      ELSE
        v_last_regen := v_user.last_life_regeneration;
      END IF;
      
      v_minutes_passed := EXTRACT(EPOCH FROM (v_now - v_last_regen)) / 60;
      v_lives_to_add := FLOOR(v_minutes_passed / v_user.lives_regeneration_rate);
      
      IF v_lives_to_add > 0 THEN
        -- CRITICAL: Only regenerate up to max_lives, never reduce bonus lives
        v_new_lives := LEAST(v_user.lives + v_lives_to_add, v_user.max_lives);
        UPDATE public.profiles 
        SET lives = v_new_lives, 
            last_life_regeneration = v_last_regen + (v_lives_to_add * INTERVAL '1 minute' * v_user.lives_regeneration_rate) 
        WHERE id = v_user.id;
      END IF;
    END;
  END LOOP;
END;
$function$;