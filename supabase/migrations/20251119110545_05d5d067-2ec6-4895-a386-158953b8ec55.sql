-- Add last_username_change column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_username_change TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create password_history table for tracking password changes (90-day history)
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON public.password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON public.password_history(created_at);

-- Enable RLS on password_history
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- Only service role can access password history (security)
CREATE POLICY "Service role can manage password history"
ON public.password_history
FOR ALL
USING (auth.role() = 'service_role');

COMMENT ON TABLE public.password_history IS 'Stores password history for last 90 days to prevent password reuse';
COMMENT ON COLUMN public.profiles.last_username_change IS 'Timestamp of last username change - users can only change username once per 7 days';