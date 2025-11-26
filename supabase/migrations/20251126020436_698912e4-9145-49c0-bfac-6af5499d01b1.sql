-- Create table for tracking daily like prompt views
CREATE TABLE IF NOT EXISTS public.user_like_prompt_tracking (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_date DATE NOT NULL DEFAULT CURRENT_DATE,
  prompt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, day_date)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_like_prompt_tracking_user_day 
ON public.user_like_prompt_tracking(user_id, day_date);

-- RLS policies
ALTER TABLE public.user_like_prompt_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own like prompt tracking"
ON public.user_like_prompt_tracking
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own like prompt tracking"
ON public.user_like_prompt_tracking
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own like prompt tracking"
ON public.user_like_prompt_tracking
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_like_prompt_tracking_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_like_prompt_tracking_updated_at
BEFORE UPDATE ON public.user_like_prompt_tracking
FOR EACH ROW
EXECUTE FUNCTION update_like_prompt_tracking_updated_at();