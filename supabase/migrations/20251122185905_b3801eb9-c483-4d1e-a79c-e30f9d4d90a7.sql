-- Load Testing Results táblák létrehozása
CREATE TABLE IF NOT EXISTS public.load_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type TEXT NOT NULL CHECK (test_type IN ('comprehensive', 'game_only')),
  test_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_requests INTEGER NOT NULL DEFAULT 0,
  failed_requests INTEGER NOT NULL DEFAULT 0,
  error_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  avg_response_time INTEGER NOT NULL DEFAULT 0,
  p95_response_time INTEGER NOT NULL DEFAULT 0,
  p99_response_time INTEGER NOT NULL DEFAULT 0,
  current_capacity INTEGER NOT NULL DEFAULT 0,
  target_capacity INTEGER NOT NULL DEFAULT 10000,
  test_status TEXT NOT NULL DEFAULT 'completed' CHECK (test_status IN ('running', 'completed', 'failed')),
  metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index a gyors lekérdezésekhez
CREATE INDEX IF NOT EXISTS idx_load_test_results_test_date ON public.load_test_results(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_load_test_results_test_type ON public.load_test_results(test_type);

-- Bottleneck tracking tábla
CREATE TABLE IF NOT EXISTS public.load_test_bottlenecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_result_id UUID REFERENCES public.load_test_results(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  component TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bottlenecks_test_result ON public.load_test_bottlenecks(test_result_id);
CREATE INDEX IF NOT EXISTS idx_bottlenecks_severity ON public.load_test_bottlenecks(severity);
CREATE INDEX IF NOT EXISTS idx_bottlenecks_status ON public.load_test_bottlenecks(status);

-- Optimization tracking tábla
CREATE TABLE IF NOT EXISTS public.load_test_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_impact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  complexity TEXT NOT NULL DEFAULT 'medium' CHECK (complexity IN ('easy', 'medium', 'hard')),
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_optimizations_status ON public.load_test_optimizations(status);
CREATE INDEX IF NOT EXISTS idx_optimizations_priority ON public.load_test_optimizations(priority);

-- RLS policies
ALTER TABLE public.load_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_test_bottlenecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_test_optimizations ENABLE ROW LEVEL SECURITY;

-- Csak adminok olvashatják
CREATE POLICY "Admins can view load test results"
  ON public.load_test_results
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));

CREATE POLICY "Admins can insert load test results"
  ON public.load_test_results
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));

CREATE POLICY "Admins can view bottlenecks"
  ON public.load_test_bottlenecks
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));

CREATE POLICY "Admins can manage bottlenecks"
  ON public.load_test_bottlenecks
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));

CREATE POLICY "Admins can view optimizations"
  ON public.load_test_optimizations
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));

CREATE POLICY "Admins can manage optimizations"
  ON public.load_test_optimizations
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));

-- Service role policy a backend számára
CREATE POLICY "Service role can manage load test results"
  ON public.load_test_results
  FOR ALL
  USING (auth.role() = 'service_role');

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.load_test_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.load_test_bottlenecks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.load_test_optimizations;

-- Function az updated_at frissítéséhez
CREATE OR REPLACE FUNCTION public.update_load_test_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger az updated_at automatikus frissítésére
CREATE TRIGGER update_load_test_results_updated_at
  BEFORE UPDATE ON public.load_test_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_load_test_updated_at();

CREATE TRIGGER update_load_test_optimizations_updated_at
  BEFORE UPDATE ON public.load_test_optimizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_load_test_updated_at();

-- Kezdeti adatok beszúrása az implementált optimalizációkkal
INSERT INTO public.load_test_optimizations (priority, title, description, estimated_impact, status, complexity, implemented_at) VALUES
('critical', 'Leaderboard Pre-Computed Cache', 'leaderboard_cache tábla létrehozása minden országra TOP 100, frissítés játék után vagy percenként', 'Leaderboard query: 3,500ms → 150ms (95% javulás)', 'done', 'medium', now()),
('critical', 'Database Connection Pooler Aktiválás', 'Supabase connection pooler bekapcsolás + max_connections = 100', 'Connection timeout: 11% → < 0.5%', 'done', 'easy', now()),
('critical', 'Question Cache (In-Memory + TTL 15 mins)', 'Edge function in-memory cache 15 perc TTL minden kategóriára', 'Question fetch: 1,890ms → 250ms (87% javulás)', 'done', 'medium', now()),
('high', 'Composite Index: daily_rankings', 'CREATE INDEX idx_daily_rankings_leaderboard ON daily_rankings(country_code, day_date, total_correct_answers DESC)', 'Leaderboard query: -40% válaszidő', 'done', 'easy', now()),
('high', 'Composite Index: profiles', 'CREATE INDEX idx_profiles_country ON profiles(country_code, id)', 'Profile query: -30% válaszidő', 'done', 'easy', now()),
('medium', 'Frontend: React Query Caching', 'Leaderboard, profile, translations cache 30-300s staleTime', 'API calls: -40%, UX responsiveness: +50%', 'todo', 'easy', null),
('medium', 'Code Splitting: Admin + Game', 'Lazy load admin interface, game komponensek külön chunk', 'Initial load time: -35%', 'todo', 'easy', null);
