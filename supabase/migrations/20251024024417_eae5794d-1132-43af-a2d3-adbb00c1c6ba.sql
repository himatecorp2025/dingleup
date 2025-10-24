-- ============================================
-- PHASE 2: CORE ANALYTICS - Retention, Game Details, Engagement
-- ============================================

-- 1. ÚJ TÁBLA: User cohorts (retention analysis)
CREATE TABLE IF NOT EXISTS public.user_cohorts (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  cohort_week DATE NOT NULL,
  cohort_month DATE NOT NULL,
  registration_date DATE NOT NULL,
  first_purchase_day INTEGER,
  became_genius_day INTEGER,
  last_active_date DATE,
  total_sessions INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  is_retained_d1 BOOLEAN DEFAULT false,
  is_retained_d7 BOOLEAN DEFAULT false,
  is_retained_d14 BOOLEAN DEFAULT false,
  is_retained_d30 BOOLEAN DEFAULT false,
  churn_risk_score INTEGER, -- 0-100, higher = more risk
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.user_cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cohort"
ON public.user_cohorts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all cohorts"
ON public.user_cohorts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexek
CREATE INDEX IF NOT EXISTS idx_cohorts_week ON public.user_cohorts(cohort_week);
CREATE INDEX IF NOT EXISTS idx_cohorts_month ON public.user_cohorts(cohort_month);
CREATE INDEX IF NOT EXISTS idx_cohorts_churn ON public.user_cohorts(churn_risk_score) WHERE churn_risk_score > 70;

-- 2. ÚJ TÁBLA: Game question analytics (per-question performance)
CREATE TABLE IF NOT EXISTS public.game_question_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_result_id UUID REFERENCES public.game_results(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  category TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  question_id TEXT, -- Hash of question text for tracking
  was_correct BOOLEAN NOT NULL,
  response_time_seconds NUMERIC NOT NULL,
  help_used TEXT, -- 'third', '2x_answer', 'audience', 'skip', null
  difficulty_level TEXT, -- 'easy', 'medium', 'hard' (can be added later)
  is_genius_user BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.game_question_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own question analytics"
ON public.game_question_analytics
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own question analytics"
ON public.game_question_analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all question analytics"
ON public.game_question_analytics
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexek
CREATE INDEX IF NOT EXISTS idx_question_analytics_user ON public.game_question_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_question_analytics_category ON public.game_question_analytics(category);
CREATE INDEX IF NOT EXISTS idx_question_analytics_correct ON public.game_question_analytics(was_correct);
CREATE INDEX IF NOT EXISTS idx_question_analytics_help ON public.game_question_analytics(help_used) WHERE help_used IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_question_analytics_created ON public.game_question_analytics(created_at);

-- 3. ÚJ TÁBLA: User engagement scores
CREATE TABLE IF NOT EXISTS public.user_engagement_scores (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  score_tier TEXT NOT NULL, -- 'low', 'medium', 'high', 'power_user'
  last_calculated TIMESTAMPTZ NOT NULL DEFAULT now(),
  factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Score komponensek (debug/transparency)
  session_score INTEGER,
  game_score INTEGER,
  social_score INTEGER,
  purchase_score INTEGER,
  retention_score INTEGER,
  
  -- Trend tracking
  previous_score INTEGER,
  score_trend TEXT, -- 'increasing', 'stable', 'decreasing'
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.user_engagement_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own engagement"
ON public.user_engagement_scores
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all engagement"
ON public.user_engagement_scores
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexek
CREATE INDEX IF NOT EXISTS idx_engagement_score ON public.user_engagement_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_tier ON public.user_engagement_scores(score_tier);
CREATE INDEX IF NOT EXISTS idx_engagement_trend ON public.user_engagement_scores(score_trend);

-- 4. FÜGGVÉNY: Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggerek az auto-update-hez
CREATE TRIGGER update_user_cohorts_updated_at 
  BEFORE UPDATE ON public.user_cohorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engagement_scores_updated_at
  BEFORE UPDATE ON public.user_engagement_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Kommentek dokumentációhoz
COMMENT ON TABLE public.user_cohorts IS 'User cohort analysis for retention tracking';
COMMENT ON TABLE public.game_question_analytics IS 'Per-question performance tracking for game optimization';
COMMENT ON TABLE public.user_engagement_scores IS 'User engagement scoring system (0-100)';
COMMENT ON COLUMN public.user_cohorts.cohort_week IS 'Week of user registration (Monday)';
COMMENT ON COLUMN public.user_cohorts.churn_risk_score IS 'Churn prediction score, 0-100 (higher = more risk)';
COMMENT ON COLUMN public.game_question_analytics.question_id IS 'Hash of question text for tracking specific questions';
COMMENT ON COLUMN public.user_engagement_scores.score_tier IS 'Engagement tier: low (0-25), medium (26-50), high (51-75), power_user (76-100)';
COMMENT ON COLUMN public.user_engagement_scores.factors IS 'JSON object with detailed score calculation factors';