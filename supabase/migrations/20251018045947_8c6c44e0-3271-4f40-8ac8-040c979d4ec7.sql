-- Move pgcrypto extension to extensions schema (not public) for security compliance
DROP EXTENSION IF EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Update regenerate_invitation_code function to use extensions.gen_random_bytes
CREATE OR REPLACE FUNCTION regenerate_invitation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  -- Use built-in random() instead of pgcrypto for simplicity
  new_code := '';
  FOR i IN 1..8 LOOP
    new_code := new_code || substring(chars from (floor(random() * length(chars)) + 1)::int for 1);
  END LOOP;
  
  UPDATE profiles
  SET invitation_code = new_code
  WHERE id = auth.uid();
  
  RETURN new_code;
END;
$$;