-- Create or replace function to regenerate lives for a specific user
CREATE OR REPLACE FUNCTION public.regenerate_lives_for_user(p_user_id UUID)
RETURNS json
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
  base_max_lives INTEGER;
  is_subscriber_effective BOOLEAN;
BEGIN
  -- Get user profile
  SELECT * INTO profile_rec FROM public.profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Determine base values based on subscription
  is_subscriber_effective := COALESCE(profile_rec.is_subscribed, false) OR COALESCE(profile_rec.is_subscriber, false);

  IF is_subscriber_effective THEN
    base_max_lives := 30;
    regen_rate_minutes := 6;
  ELSE
    base_max_lives := 15;
    regen_rate_minutes := 12;
  END IF;
  
  effective_max_lives := base_max_lives;
  
  -- Apply booster bonuses if active
  IF profile_rec.speed_booster_active THEN
    IF profile_rec.speed_booster_expires_at > now() THEN
      -- Booster overrides regen rate and adds extra lives
      regen_rate_minutes := GREATEST(0.5, 12.0 / NULLIF(profile_rec.speed_booster_multiplier, 0));
      
      CASE profile_rec.speed_booster_multiplier
        WHEN 2 THEN 
          effective_max_lives := base_max_lives + 10;
        WHEN 4 THEN 
          effective_max_lives := base_max_lives + 20;
        WHEN 12 THEN 
          effective_max_lives := base_max_lives + 60;
        WHEN 24 THEN 
          effective_max_lives := base_max_lives + 120;
        ELSE 
          effective_max_lives := base_max_lives;
      END CASE;
    ELSE
      -- Booster expired, deactivate it
      UPDATE public.profiles
      SET speed_booster_active = false,
          speed_booster_expires_at = null,
          speed_booster_multiplier = 1,
          max_lives = base_max_lives,
          lives_regeneration_rate = CASE WHEN is_subscriber_effective THEN 6 ELSE 12 END
      WHERE id = p_user_id;
    END IF;
  END IF;
  
  -- Regenerate lives if below max
  IF profile_rec.lives < effective_max_lives THEN
    minutes_passed := EXTRACT(EPOCH FROM (NOW() - profile_rec.last_life_regeneration)) / 60;
    lives_to_add := FLOOR(minutes_passed / regen_rate_minutes)::INTEGER;
    
    IF lives_to_add > 0 THEN
      UPDATE public.profiles
      SET 
        lives = LEAST(lives + lives_to_add, effective_max_lives),
        last_life_regeneration = last_life_regeneration + (lives_to_add * regen_rate_minutes * INTERVAL '1 minute')
      WHERE id = p_user_id;
      
      RETURN json_build_object(
        'success', true, 
        'lives_added', lives_to_add, 
        'new_lives', LEAST(profile_rec.lives + lives_to_add, effective_max_lives)
      );
    END IF;
  END IF;
  
  RETURN json_build_object('success', true, 'lives_added', 0, 'message', 'No regeneration needed');
END;
$$;

-- Schedule cron job to call the edge function every minute using pg_net
SELECT cron.schedule(
  'regenerate-lives-background-job',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wdpxmwsxhckazwxufttk.supabase.co/functions/v1/regenerate-lives-background',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcHhtd3N4aGNrYXp3eHVmdHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDQ3ODUsImV4cCI6MjA3NjE4MDc4NX0.DeAS4ACvq-YVt2ytoOS3NVSg7xFSHVhvyjUEOti_NnA"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.regenerate_lives_for_user(UUID) TO authenticated, anon;