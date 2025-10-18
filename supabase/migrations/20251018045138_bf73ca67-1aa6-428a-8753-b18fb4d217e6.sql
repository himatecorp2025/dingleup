-- Enable pgcrypto extension for secure random number generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update invitation code generation to use pgcrypto
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Use gen_random_bytes from pgcrypto for cryptographically secure random
    new_code := upper(encode(gen_random_bytes(6), 'hex'));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE invitation_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;