-- Drop the old topic-based pool system
DROP TABLE IF EXISTS public.question_pools CASCADE;

-- Create new GLOBAL pool system (40 pools total, mixed topics)
CREATE TABLE public.question_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_order integer NOT NULL UNIQUE CHECK (pool_order >= 1 AND pool_order <= 40),
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_count integer GENERATED ALWAYS AS (jsonb_array_length(questions)) STORED,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast pool lookup
CREATE INDEX idx_question_pools_pool_order ON public.question_pools(pool_order);

-- RLS policies
ALTER TABLE public.question_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pools"
  ON public.question_pools
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify pools"
  ON public.question_pools
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_question_pools_updated_at
  BEFORE UPDATE ON public.question_pools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_question_pools_updated_at();

COMMENT ON TABLE public.question_pools IS '40 global pools with mixed-topic questions (~500 questions/pool). Pool rotation: 1→2→3→...→40→1';