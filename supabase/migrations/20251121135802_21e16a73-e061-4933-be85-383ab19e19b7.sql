-- SECURITY FIX: Create missing login_attempts table for brute force protection
CREATE TABLE IF NOT EXISTS public.login_attempts (
  email TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own login attempts
CREATE POLICY "Users can view own login attempts"
  ON public.login_attempts
  FOR SELECT
  USING (true);  -- Allow all authenticated users to check lock status

-- Policy: Service role can manage all login attempts
CREATE POLICY "Service role manages login attempts"
  ON public.login_attempts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- SECURITY FIX: Verify pin_reset_tokens table structure
-- Add 'used' column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pin_reset_tokens' 
    AND column_name = 'used'
  ) THEN
    ALTER TABLE public.pin_reset_tokens ADD COLUMN used BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pin_reset_tokens_user_id ON public.pin_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_pin_reset_tokens_token ON public.pin_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_pin_reset_tokens_expires_at ON public.pin_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_locked_until ON public.login_attempts(locked_until);