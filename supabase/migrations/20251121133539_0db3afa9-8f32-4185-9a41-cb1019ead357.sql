-- Create pin_reset_tokens table for secure PIN reset flow
CREATE TABLE IF NOT EXISTS public.pin_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pin_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can manage reset tokens
CREATE POLICY "Service role can manage reset tokens"
ON public.pin_reset_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_pin_reset_tokens_token ON public.pin_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_pin_reset_tokens_user_id ON public.pin_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_pin_reset_tokens_expires_at ON public.pin_reset_tokens(expires_at);

-- Add cleanup function for expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_pin_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.pin_reset_tokens
  WHERE expires_at < now() OR used_at IS NOT NULL;
END;
$$;