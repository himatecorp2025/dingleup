-- Create speed_tokens table for tracking speed boost tokens
CREATE TABLE IF NOT EXISTS public.speed_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  expires_at timestamptz NOT NULL,
  source text NOT NULL -- 'FREE_BOOSTER' | 'PREMIUM_BOOSTER' | 'PURCHASE' | 'REWARD'
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_speed_tokens_user_id ON public.speed_tokens(user_id);

-- Index for unused tokens
CREATE INDEX IF NOT EXISTS idx_speed_tokens_unused ON public.speed_tokens(user_id, used_at) WHERE used_at IS NULL;

-- Enable RLS
ALTER TABLE public.speed_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own speed tokens"
  ON public.speed_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage speed tokens"
  ON public.speed_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);