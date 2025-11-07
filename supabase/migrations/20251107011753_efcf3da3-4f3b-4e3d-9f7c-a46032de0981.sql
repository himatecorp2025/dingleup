-- Update get_current_week_start to use Monday 00:00 UTC as week start
CREATE OR REPLACE FUNCTION public.get_current_week_start()
RETURNS date
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  now_utc TIMESTAMPTZ;
  week_start DATE;
BEGIN
  -- Current time in UTC
  now_utc := now() AT TIME ZONE 'UTC';

  -- Calculate Monday of current week (UTC)
  IF EXTRACT(DOW FROM now_utc) = 0 THEN
    -- Sunday -> go back 6 days
    week_start := DATE(now_utc) - 6;
  ELSE
    week_start := DATE(now_utc) - (EXTRACT(DOW FROM now_utc)::INTEGER - 1);
  END IF;

  RETURN week_start;
END;
$function$;