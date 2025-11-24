-- Update handle_new_user function to set default country to US and language to English
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert new profile with data from auth metadata
  INSERT INTO public.profiles (
    id,
    username,
    email,
    birth_date,
    country_code,
    preferred_language,
    preferred_country,
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
    total_correct_answers,
    age_verified,
    legal_consent,
    first_login_age_gate_completed,
    device_id,
    pin_hash,
    biometric_enabled
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    CASE 
      WHEN NEW.email LIKE 'device_%@dingleup.auto' THEN NULL 
      ELSE NEW.email 
    END,
    COALESCE((NEW.raw_user_meta_data->>'birthDate')::date, NULL),
    'US', -- Default country: United States
    'en', -- Default language: English
    'US', -- Preferred country also set to US
    0,
    15,
    15,
    12,
    NOW(),
    true,
    true,
    true,
    0,
    false,
    0,
    0,
    false,
    false,
    false,
    NEW.raw_user_meta_data->>'device_id',
    NULL,
    false
  );
  RETURN NEW;
END;
$function$;
