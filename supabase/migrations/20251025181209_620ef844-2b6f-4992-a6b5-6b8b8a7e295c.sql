-- Set eternal Genius status for testing email
-- This ensures the test account has permanent Genius benefits

DO $$
BEGIN
  -- Check if profile exists and update to Genius status
  UPDATE public.profiles
  SET 
    is_subscribed = true,
    subscription_tier = 'premium',
    max_lives = 30,
    lives_regeneration_rate = 6,
    updated_at = now()
  WHERE email = 'himatecorp2025@gmail.com';
  
  -- Log if no rows were updated (user doesn't exist yet)
  IF NOT FOUND THEN
    RAISE NOTICE 'Test user himatecorp2025@gmail.com does not exist yet. Genius status will be set on first login.';
  ELSE
    RAISE NOTICE 'Eternal Genius status set for himatecorp2025@gmail.com';
  END IF;
END $$;