-- ============================================
-- PHASE 1: GYORS WINS - Session, Conversion, Feature Analytics
-- ============================================

-- 1. BŐVÍTJÜK: app_session_events táblát (device, browser, geo)
ALTER TABLE public.app_session_events 
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS os_version TEXT,
ADD COLUMN IF NOT EXISTS screen_size TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Index a gyakori lekérdezésekhez
CREATE INDEX IF NOT EXISTS idx_session_events_device ON public.app_session_events(device_type);
CREATE INDEX IF NOT EXISTS idx_session_events_browser ON public.app_session_events(browser);
CREATE INDEX IF NOT EXISTS idx_session_events_country ON public.app_session_events(country_code);

-- 2. ÚJ TÁBLA: Conversion funnel tracking
CREATE TABLE IF NOT EXISTS public.conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'view_shop', 'view_genius', 'click_purchase', 'complete_purchase', 'view_product'
  product_type TEXT, -- 'coins', 'lives', 'genius_monthly', 'genius_yearly', 'booster'
  product_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own conversion events"
ON public.conversion_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all conversion events"
ON public.conversion_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexek a conversion funnel elemzéshez
CREATE INDEX IF NOT EXISTS idx_conversion_events_user ON public.conversion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_type ON public.conversion_events(event_type);
CREATE INDEX IF NOT EXISTS idx_conversion_events_product ON public.conversion_events(product_type);
CREATE INDEX IF NOT EXISTS idx_conversion_events_created ON public.conversion_events(created_at);

-- 3. BŐVÍTJÜK: feature_usage_events táblát (success rate, errors)
ALTER TABLE public.feature_usage_events
ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- Index a hibakereséshez
CREATE INDEX IF NOT EXISTS idx_feature_usage_success ON public.feature_usage_events(success) WHERE success = false;
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON public.feature_usage_events(feature_name);

-- 4. ÚJ TÁBLA: Session details (extended info)
CREATE TABLE IF NOT EXISTS public.session_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  session_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  pages_visited INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  purchases_made INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  os_version TEXT,
  screen_size TEXT,
  country_code TEXT,
  is_genius BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.session_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions"
ON public.session_details
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own sessions"
ON public.session_details
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sessions"
ON public.session_details
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all sessions"
ON public.session_details
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexek
CREATE INDEX IF NOT EXISTS idx_session_details_user ON public.session_details(user_id);
CREATE INDEX IF NOT EXISTS idx_session_details_start ON public.session_details(session_start);
CREATE INDEX IF NOT EXISTS idx_session_details_device ON public.session_details(device_type);
CREATE INDEX IF NOT EXISTS idx_session_details_country ON public.session_details(country_code);

-- Kommentek dokumentációhoz
COMMENT ON TABLE public.conversion_events IS 'Tracks user conversion funnel events for analytics';
COMMENT ON TABLE public.session_details IS 'Extended session information for detailed user behavior analysis';
COMMENT ON COLUMN public.conversion_events.event_type IS 'Type of conversion event: view_shop, view_genius, click_purchase, complete_purchase, view_product';
COMMENT ON COLUMN public.session_details.duration_seconds IS 'Total session duration in seconds';
COMMENT ON COLUMN public.app_session_events.device_type IS 'Device category: mobile, tablet, desktop';
COMMENT ON COLUMN public.app_session_events.browser IS 'Browser name and version';
COMMENT ON COLUMN public.feature_usage_events.success IS 'Whether the feature usage was successful';
COMMENT ON COLUMN public.feature_usage_events.error_message IS 'Error message if success=false';