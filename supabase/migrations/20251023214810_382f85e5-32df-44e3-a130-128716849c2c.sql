
-- Fix remaining function search_path warnings

-- 1. Fix get_current_week_start - add search_path for security
CREATE OR REPLACE FUNCTION public.get_current_week_start()
RETURNS date
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  now_budapest TIMESTAMP WITH TIME ZONE;
  week_start DATE;
BEGIN
  -- Get current time in Europe/Budapest timezone
  now_budapest := now() AT TIME ZONE 'Europe/Budapest';
  
  -- Calculate Monday of current week
  week_start := DATE(now_budapest - (EXTRACT(DOW FROM now_budapest)::INTEGER - 1) * INTERVAL '1 day');
  
  -- If Sunday (DOW = 0), go back to previous Monday
  IF EXTRACT(DOW FROM now_budapest) = 0 THEN
    week_start := week_start - INTERVAL '6 days';
  END IF;
  
  RETURN week_start;
END;
$$;

-- 2. Fix normalize_user_ids - add search_path for security
CREATE OR REPLACE FUNCTION public.normalize_user_ids(uid1 uuid, uid2 uuid)
RETURNS uuid[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF uid1 < uid2 THEN
    RETURN ARRAY[uid1, uid2];
  ELSE
    RETURN ARRAY[uid2, uid1];
  END IF;
END;
$$;
