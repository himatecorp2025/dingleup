-- Set all existing users to Hungary (HU) country code
UPDATE profiles 
SET country_code = 'HU' 
WHERE country_code IS NULL;

-- Create function to detect country from IP during registration
CREATE OR REPLACE FUNCTION public.get_country_from_request()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_ip TEXT;
  detected_country TEXT;
BEGIN
  -- Try to get IP from request headers
  client_ip := current_setting('request.headers', true)::json->>'cf-connecting-ip';
  
  -- If Cloudflare header not available, try x-forwarded-for
  IF client_ip IS NULL THEN
    client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
  END IF;
  
  -- If still no IP, try x-real-ip
  IF client_ip IS NULL THEN
    client_ip := current_setting('request.headers', true)::json->>'x-real-ip';
  END IF;
  
  -- Get country code from Cloudflare header if available
  detected_country := current_setting('request.headers', true)::json->>'cf-ipcountry';
  
  -- If no country detected, default to HU (Hungary)
  IF detected_country IS NULL OR detected_country = '' THEN
    detected_country := 'HU';
  END IF;
  
  RETURN detected_country;
EXCEPTION
  WHEN OTHERS THEN
    -- If any error, default to HU
    RETURN 'HU';
END;
$$;

-- Update handle_new_user function to set country_code from IP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  detected_country TEXT;
BEGIN
  -- Detect country from IP
  detected_country := get_country_from_request();
  
  INSERT INTO public.profiles (id, username, email, invitation_code, country_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    generate_invitation_code(),
    detected_country
  );
  RETURN NEW;
END;
$$;