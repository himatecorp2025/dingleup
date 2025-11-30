-- Create tutorial_progress table to store user-specific tutorial completion status
CREATE TABLE IF NOT EXISTS public.tutorial_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one record per user per route
  UNIQUE(user_id, route)
);

-- Enable RLS on tutorial_progress
ALTER TABLE public.tutorial_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own tutorial progress
CREATE POLICY "Users can view their own tutorial progress"
  ON public.tutorial_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own tutorial progress
CREATE POLICY "Users can insert their own tutorial progress"
  ON public.tutorial_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own tutorial progress
CREATE POLICY "Users can update their own tutorial progress"
  ON public.tutorial_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_tutorial_progress_user_id ON public.tutorial_progress(user_id);
CREATE INDEX idx_tutorial_progress_route ON public.tutorial_progress(route);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tutorial_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tutorial_progress_updated_at
BEFORE UPDATE ON public.tutorial_progress
FOR EACH ROW
EXECUTE FUNCTION update_tutorial_progress_updated_at();

COMMENT ON TABLE public.tutorial_progress IS 'Stores user-specific tutorial completion status across all devices and sessions';