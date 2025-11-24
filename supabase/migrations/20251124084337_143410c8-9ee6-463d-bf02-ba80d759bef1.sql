-- Create question_pools table for pre-generated question pools
CREATE TABLE IF NOT EXISTS public.question_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL,
  pool_order INTEGER NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  question_count INTEGER GENERATED ALWAYS AS (jsonb_array_length(questions)) STORED,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(topic_id, pool_order)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_question_pools_topic_order ON public.question_pools(topic_id, pool_order);
CREATE INDEX IF NOT EXISTS idx_question_pools_active ON public.question_pools(topic_id, is_active) WHERE is_active = true;

-- RLS policies
ALTER TABLE public.question_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active question pools"
  ON public.question_pools
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage question pools"
  ON public.question_pools
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create game_session_pools table to track which pool each user last used per topic
CREATE TABLE IF NOT EXISTS public.game_session_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id TEXT NOT NULL,
  last_pool_order INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_game_session_pools_user_topic ON public.game_session_pools(user_id, topic_id);

ALTER TABLE public.game_session_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own session pools"
  ON public.game_session_pools
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own session pools"
  ON public.game_session_pools
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_question_pools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_pools_updated_at
  BEFORE UPDATE ON public.question_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_question_pools_updated_at();