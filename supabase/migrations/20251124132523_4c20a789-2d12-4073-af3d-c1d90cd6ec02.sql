-- Drop old question_pools table and recreate with global pool system (50 pools total)
DROP TABLE IF EXISTS public.question_pools CASCADE;

-- Create new question_pools table for 50 GLOBAL pools (not per topic)
CREATE TABLE public.question_pools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_order integer NOT NULL CHECK (pool_order >= 1 AND pool_order <= 50),
  questions jsonb[] NOT NULL DEFAULT '{}',
  question_count integer GENERATED ALWAYS AS (array_length(questions, 1)) STORED,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(pool_order)
);

-- Add index for fast pool lookup
CREATE INDEX idx_question_pools_order ON public.question_pools(pool_order);
CREATE INDEX idx_question_pools_question_count ON public.question_pools(question_count);

-- Add RLS policies
ALTER TABLE public.question_pools ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read pools (needed for game)
CREATE POLICY "Authenticated users can read pools"
  ON public.question_pools
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify pools
CREATE POLICY "Only admins can insert pools"
  ON public.question_pools
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update pools"
  ON public.question_pools
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete pools"
  ON public.question_pools
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_question_pools_updated_at
  BEFORE UPDATE ON public.question_pools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_question_pools_updated_at();

-- Create game_session_pools table to track user's last used pool
CREATE TABLE IF NOT EXISTS public.game_session_pools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_pool_order integer NOT NULL CHECK (last_pool_order >= 1 AND last_pool_order <= 50),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_game_session_pools_user ON public.game_session_pools(user_id);

ALTER TABLE public.game_session_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pool session"
  ON public.game_session_pools
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pool session"
  ON public.game_session_pools
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pool session"
  ON public.game_session_pools
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);