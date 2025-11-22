-- Create 10 test users for load testing
-- These users are exclusively for admin load testing purposes

DO $$
DECLARE
  test_user_id uuid;
  test_username text;
  test_pin text;
  test_email text;
  pin_hash_value text;
BEGIN
  -- Loop to create testuser1 to testuser10
  FOR i IN 1..10 LOOP
    test_username := 'testuser' || i;
    test_pin := LPAD(i::text, 6, '1'); -- 111111, 222222, 333333, etc.
    test_email := 'testuser' || i || '@loadtest.dingleup.com';
    
    -- Hash the PIN using encode(digest())
    pin_hash_value := encode(digest(test_pin, 'sha256'), 'hex');
    
    -- Generate a new UUID for this test user
    test_user_id := gen_random_uuid();
    
    -- Insert into auth.users (Supabase managed auth table)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token,
      aud,
      role
    ) VALUES (
      test_user_id,
      '00000000-0000-0000-0000-000000000000',
      test_email,
      crypt('LoadTestPassword123!', gen_salt('bf')), -- Dummy password
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      format('{"email":"%s","username":"%s"}', test_email, test_username)::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      '',
      'authenticated',
      'authenticated'
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Insert into profiles table with PIN hash
    INSERT INTO public.profiles (
      id,
      username,
      pin_hash,
      email,
      country_code,
      coins,
      lives,
      max_lives,
      total_correct_answers,
      created_at,
      updated_at
    ) VALUES (
      test_user_id,
      test_username,
      pin_hash_value,
      test_email,
      'HU',
      10000, -- Start with plenty of coins
      50,    -- Start with plenty of lives
      50,
      0,
      now(),
      now()
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created test user: % (PIN: %)', test_username, test_pin;
  END LOOP;
END $$;