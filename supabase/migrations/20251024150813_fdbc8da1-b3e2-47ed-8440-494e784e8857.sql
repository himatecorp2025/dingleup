-- 1. RETENTION ANALYTICS TÁBLA
CREATE TABLE IF NOT EXISTS public.retention_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  dau INTEGER DEFAULT 0,
  wau INTEGER DEFAULT 0,
  mau INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  churn_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. MONETIZATION ANALYTICS TÁBLA
CREATE TABLE IF NOT EXISTS public.monetization_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_revenue NUMERIC DEFAULT 0,
  paying_users INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  arpu NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  revenue_by_product JSONB DEFAULT '[]'::jsonb,
  top_spenders JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. PERFORMANCE SUMMARY TÁBLA
CREATE TABLE IF NOT EXISTS public.performance_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  avg_load_time NUMERIC DEFAULT 0,
  avg_ttfb NUMERIC DEFAULT 0,
  avg_lcp NUMERIC DEFAULT 0,
  avg_cls NUMERIC DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  performance_by_page JSONB DEFAULT '[]'::jsonb,
  performance_by_device JSONB DEFAULT '[]'::jsonb,
  performance_by_browser JSONB DEFAULT '[]'::jsonb,
  errors_by_page JSONB DEFAULT '[]'::jsonb,
  top_errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. ENGAGEMENT ANALYTICS TÁBLA
CREATE TABLE IF NOT EXISTS public.engagement_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  avg_session_duration INTEGER DEFAULT 0,
  avg_sessions_per_user NUMERIC DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  engagement_by_time JSONB DEFAULT '[]'::jsonb,
  feature_usage JSONB DEFAULT '[]'::jsonb,
  most_active_users JSONB DEFAULT '[]'::jsonb,
  game_engagement JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. USER JOURNEY ANALYTICS TÁBLA
CREATE TABLE IF NOT EXISTS public.user_journey_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  onboarding_funnel JSONB DEFAULT '[]'::jsonb,
  purchase_funnel JSONB DEFAULT '[]'::jsonb,
  game_funnel JSONB DEFAULT '[]'::jsonb,
  common_paths JSONB DEFAULT '[]'::jsonb,
  exit_points JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS POLICIES
ALTER TABLE public.retention_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read retention analytics" ON public.retention_analytics;
DROP POLICY IF EXISTS "Admin can read monetization analytics" ON public.monetization_analytics;
DROP POLICY IF EXISTS "Admin can read performance summary" ON public.performance_summary;
DROP POLICY IF EXISTS "Admin can read engagement analytics" ON public.engagement_analytics;
DROP POLICY IF EXISTS "Admin can read user journey analytics" ON public.user_journey_analytics;

CREATE POLICY "Admin can read retention analytics"
ON public.retention_analytics FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can read monetization analytics"
ON public.monetization_analytics FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can read performance summary"
ON public.performance_summary FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can read engagement analytics"
ON public.engagement_analytics FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can read user journey analytics"
ON public.user_journey_analytics FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexek
CREATE INDEX IF NOT EXISTS idx_retention_date ON public.retention_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_monetization_date ON public.monetization_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_summary_date ON public.performance_summary(date DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_date ON public.engagement_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_user_journey_date ON public.user_journey_analytics(date DESC);

-- Kezdő adatok beszúrása
INSERT INTO public.retention_analytics (date, dau, wau, mau, new_users, returning_users)
VALUES (
  CURRENT_DATE,
  COALESCE((SELECT COUNT(DISTINCT user_id) FROM app_session_events WHERE created_at >= CURRENT_DATE), 0),
  COALESCE((SELECT COUNT(DISTINCT user_id) FROM app_session_events WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'), 0),
  COALESCE((SELECT COUNT(DISTINCT user_id) FROM app_session_events WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'), 0),
  COALESCE((SELECT COUNT(*) FROM profiles WHERE DATE(created_at) = CURRENT_DATE), 0),
  COALESCE((SELECT COUNT(DISTINCT user_id) FROM app_session_events WHERE created_at >= CURRENT_DATE), 0)
)
ON CONFLICT (date) DO UPDATE SET
  dau = EXCLUDED.dau,
  wau = EXCLUDED.wau,
  mau = EXCLUDED.mau,
  new_users = EXCLUDED.new_users,
  returning_users = EXCLUDED.returning_users,
  updated_at = now();

INSERT INTO public.monetization_analytics (date, total_revenue, paying_users, total_users, arpu, conversion_rate)
VALUES (
  CURRENT_DATE,
  COALESCE((SELECT SUM(amount_usd) FROM purchases WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE), 0),
  COALESCE((SELECT COUNT(DISTINCT user_id) FROM purchases WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE), 0),
  (SELECT COUNT(*) FROM profiles),
  COALESCE((SELECT SUM(amount_usd) / NULLIF(COUNT(DISTINCT user_id), 0) FROM purchases WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE), 0),
  COALESCE((SELECT (COUNT(DISTINCT user_id)::NUMERIC / NULLIF((SELECT COUNT(*) FROM profiles), 0)) * 100 FROM purchases WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE), 0)
)
ON CONFLICT (date) DO UPDATE SET
  total_revenue = EXCLUDED.total_revenue,
  paying_users = EXCLUDED.paying_users,
  total_users = EXCLUDED.total_users,
  arpu = EXCLUDED.arpu,
  conversion_rate = EXCLUDED.conversion_rate,
  updated_at = now();

INSERT INTO public.engagement_analytics (date, avg_session_duration, total_sessions, avg_sessions_per_user)
VALUES (
  CURRENT_DATE,
  COALESCE((SELECT AVG(session_duration_seconds)::INTEGER FROM app_session_events WHERE DATE(created_at) = CURRENT_DATE), 0),
  COALESCE((SELECT COUNT(*) FROM app_session_events WHERE DATE(created_at) = CURRENT_DATE), 0),
  COALESCE((SELECT COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT user_id), 0) FROM app_session_events WHERE DATE(created_at) = CURRENT_DATE), 0)
)
ON CONFLICT (date) DO UPDATE SET
  avg_session_duration = EXCLUDED.avg_session_duration,
  total_sessions = EXCLUDED.total_sessions,
  avg_sessions_per_user = EXCLUDED.avg_sessions_per_user,
  updated_at = now();