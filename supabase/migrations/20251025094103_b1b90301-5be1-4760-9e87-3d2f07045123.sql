-- CRITICAL SECURITY FIX: Add server-side tracking for welcome bonus attempts
-- This prevents client-side localStorage manipulation

CREATE TABLE IF NOT EXISTS public.welcome_bonus_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.welcome_bonus_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can manage attempts (prevent manipulation)
CREATE POLICY "Service role manages attempts"
ON public.welcome_bonus_attempts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can only view their own attempts
CREATE POLICY "Users view own attempts"
ON public.welcome_bonus_attempts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add rate limiting table for all RPC calls (DDoS protection)
CREATE TABLE IF NOT EXISTS public.rpc_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rpc_name TEXT NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  UNIQUE(user_id, rpc_name, window_start)
);

-- Enable RLS
ALTER TABLE public.rpc_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role manages rate limits"
ON public.rpc_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rpc_rate_limits(user_id, rpc_name, window_start DESC);

CREATE INDEX IF NOT EXISTS idx_welcome_attempts_user 
ON public.welcome_bonus_attempts(user_id, last_attempt_at DESC);