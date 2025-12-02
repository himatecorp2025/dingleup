-- ============================================================================
-- DINGLEUP! DATABASE SCHEMA DOCUMENTATION
-- ============================================================================
-- Complete database structure including tables, RLS policies, indexes,
-- functions, and relationships.
-- Generated: 2025-12-01
-- Project: DingleUP! Trivia Game Platform
-- ============================================================================

-- ============================================================================
-- SECTION 1: CUSTOM TYPES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- has_role: Check if user has specific role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = p_role
  );
END;
$$;

CREATE TYPE app_role AS ENUM ('user', 'admin', 'moderator');

-- ============================================================================
-- SECTION 2: CORE USER TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles: Core user profile data
-- ----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  avatar_url TEXT,
  country_code TEXT DEFAULT 'HU',
  user_timezone TEXT DEFAULT 'Europe/Budapest',
  preferred_language TEXT DEFAULT 'en',
  
  -- Game economy
  coins INTEGER DEFAULT 100 NOT NULL,
  lives INTEGER DEFAULT 15 NOT NULL,
  max_lives INTEGER DEFAULT 15 NOT NULL,
  lives_regeneration_rate INTEGER DEFAULT 12 NOT NULL, -- minutes per life
  last_life_regeneration TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_speed_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Game helpers/boosters
  help_third_active BOOLEAN DEFAULT TRUE,
  help_2x_answer_active BOOLEAN DEFAULT TRUE,
  help_audience_active BOOLEAN DEFAULT TRUE,
  
  -- Daily systems
  daily_gift_streak INTEGER DEFAULT 0,
  daily_gift_last_claimed TIMESTAMP WITH TIME ZONE,
  daily_gift_last_seen DATE,
  
  -- Invitation system
  invitation_code TEXT UNIQUE,
  invited_by TEXT,
  
  -- Age verification & consent
  date_of_birth DATE,
  age_consent BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Recovery
  recovery_code_hash TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Indexes for profiles
CREATE INDEX idx_profiles_username_lower ON public.profiles (LOWER(username));
CREATE INDEX idx_profiles_email_lower ON public.profiles (LOWER(email));
CREATE INDEX idx_profiles_invitation_code ON public.profiles (invitation_code);
CREATE INDEX idx_profiles_lives_regen ON public.profiles (lives, last_life_regeneration)
  WHERE lives < max_lives;
CREATE INDEX idx_profiles_country_code ON public.profiles (country_code);

-- ----------------------------------------------------------------------------
-- user_roles: Role-based access control
-- ----------------------------------------------------------------------------
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- SECTION 3: AUTHENTICATION & SECURITY
-- ============================================================================

-- ----------------------------------------------------------------------------
-- login_attempts_pin: PIN login rate limiting
-- ----------------------------------------------------------------------------
CREATE TABLE public.login_attempts_pin (
  username TEXT PRIMARY KEY,
  failed_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locked_until TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.login_attempts_pin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages login attempts"
  ON public.login_attempts_pin FOR ALL
  USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- pin_reset_tokens: Forgot PIN recovery
-- ----------------------------------------------------------------------------
CREATE TABLE public.pin_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pin_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tokens"
  ON public.pin_reset_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages tokens"
  ON public.pin_reset_tokens FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_pin_reset_tokens_user_id ON public.pin_reset_tokens (user_id);
CREATE INDEX idx_pin_reset_tokens_expires_at ON public.pin_reset_tokens (expires_at);

-- ----------------------------------------------------------------------------
-- rpc_rate_limits: RPC call rate limiting
-- ----------------------------------------------------------------------------
CREATE TABLE public.rpc_rate_limits (
  user_id UUID NOT NULL,
  rpc_name TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  call_count INTEGER DEFAULT 1,
  PRIMARY KEY (user_id, rpc_name, window_start)
);

CREATE INDEX idx_rpc_rate_limits_window ON public.rpc_rate_limits (user_id, rpc_name, window_start);

-- ============================================================================
-- SECTION 4: GAME ECONOMY - WALLET & LEDGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- wallet_ledger: All coin transactions
-- ----------------------------------------------------------------------------
CREATE TABLE public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  delta_coins INTEGER NOT NULL,
  delta_lives INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet ledger"
  ON public.wallet_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages wallet"
  ON public.wallet_ledger FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_wallet_ledger_user_id ON public.wallet_ledger (user_id, created_at DESC);
CREATE INDEX idx_wallet_ledger_idempotency ON public.wallet_ledger (idempotency_key);
CREATE INDEX idx_wallet_ledger_source ON public.wallet_ledger (source);

-- ----------------------------------------------------------------------------
-- wallet_ledger_archive: Archived wallet entries (90+ days old)
-- ----------------------------------------------------------------------------
CREATE TABLE public.wallet_ledger_archive (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  delta_coins INTEGER NOT NULL,
  delta_lives INTEGER NOT NULL,
  source TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- lives_ledger: All life transactions
-- ----------------------------------------------------------------------------
CREATE TABLE public.lives_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  delta_lives INTEGER NOT NULL,
  source TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.lives_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own lives ledger"
  ON public.lives_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_lives_ledger_user_id ON public.lives_ledger (user_id, created_at DESC);
CREATE INDEX idx_lives_ledger_correlation ON public.lives_ledger (correlation_id);

-- ----------------------------------------------------------------------------
-- lives_ledger_archive: Archived lives entries (90+ days old)
-- ----------------------------------------------------------------------------
CREATE TABLE public.lives_ledger_archive (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  delta_lives INTEGER NOT NULL,
  source TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECTION 5: GAME QUESTIONS & POOLS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- topics: Game question topics/categories
-- ----------------------------------------------------------------------------
CREATE TABLE public.topics (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name_hu TEXT,
  display_name_en TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- question_pools: 15 pools × 300 questions each (4500 total)
-- ----------------------------------------------------------------------------
CREATE TABLE public.question_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_number INTEGER NOT NULL CHECK (pool_number BETWEEN 1 AND 15),
  topic_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL CHECK (question_number BETWEEN 1 AND 150),
  
  -- Hungarian (original)
  question_hu TEXT NOT NULL,
  answer_a_hu TEXT NOT NULL,
  answer_b_hu TEXT NOT NULL,
  answer_c_hu TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C')),
  
  -- English (translated)
  question_en TEXT NOT NULL,
  answer_a_en TEXT NOT NULL,
  answer_b_en TEXT NOT NULL,
  answer_c_en TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(topic_id, question_number)
);

CREATE INDEX idx_question_pools_pool_number ON public.question_pools (pool_number);
CREATE INDEX idx_question_pools_topic ON public.question_pools (topic_id);

ALTER TABLE public.question_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view question pools"
  ON public.question_pools FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- game_session_pools: Tracks user's current pool progress
-- ----------------------------------------------------------------------------
CREATE TABLE public.game_session_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id TEXT NOT NULL,
  last_pool_order INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE public.game_session_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own session pools"
  ON public.game_session_pools FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 6: GAME SESSIONS & RESULTS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- game_sessions: Active game state
-- ----------------------------------------------------------------------------
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  category TEXT NOT NULL,
  questions JSONB NOT NULL,
  current_question INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  pending_rescue BOOLEAN DEFAULT FALSE,
  pending_rescue_session_id TEXT,
  rescue_completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions"
  ON public.game_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sessions"
  ON public.game_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_game_sessions_user_id ON public.game_sessions (user_id);
CREATE INDEX idx_game_sessions_expires_at ON public.game_sessions (expires_at);

-- ----------------------------------------------------------------------------
-- game_results: Completed game records
-- ----------------------------------------------------------------------------
CREATE TABLE public.game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 15,
  coins_earned INTEGER DEFAULT 0,
  average_response_time NUMERIC,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own game results"
  ON public.game_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role inserts game results"
  ON public.game_results FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_game_results_user_id ON public.game_results (user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- game_question_analytics: Per-question performance tracking
-- ----------------------------------------------------------------------------
CREATE TABLE public.game_question_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_result_id UUID,
  session_id TEXT NOT NULL,
  category TEXT NOT NULL,
  question_id TEXT,
  question_index INTEGER NOT NULL,
  was_correct BOOLEAN NOT NULL,
  response_time_seconds NUMERIC NOT NULL,
  help_used TEXT,
  difficulty_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_game_question_analytics_user ON public.game_question_analytics (user_id);
CREATE INDEX idx_game_question_analytics_session ON public.game_question_analytics (session_id);

-- ----------------------------------------------------------------------------
-- game_help_usage: Game helper usage tracking
-- ----------------------------------------------------------------------------
CREATE TABLE public.game_help_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_result_id UUID,
  category TEXT NOT NULL,
  help_type TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECTION 7: LEADERBOARDS & RANKINGS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- daily_rankings: Current day rankings (country-segmented)
-- ----------------------------------------------------------------------------
CREATE TABLE public.daily_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT DEFAULT 'mixed',
  day_date DATE NOT NULL,
  total_correct_answers INTEGER DEFAULT 0,
  average_response_time NUMERIC DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, day_date)
);

ALTER TABLE public.daily_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily rankings viewable by everyone"
  ON public.daily_rankings FOR SELECT
  USING (true);

CREATE INDEX idx_daily_rankings_day_date ON public.daily_rankings (day_date, category);
CREATE INDEX idx_daily_rankings_rank ON public.daily_rankings (day_date, category, rank);

-- ----------------------------------------------------------------------------
-- leaderboard_cache: Cached TOP 100 per country
-- ----------------------------------------------------------------------------
CREATE TABLE public.leaderboard_cache (
  country_code TEXT NOT NULL,
  rank INTEGER NOT NULL,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  total_correct_answers INTEGER NOT NULL,
  avatar_url TEXT,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (country_code, rank)
);

ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard cache viewable by everyone"
  ON public.leaderboard_cache FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- mv_daily_rankings_current: Materialized view for fast rank lookups
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW public.mv_daily_rankings_current AS
SELECT 
  dr.user_id,
  dr.category,
  dr.day_date,
  dr.total_correct_answers,
  dr.average_response_time,
  p.country_code,
  ROW_NUMBER() OVER (
    PARTITION BY p.country_code, dr.category, dr.day_date 
    ORDER BY dr.total_correct_answers DESC, dr.average_response_time ASC
  ) AS rank
FROM public.daily_rankings dr
JOIN public.profiles p ON dr.user_id = p.id
WHERE dr.day_date = CURRENT_DATE;

CREATE UNIQUE INDEX idx_mv_daily_rankings_current_user 
  ON public.mv_daily_rankings_current (user_id, category, day_date);

-- ============================================================================
-- SECTION 8: DAILY WINNERS & REWARDS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- daily_prize_table: Day-of-week multipliers for TOP 10/25
-- ----------------------------------------------------------------------------
CREATE TABLE public.daily_prize_table (
  rank INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL DEFAULT 1,
  gold INTEGER DEFAULT 0,
  lives INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (rank, day_of_week)
);

ALTER TABLE public.daily_prize_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily prizes viewable by everyone"
  ON public.daily_prize_table FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- daily_winner_awarded: Pending and claimed rewards
-- ----------------------------------------------------------------------------
CREATE TABLE public.daily_winner_awarded (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  day_date DATE NOT NULL,
  rank INTEGER NOT NULL,
  country_code TEXT,
  username TEXT,
  avatar_url TEXT,
  user_timezone TEXT,
  total_correct_answers INTEGER DEFAULT 0,
  gold_awarded INTEGER DEFAULT 0,
  lives_awarded INTEGER DEFAULT 0,
  is_sunday_jackpot BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  reward_payload JSONB,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, day_date)
);

ALTER TABLE public.daily_winner_awarded ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily winners viewable by everyone"
  ON public.daily_winner_awarded FOR SELECT
  USING (true);

CREATE INDEX idx_daily_winner_awarded_user ON public.daily_winner_awarded (user_id, day_date);
CREATE INDEX idx_daily_winner_awarded_status ON public.daily_winner_awarded (status, day_date);

-- ----------------------------------------------------------------------------
-- daily_winner_processing_log: Timezone-based processing tracking
-- ----------------------------------------------------------------------------
CREATE TABLE public.daily_winner_processing_log (
  timezone TEXT PRIMARY KEY,
  last_processed_date DATE NOT NULL,
  last_processed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- daily_winners_popup_views: Track popup display per user per day
-- ----------------------------------------------------------------------------
CREATE TABLE public.daily_winners_popup_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  last_shown_day TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, last_shown_day)
);

-- ============================================================================
-- SECTION 9: LOOTBOX SYSTEM
-- ============================================================================

-- ----------------------------------------------------------------------------
-- lootbox_instances: All lootbox states
-- ----------------------------------------------------------------------------
CREATE TABLE public.lootbox_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL, -- active_drop, stored, opened, expired
  source TEXT NOT NULL, -- daily_drop, purchase, reward
  open_cost_gold INTEGER DEFAULT 150,
  rewards_gold INTEGER,
  rewards_life INTEGER,
  metadata JSONB DEFAULT '{}',
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.lootbox_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own lootboxes"
  ON public.lootbox_instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own lootboxes"
  ON public.lootbox_instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages lootboxes"
  ON public.lootbox_instances FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_lootbox_instances_user ON public.lootbox_instances (user_id, status);
CREATE INDEX idx_lootbox_instances_expires ON public.lootbox_instances (expires_at);

-- ----------------------------------------------------------------------------
-- lootbox_daily_plan: Pre-generated daily drop schedule per user
-- ----------------------------------------------------------------------------
CREATE TABLE public.lootbox_daily_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_date DATE NOT NULL,
  target_count INTEGER NOT NULL,
  delivered_count INTEGER DEFAULT 0,
  slots JSONB DEFAULT '[]',
  active_window_start TIMESTAMP WITH TIME ZONE,
  active_window_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_date)
);

-- ============================================================================
-- SECTION 10: MONETIZATION & PURCHASES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- booster_types: Available booster packages
-- ----------------------------------------------------------------------------
CREATE TABLE public.booster_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_usd_cents INTEGER,
  price_gold INTEGER,
  reward_gold INTEGER DEFAULT 0,
  reward_lives INTEGER DEFAULT 0,
  reward_speed_count INTEGER DEFAULT 0,
  reward_speed_duration_min INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.booster_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active booster types"
  ON public.booster_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage booster types"
  ON public.booster_types FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- ----------------------------------------------------------------------------
-- booster_purchases: Purchase history
-- ----------------------------------------------------------------------------
CREATE TABLE public.booster_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  booster_type_id UUID NOT NULL REFERENCES public.booster_types(id),
  purchase_source TEXT NOT NULL, -- stripe, gold
  purchase_context TEXT,
  gold_spent INTEGER DEFAULT 0,
  usd_cents_spent INTEGER DEFAULT 0,
  iap_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_booster_purchases_user ON public.booster_purchases (user_id, created_at DESC);

-- ============================================================================
-- SECTION 11: INVITATIONS & REFERRALS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- invitations: Invitation code tracking
-- ----------------------------------------------------------------------------
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL,
  invitation_code TEXT UNIQUE NOT NULL,
  invited_email TEXT,
  invited_user_id UUID,
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sent invitations"
  ON public.invitations FOR SELECT
  USING (auth.uid() = inviter_id);

CREATE POLICY "Users view invitations sent to them"
  ON public.invitations FOR SELECT
  USING (auth.uid() = invited_user_id);

CREATE POLICY "Users create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE INDEX idx_invitations_inviter ON public.invitations (inviter_id);
CREATE INDEX idx_invitations_code ON public.invitations (invitation_code);

-- ----------------------------------------------------------------------------
-- friendships: Friend relationships
-- ----------------------------------------------------------------------------
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_a UUID NOT NULL,
  user_id_b UUID NOT NULL,
  status TEXT DEFAULT 'active',
  source TEXT DEFAULT 'invite',
  requested_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id_a, user_id_b),
  CHECK (user_id_a < user_id_b) -- Normalized ordering
);

CREATE INDEX idx_friendships_user_a ON public.friendships (user_id_a);
CREATE INDEX idx_friendships_user_b ON public.friendships (user_id_b);

-- ============================================================================
-- SECTION 12: MESSAGING & SOCIAL
-- ============================================================================

-- ----------------------------------------------------------------------------
-- dm_threads: Direct message threads between two users
-- ----------------------------------------------------------------------------
CREATE TABLE public.dm_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_a UUID NOT NULL,
  user_id_b UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_by_user_a BOOLEAN DEFAULT FALSE,
  archived_by_user_b BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id_a, user_id_b),
  CHECK (user_id_a < user_id_b)
);

CREATE INDEX idx_dm_threads_users ON public.dm_threads (user_id_a, user_id_b);

-- ----------------------------------------------------------------------------
-- dm_messages: Messages within threads
-- ----------------------------------------------------------------------------
CREATE TABLE public.dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  message_seq BIGSERIAL NOT NULL,
  status TEXT DEFAULT 'sent',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dm_messages_thread ON public.dm_messages (thread_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- message_reads: Read status tracking
-- ----------------------------------------------------------------------------
CREATE TABLE public.message_reads (
  thread_id UUID NOT NULL REFERENCES public.dm_threads(id),
  user_id UUID NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (thread_id, user_id)
);

-- ============================================================================
-- SECTION 13: ANALYTICS & TRACKING
-- ============================================================================

-- ----------------------------------------------------------------------------
-- app_session_events: Session lifecycle tracking
-- ----------------------------------------------------------------------------
CREATE TABLE public.app_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- session_start, session_end
  session_duration_seconds INTEGER,
  device_type TEXT,
  browser TEXT,
  os_version TEXT,
  screen_size TEXT,
  country_code TEXT,
  city TEXT,
  device_info JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_app_session_events_user ON public.app_session_events (user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- performance_metrics: Web Vitals and load times
-- ----------------------------------------------------------------------------
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT NOT NULL,
  page_route TEXT NOT NULL,
  load_time_ms INTEGER NOT NULL,
  fcp_ms INTEGER, -- First Contentful Paint
  lcp_ms INTEGER, -- Largest Contentful Paint
  fid_ms INTEGER, -- First Input Delay
  cls NUMERIC,    -- Cumulative Layout Shift
  ttfb_ms INTEGER, -- Time to First Byte
  tti_ms INTEGER,  -- Time to Interactive
  device_type TEXT,
  browser TEXT,
  connection_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- error_logs: Frontend error tracking
-- ----------------------------------------------------------------------------
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_component TEXT,
  page_route TEXT NOT NULL,
  severity TEXT DEFAULT 'error',
  is_fatal BOOLEAN DEFAULT FALSE,
  user_action TEXT,
  device_type TEXT,
  browser TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_error_logs_user ON public.error_logs (user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- device_geo_analytics: Device and location data
-- ----------------------------------------------------------------------------
CREATE TABLE public.device_geo_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  device_type TEXT,
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
  is_touch_device BOOLEAN DEFAULT FALSE,
  country_code TEXT,
  country_name TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  connection_type TEXT,
  effective_connection_type TEXT,
  downlink_mbps NUMERIC,
  rtt_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- bonus_claim_events: Daily gift and bonus tracking
-- ----------------------------------------------------------------------------
CREATE TABLE public.bonus_claim_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  bonus_type TEXT NOT NULL,
  coins_amount INTEGER DEFAULT 0,
  lives_amount INTEGER DEFAULT 0,
  streak_day INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- conversion_events: Monetization funnel tracking
-- ----------------------------------------------------------------------------
CREATE TABLE public.conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  product_type TEXT,
  product_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECTION 14: ADMIN TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- admin_audit_log: Admin action tracking
-- ----------------------------------------------------------------------------
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_value JSONB,
  new_value JSONB,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit logs"
  ON public.admin_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- ----------------------------------------------------------------------------
-- legal_documents: Terms and Privacy Policy
-- ----------------------------------------------------------------------------
CREATE TABLE public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_key TEXT UNIQUE NOT NULL, -- 'aszf', 'privacy'
  content TEXT DEFAULT '',
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECTION 15: POSTGRESQL RPC FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- credit_wallet: Atomic wallet crediting with idempotency
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id UUID,
  p_delta_coins INTEGER,
  p_delta_lives INTEGER,
  p_source TEXT,
  p_idempotency_key TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_coins INTEGER;
  v_current_lives INTEGER;
  v_max_lives INTEGER;
  v_new_coins INTEGER;
  v_new_lives INTEGER;
BEGIN
  -- Check idempotency
  IF EXISTS (
    SELECT 1 FROM public.wallet_ledger
    WHERE idempotency_key = p_idempotency_key
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true
    );
  END IF;

  -- Lock and get current wallet
  SELECT coins, lives, max_lives
  INTO v_current_coins, v_current_lives, v_max_lives
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  END IF;

  -- Calculate new values
  v_new_coins := v_current_coins + p_delta_coins;
  v_new_lives := v_current_lives + p_delta_lives;

  -- Validate non-negative
  IF v_new_coins < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_COINS');
  END IF;

  IF v_new_lives < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_LIVES');
  END IF;

  -- Insert ledger entry
  INSERT INTO public.wallet_ledger (
    user_id, delta_coins, delta_lives, source, idempotency_key, metadata
  ) VALUES (
    p_user_id, p_delta_coins, p_delta_lives, p_source, p_idempotency_key, p_metadata
  );

  -- Update profile
  UPDATE public.profiles
  SET 
    coins = v_new_coins,
    lives = v_new_lives,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_coins', v_new_coins,
    'new_lives', v_new_lives
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- credit_lives: Atomic life crediting with idempotency
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.credit_lives(
  p_user_id UUID,
  p_delta_lives INTEGER,
  p_source TEXT,
  p_idempotency_key TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_lives INTEGER;
  v_max_lives INTEGER;
  v_new_lives INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.lives_ledger
    WHERE correlation_id = p_idempotency_key
  ) THEN
    RETURN json_build_object('success', true, 'already_processed', true);
  END IF;

  SELECT lives, max_lives
  INTO v_current_lives, v_max_lives
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  IF (v_current_lives + p_delta_lives) < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient lives');
  END IF;

  v_new_lives := v_current_lives + p_delta_lives;

  INSERT INTO public.lives_ledger (
    user_id, delta_lives, source, correlation_id, metadata
  ) VALUES (
    p_user_id, p_delta_lives, p_source, p_idempotency_key, p_metadata
  );

  UPDATE public.profiles
  SET lives = v_new_lives, updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'new_lives', v_new_lives);
END;
$$;

-- ----------------------------------------------------------------------------
-- regenerate_lives_background: Background job for life regeneration
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.regenerate_lives_background()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_rec RECORD;
  minutes_passed NUMERIC;
  lives_to_add INTEGER;
  regen_rate_minutes NUMERIC;
  effective_max_lives INTEGER;
  current_time TIMESTAMP WITH TIME ZONE := NOW();
  last_regen_ts TIMESTAMP WITH TIME ZONE;
  has_active_speed BOOLEAN;
BEGIN
  -- Process users needing regeneration (batch limit 5000)
  FOR profile_rec IN 
    SELECT id, lives, max_lives, lives_regeneration_rate, 
           last_life_regeneration, active_speed_expires_at
    FROM public.profiles 
    WHERE lives < COALESCE(max_lives, 15)
    AND last_life_regeneration IS NOT NULL
    AND last_life_regeneration < current_time - INTERVAL '6 minutes'
    ORDER BY last_life_regeneration ASC
    LIMIT 5000
  LOOP
    effective_max_lives := COALESCE(profile_rec.max_lives, 15);
    regen_rate_minutes := COALESCE(profile_rec.lives_regeneration_rate, 12);
    
    -- Check active speed boost
    has_active_speed := (
      profile_rec.active_speed_expires_at IS NOT NULL 
      AND profile_rec.active_speed_expires_at > current_time
    );
    
    IF has_active_speed THEN
      regen_rate_minutes := regen_rate_minutes / 2;
    END IF;
    
    last_regen_ts := profile_rec.last_life_regeneration;
    
    -- Normalize future timestamps
    IF last_regen_ts > current_time THEN
      last_regen_ts := current_time;
    END IF;
    
    -- Calculate lives to add
    minutes_passed := GREATEST(0, EXTRACT(EPOCH FROM (current_time - last_regen_ts)) / 60);
    lives_to_add := FLOOR(minutes_passed / regen_rate_minutes)::INTEGER;
    
    IF lives_to_add > 0 THEN
      UPDATE public.profiles
      SET 
        lives = LEAST(lives + lives_to_add, effective_max_lives),
        last_life_regeneration = last_regen_ts + (lives_to_add * regen_rate_minutes * INTERVAL '1 minute')
      WHERE id = profile_rec.id;
    END IF;
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- refresh_leaderboard_cache_optimized: Rebuild leaderboard cache
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_cache_optimized()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_day TEXT;
BEGIN
  v_current_day := (NOW() AT TIME ZONE 'UTC')::DATE::TEXT;
  
  TRUNCATE TABLE public.leaderboard_cache;
  
  INSERT INTO public.leaderboard_cache (
    country_code, rank, user_id, username,
    total_correct_answers, avatar_url, cached_at
  )
  SELECT 
    p.country_code,
    ROW_NUMBER() OVER (
      PARTITION BY p.country_code 
      ORDER BY COALESCE(dr.total_correct_answers, 0) DESC, p.username ASC
    ) AS rank,
    p.id AS user_id,
    p.username,
    COALESCE(dr.total_correct_answers, 0) AS total_correct_answers,
    p.avatar_url,
    NOW() AS cached_at
  FROM public.profiles p
  LEFT JOIN public.daily_rankings dr ON (
    dr.user_id = p.id 
    AND dr.day_date = v_current_day 
    AND dr.category = 'mixed'
  )
  WHERE p.country_code IS NOT NULL;
  
  DELETE FROM public.leaderboard_cache WHERE rank > 100;
END;
$$;

-- ----------------------------------------------------------------------------
-- upsert_daily_ranking_aggregate: Update daily rankings after game
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_daily_ranking_aggregate(
  p_user_id UUID,
  p_correct_answers INTEGER,
  p_average_response_time NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_date DATE;
BEGIN
  v_day_date := CURRENT_DATE;
  
  INSERT INTO public.daily_rankings (
    user_id, category, day_date,
    total_correct_answers, average_response_time, rank, updated_at
  )
  VALUES (
    p_user_id, 'mixed', v_day_date,
    p_correct_answers, p_average_response_time, NULL, NOW()
  )
  ON CONFLICT (user_id, category, day_date)
  DO UPDATE SET
    total_correct_answers = daily_rankings.total_correct_answers + EXCLUDED.total_correct_answers,
    average_response_time = (
      (daily_rankings.average_response_time * daily_rankings.total_correct_answers) + 
      (EXCLUDED.average_response_time * EXCLUDED.total_correct_answers)
    ) / NULLIF(daily_rankings.total_correct_answers + EXCLUDED.total_correct_answers, 0),
    updated_at = NOW();
END;
$$;

-- ----------------------------------------------------------------------------
-- open_lootbox_transaction: Atomic lootbox opening with rewards
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.open_lootbox_transaction(
  p_lootbox_id UUID,
  p_user_id UUID,
  p_tier TEXT,
  p_gold_reward INTEGER,
  p_life_reward INTEGER,
  p_idempotency_key TEXT,
  p_open_cost INTEGER DEFAULT 150
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lootbox RECORD;
  v_user_gold INTEGER;
  v_credit_result JSONB;
  v_existing_metadata JSONB;
BEGIN
  -- Lock lootbox
  SELECT * INTO v_lootbox
  FROM public.lootbox_instances
  WHERE id = p_lootbox_id AND user_id = p_user_id
    AND status IN ('active_drop', 'stored')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'LOOTBOX_NOT_FOUND_OR_INVALID');
  END IF;

  v_existing_metadata := COALESCE(v_lootbox.metadata, '{}'::jsonb);

  -- Check gold if cost > 0
  IF p_open_cost > 0 THEN
    SELECT COALESCE(coins, 0) INTO v_user_gold
    FROM public.profiles WHERE id = p_user_id;

    IF v_user_gold < p_open_cost THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'NOT_ENOUGH_GOLD',
        'required', p_open_cost,
        'current', v_user_gold
      );
    END IF;

    -- Deduct gold
    INSERT INTO public.wallet_ledger (
      user_id, delta_coins, delta_lives, source, idempotency_key, metadata
    ) VALUES (
      p_user_id, -p_open_cost, 0, 'lootbox_open_cost',
      p_idempotency_key || '_cost',
      jsonb_build_object('lootbox_id', p_lootbox_id, 'tier', p_tier)
    );

    UPDATE public.profiles
    SET coins = coins - p_open_cost
    WHERE id = p_user_id;
  END IF;

  -- Credit rewards
  SELECT public.credit_wallet(
    p_user_id, p_gold_reward, p_life_reward,
    'lootbox_reward', p_idempotency_key || '_reward',
    jsonb_build_object(
      'lootbox_id', p_lootbox_id,
      'tier', p_tier,
      'gold', p_gold_reward,
      'life', p_life_reward
    )
  ) INTO v_credit_result;

  IF NOT (v_credit_result->>'success')::boolean THEN
    RAISE EXCEPTION 'Failed to credit lootbox rewards';
  END IF;

  -- Update lootbox
  UPDATE public.lootbox_instances
  SET
    status = 'opened',
    opened_at = NOW(),
    rewards_gold = p_gold_reward,
    rewards_life = p_life_reward,
    open_cost_gold = p_open_cost,
    metadata = v_existing_metadata || jsonb_build_object('tier', p_tier)
  WHERE id = p_lootbox_id;

  RETURN jsonb_build_object(
    'success', true,
    'rewards', jsonb_build_object(
      'gold', p_gold_reward,
      'life', p_life_reward,
      'tier', p_tier
    ),
    'new_balance', jsonb_build_object(
      'gold', v_credit_result->'new_coins',
      'life', v_credit_result->'new_lives'
    )
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- claim_daily_gift: Daily gift claiming with streak tracking
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_daily_gift()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
  v_user_timezone TEXT;
  v_current_streak INT;
  v_new_streak INT;
  v_cycle_position INT;
  v_reward_coins INT;
  v_today TEXT;
  v_last_claimed_date TEXT;
  v_idempotency_key TEXT;
  v_existing_claim RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_LOGGED_IN');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROFILE_NOT_FOUND');
  END IF;

  v_user_timezone := COALESCE(v_profile.user_timezone, 'UTC');
  v_today := TO_CHAR(NOW() AT TIME ZONE v_user_timezone, 'YYYY-MM-DD');
  
  -- Check if already claimed
  IF v_profile.daily_gift_last_claimed IS NOT NULL THEN
    v_last_claimed_date := TO_CHAR(
      v_profile.daily_gift_last_claimed AT TIME ZONE v_user_timezone,
      'YYYY-MM-DD'
    );
    IF v_last_claimed_date = v_today THEN
      RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED_TODAY');
    END IF;
  END IF;

  v_idempotency_key := 'daily-gift:' || v_user_id || ':' || v_today;
  SELECT * INTO v_existing_claim
  FROM wallet_ledger WHERE idempotency_key = v_idempotency_key LIMIT 1;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED_TODAY');
  END IF;

  -- Calculate reward
  v_current_streak := COALESCE(v_profile.daily_gift_streak, 0);
  v_new_streak := v_current_streak + 1;
  v_cycle_position := v_current_streak % 7;
  v_reward_coins := CASE v_cycle_position
    WHEN 0 THEN 50 WHEN 1 THEN 75 WHEN 2 THEN 110 WHEN 3 THEN 160
    WHEN 4 THEN 220 WHEN 5 THEN 300 WHEN 6 THEN 500
  END;

  -- Credit coins
  INSERT INTO wallet_ledger (
    user_id, delta_coins, delta_lives, source, idempotency_key, metadata
  ) VALUES (
    v_user_id, v_reward_coins, 0, 'daily', v_idempotency_key,
    jsonb_build_object(
      'streak', v_new_streak,
      'cycle_position', v_cycle_position,
      'date', v_today,
      'timezone', v_user_timezone
    )
  );

  UPDATE profiles
  SET 
    coins = COALESCE(coins, 0) + v_reward_coins,
    daily_gift_streak = v_new_streak,
    daily_gift_last_claimed = NOW(),
    daily_gift_last_seen = v_today::date
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'grantedCoins', v_reward_coins,
    'walletBalance', COALESCE(v_profile.coins, 0) + v_reward_coins,
    'streak', v_new_streak
  );
END;
$$;

-- ============================================================================
-- SECTION 16: TRIGGERS
-- ============================================================================

-- Auto-update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_question_pools_updated_at
  BEFORE UPDATE ON public.question_pools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update thread last_message_at
CREATE OR REPLACE FUNCTION public.update_thread_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dm_threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_thread_last_message_trigger
  AFTER INSERT ON public.dm_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_thread_last_message();

-- ============================================================================
-- END OF DATABASE SCHEMA DOCUMENTATION
-- ============================================================================
