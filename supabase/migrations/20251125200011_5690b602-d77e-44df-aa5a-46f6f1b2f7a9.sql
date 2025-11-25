-- Migrate all profiles to auth.users with auto-generated emails
-- Every user gets username@dingleup.auto email
DO $$
DECLARE
  profile_record RECORD;
  v_email TEXT;
  v_password TEXT;
BEGIN
  -- Loop through all profiles that don't have auth.users record
  FOR profile_record IN 
    SELECT p.id, p.username, p.pin_hash
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = p.id
    )
  LOOP
    -- Generate auto email: username@dingleup.auto
    v_email := LOWER(profile_record.username) || '@dingleup.auto';
    
    -- Password format: 123456Username (6-digit PIN + username)
    -- We use a default PIN of 123456 for migration, user can change later
    v_password := '123456' || profile_record.username;
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      profile_record.id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('username', profile_record.username)
    );
    
    -- Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      profile_record.id,
      profile_record.id,
      jsonb_build_object('sub', profile_record.id, 'email', v_email),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
    
    -- Update profiles table with email
    UPDATE profiles 
    SET email = v_email
    WHERE id = profile_record.id;
    
    RAISE NOTICE 'Migrated user: % (email: %)', profile_record.username, v_email;
  END LOOP;
END $$;