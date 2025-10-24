-- ============================================
-- PHASE 3: ADVANCED - Performance Monitoring & Deep Analytics
-- ============================================

-- 1. ÚJ TÁBLA: Performance metrics (load times, errors)
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  page_route TEXT NOT NULL,
  load_time_ms INTEGER NOT NULL,
  ttfb_ms INTEGER, -- Time to first byte
  fcp_ms INTEGER, -- First contentful paint
  lcp_ms INTEGER, -- Largest contentful paint
  tti_ms INTEGER, -- Time to interactive
  cls NUMERIC, -- Cumulative layout shift
  fid_ms INTEGER, -- First input delay
  device_type TEXT,
  browser TEXT,
  connection_type TEXT, -- '4g', '3g', 'wifi', etc
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own performance metrics"
ON public.performance_metrics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all performance metrics"
ON public.performance_metrics
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexek
CREATE INDEX IF NOT EXISTS idx_performance_route ON public.performance_metrics(page_route);
CREATE INDEX IF NOT EXISTS idx_performance_load_time ON public.performance_metrics(load_time_ms);
CREATE INDEX IF NOT EXISTS idx_performance_device ON public.performance_metrics(device_type);
CREATE INDEX IF NOT EXISTS idx_performance_created ON public.performance_metrics(created_at);

-- 2. ÚJ TÁBLA: Device & Geo analytics (extended)
CREATE TABLE IF NOT EXISTS public.device_geo_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  
  -- Device info
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  device_model TEXT,
  device_vendor TEXT,
  os TEXT,
  os_version TEXT,
  browser TEXT,
  browser_version TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  pixel_ratio NUMERIC,
  is_touch_device BOOLEAN DEFAULT false,
  
  -- Geo info
  country_code TEXT,
  country_name TEXT,
  city TEXT,
  region TEXT,
  timezone TEXT,
  
  -- Network info
  connection_type TEXT, -- '4g', '3g', 'wifi', 'ethernet'
  effective_connection_type TEXT,
  downlink_mbps NUMERIC,
  rtt_ms INTEGER,
  
  -- Session context
  is_genius_user BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.device_geo_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own device data"
ON public.device_geo_analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all device data"
ON public.device_geo_analytics
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexek
CREATE INDEX IF NOT EXISTS idx_device_geo_user ON public.device_geo_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_device_geo_country ON public.device_geo_analytics(country_code);
CREATE INDEX IF NOT EXISTS idx_device_geo_device ON public.device_geo_analytics(device_type);
CREATE INDEX IF NOT EXISTS idx_device_geo_browser ON public.device_geo_analytics(browser);
CREATE INDEX IF NOT EXISTS idx_device_geo_created ON public.device_geo_analytics(created_at);

-- 3. ÚJ TÁBLA: Error tracking
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  
  -- Error details
  error_type TEXT NOT NULL, -- 'javascript', 'network', 'api', 'render'
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_component TEXT,
  
  -- Context
  page_route TEXT NOT NULL,
  user_action TEXT, -- What was the user doing when error occurred
  device_type TEXT,
  browser TEXT,
  is_genius_user BOOLEAN DEFAULT false,
  
  -- Severity
  severity TEXT NOT NULL DEFAULT 'error', -- 'warning', 'error', 'critical'
  is_fatal BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own errors"
ON public.error_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all errors"
ON public.error_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexek
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_fatal ON public.error_logs(is_fatal) WHERE is_fatal = true;
CREATE INDEX IF NOT EXISTS idx_error_logs_route ON public.error_logs(page_route);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON public.error_logs(created_at);

-- 4. VIEW: Aggregated performance by page
CREATE OR REPLACE VIEW public.performance_by_page AS
SELECT 
  page_route,
  COUNT(*) as sample_count,
  AVG(load_time_ms)::INTEGER as avg_load_time_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY load_time_ms)::INTEGER as median_load_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY load_time_ms)::INTEGER as p95_load_time_ms,
  AVG(ttfb_ms)::INTEGER as avg_ttfb_ms,
  AVG(lcp_ms)::INTEGER as avg_lcp_ms,
  device_type,
  browser
FROM public.performance_metrics
GROUP BY page_route, device_type, browser;

-- 5. VIEW: Error rate by page
CREATE OR REPLACE VIEW public.error_rate_by_page AS
SELECT 
  page_route,
  error_type,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_id) as affected_users,
  MAX(created_at) as last_occurrence
FROM public.error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY page_route, error_type
ORDER BY error_count DESC;

-- Kommentek
COMMENT ON TABLE public.performance_metrics IS 'Web performance metrics (load times, Core Web Vitals)';
COMMENT ON TABLE public.device_geo_analytics IS 'Extended device and geographical analytics';
COMMENT ON TABLE public.error_logs IS 'Application error tracking and monitoring';
COMMENT ON VIEW public.performance_by_page IS 'Aggregated performance metrics by page and device';
COMMENT ON VIEW public.error_rate_by_page IS 'Error occurrence rate by page (last 7 days)';
COMMENT ON COLUMN public.performance_metrics.cls IS 'Cumulative Layout Shift (Core Web Vital)';
COMMENT ON COLUMN public.performance_metrics.lcp_ms IS 'Largest Contentful Paint in ms (Core Web Vital)';
COMMENT ON COLUMN public.performance_metrics.fid_ms IS 'First Input Delay in ms (Core Web Vital)';