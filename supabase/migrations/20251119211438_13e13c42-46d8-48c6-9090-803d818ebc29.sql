
-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile with data from auth metadata
  INSERT INTO public.profiles (
    id,
    username,
    email,
    birth_date,
    country_code,
    coins,
    lives,
    max_lives,
    lives_regeneration_rate,
    last_life_regeneration,
    help_third_active,
    help_2x_answer_active,
    help_audience_active,
    daily_gift_streak,
    welcome_bonus_claimed,
    question_swaps_available,
    total_correct_answers
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'birthDate')::date, '1991-05-05'::date),
    'HU', -- Default to Hungary, will be updated by geolocation function
    0,    -- coins
    15,   -- lives
    15,   -- max_lives
    12,   -- lives_regeneration_rate (minutes)
    NOW(), -- last_life_regeneration
    true, -- help_third_active
    true, -- help_2x_answer_active
    true, -- help_audience_active
    0,    -- daily_gift_streak
    false, -- welcome_bonus_claimed
    0,    -- question_swaps_available
    0     -- total_correct_answers
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
