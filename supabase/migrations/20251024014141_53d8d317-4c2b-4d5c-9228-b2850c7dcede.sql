-- =====================================================
-- COMPREHENSIVE ANALYTICS SYSTEM
-- =====================================================

-- 1. NAVIGATION & PAGE TRACKING
CREATE TABLE IF NOT EXISTS public.navigation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  page_route TEXT NOT NULL,
  previous_route TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  session_id TEXT NOT NULL,
  device_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_navigation_user_time ON public.navigation_events(user_id, created_at DESC);
CREATE INDEX idx_navigation_route ON public.navigation_events(page_route);
CREATE INDEX idx_navigation_event_type ON public.navigation_events(event_type);

-- 2. SHOP INTERACTIONS
CREATE TABLE IF NOT EXISTS public.shop_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  product_type TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT,
  price_amount INTEGER,
  currency TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_user_time ON public.shop_interactions(user_id, created_at DESC);
CREATE INDEX idx_shop_product ON public.shop_interactions(product_type, event_type);

-- 3. SUBSCRIPTION PROMO TRACKING
CREATE TABLE IF NOT EXISTS public.subscription_promo_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  promo_type TEXT NOT NULL,
  promo_trigger TEXT,
  times_shown_before INTEGER DEFAULT 0,
  time_since_last_shown_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sub_promo_user_time ON public.subscription_promo_events(user_id, created_at DESC);
CREATE INDEX idx_sub_promo_event_type ON public.subscription_promo_events(event_type);

-- 4. BONUS CLAIM EVENTS
CREATE TABLE IF NOT EXISTS public.bonus_claim_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  bonus_type TEXT NOT NULL,
  coins_amount INTEGER DEFAULT 0,
  lives_amount INTEGER DEFAULT 0,
  streak_day INTEGER,
  is_subscriber BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bonus_user_time ON public.bonus_claim_events(user_id, created_at DESC);
CREATE INDEX idx_bonus_type ON public.bonus_claim_events(bonus_type, event_type);

-- 5. APP SESSION EVENTS
CREATE TABLE IF NOT EXISTS public.app_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  session_id TEXT NOT NULL,
  session_duration_seconds INTEGER,
  device_info JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_session_user_time ON public.app_session_events(user_id, created_at DESC);
CREATE INDEX idx_app_session_type ON public.app_session_events(event_type);
CREATE INDEX idx_app_session_id ON public.app_session_events(session_id);

-- 6. GAME EXIT EVENTS
CREATE TABLE IF NOT EXISTS public.game_exit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  category TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  total_questions INTEGER DEFAULT 15,
  correct_answers INTEGER DEFAULT 0,
  time_played_seconds INTEGER,
  exit_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_exit_user_time ON public.game_exit_events(user_id, created_at DESC);
CREATE INDEX idx_game_exit_type ON public.game_exit_events(event_type);
CREATE INDEX idx_game_exit_category ON public.game_exit_events(category);

-- 7. CHAT INTERACTIONS
CREATE TABLE IF NOT EXISTS public.chat_interaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  target_user_id UUID,
  thread_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_user_time ON public.chat_interaction_events(user_id, created_at DESC);
CREATE INDEX idx_chat_event_type ON public.chat_interaction_events(event_type);

-- 8. FEATURE USAGE
CREATE TABLE IF NOT EXISTS public.feature_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  action TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feature_user_time ON public.feature_usage_events(user_id, created_at DESC);
CREATE INDEX idx_feature_name ON public.feature_usage_events(feature_name);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.navigation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own nav" ON public.navigation_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all nav" ON public.navigation_events FOR SELECT USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.shop_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own shop" ON public.shop_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all shop" ON public.shop_interactions FOR SELECT USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.subscription_promo_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own promo" ON public.subscription_promo_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all promo" ON public.subscription_promo_events FOR SELECT USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.bonus_claim_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own bonus" ON public.bonus_claim_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all bonus" ON public.bonus_claim_events FOR SELECT USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.app_session_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own session" ON public.app_session_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all session" ON public.app_session_events FOR SELECT USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.game_exit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own exit" ON public.game_exit_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all exit" ON public.game_exit_events FOR SELECT USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.chat_interaction_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own chat" ON public.chat_interaction_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all chat" ON public.chat_interaction_events FOR SELECT USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.feature_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own feature" ON public.feature_usage_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all feature" ON public.feature_usage_events FOR SELECT USING (has_role(auth.uid(), 'admin'));