-- Fix critical security issues identified in security scan

-- ============================================================================
-- 1. FIX CRITICAL: Weekly rankings RLS policy (weekly_rankings_write)
-- ============================================================================

-- Remove the overly permissive policy that allows ANY user to modify rankings
DROP POLICY IF EXISTS "System can update weekly rankings" ON public.weekly_rankings;

-- Add restrictive service-role-only policy for modifications
CREATE POLICY "Service role can manage rankings"
ON public.weekly_rankings
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Note: SELECT policy "Anyone can view weekly rankings" is kept as-is (read-only for users)

-- ============================================================================
-- 2. FIX: Activity aggregation tables policies (activity_aggregation_policies)
-- ============================================================================

-- Add service role policy for user_activity_daily table
CREATE POLICY "Service can aggregate activity data"
ON public.user_activity_daily
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 3. FIX: Ensure all SECURITY DEFINER functions have fixed search_path
-- ============================================================================

-- Update any remaining functions that might be missing search_path
-- Note: Most critical functions were already fixed in migration 20251022010704

-- Ensure purchase_life has fixed search_path
CREATE OR REPLACE FUNCTION public.purchase_life()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_coins INTEGER;
  current_lives INTEGER;
  max_allowed_lives INTEGER;
  result json;
BEGIN
  SELECT coins, lives, max_lives INTO current_coins, current_lives, max_allowed_lives
  FROM public.profiles WHERE id = auth.uid();
  
  IF current_coins < 25 THEN
    RETURN json_build_object('success', false, 'error', 'Nincs elég aranyérméd');
  END IF;
  
  IF current_lives >= max_allowed_lives THEN
    RETURN json_build_object('success', false, 'error', 'Már maximális életed van');
  END IF;
  
  UPDATE public.profiles
  SET coins = coins - 25,
      lives = lives + 1
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true);
END;
$function$;

-- Ensure regenerate_lives_background has fixed search_path
CREATE OR REPLACE FUNCTION public.regenerate_lives_background()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  profile_rec RECORD;
  minutes_passed NUMERIC;
  lives_to_add INTEGER;
  regen_rate_minutes NUMERIC;
  effective_max_lives INTEGER;
BEGIN
  FOR profile_rec IN 
    SELECT * FROM public.profiles 
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
        UPDATE public.profiles
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