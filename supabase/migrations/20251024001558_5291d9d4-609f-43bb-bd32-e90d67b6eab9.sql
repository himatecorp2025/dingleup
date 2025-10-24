-- Create table for tracking help usage in games
CREATE TABLE IF NOT EXISTS public.game_help_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_result_id UUID REFERENCES public.game_results(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('health', 'history', 'culture', 'finance')),
  help_type TEXT NOT NULL CHECK (help_type IN ('third', 'skip', 'audience', '2x_answer')),
  question_index INTEGER NOT NULL CHECK (question_index >= 0 AND question_index < 15),
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.game_help_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own help usage"
  ON public.game_help_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own help usage"
  ON public.game_help_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all help usage"
  ON public.game_help_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX idx_game_help_usage_user_id ON public.game_help_usage(user_id);
CREATE INDEX idx_game_help_usage_category ON public.game_help_usage(category);
CREATE INDEX idx_game_help_usage_help_type ON public.game_help_usage(help_type);
CREATE INDEX idx_game_help_usage_used_at ON public.game_help_usage(used_at);
CREATE INDEX idx_game_help_usage_category_used_at ON public.game_help_usage(category, used_at);

-- Comments for documentation
COMMENT ON TABLE public.game_help_usage IS 'Tracks usage of help features (third, skip, audience, 2x_answer) during games';
COMMENT ON COLUMN public.game_help_usage.help_type IS 'Type of help used: third (1/3), skip (question skip), audience (audience help), 2x_answer (double answer)';
COMMENT ON COLUMN public.game_help_usage.question_index IS 'Question number (0-14) where help was used';