-- DingleUP! Database Schema
-- PostgreSQL 15+ compatible
-- Generated: 2025-12-01
-- 
-- This schema represents the complete, production-ready database structure
-- for the DingleUP! trivia game application.
--
-- Execute this file on a clean PostgreSQL database:
--   psql -U postgres -d dingleup -f db/schema_latest.sql

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search optimization

-- =============================================================================
-- ENUMS & TYPES
-- =============================================================================

CREATE TYPE app_role AS ENUM ('admin', 'user');

-- =============================================================================
-- TABLES
-- =============================================================================

-- Profiles (core user data)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    country_code TEXT,
    preferred_language TEXT DEFAULT 'en',
    user_timezone TEXT,
    date_of_birth DATE,
    age_consent BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    recovery_code_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX profiles_username_unique ON profiles(LOWER(username));
CREATE INDEX profiles_country_code_idx ON profiles(country_code);
CREATE INDEX profiles_created_at_idx ON profiles(created_at DESC);

-- User Roles
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

CREATE INDEX user_roles_user_id_idx ON user_roles(user_id);

-- Wallet Ledger (transaction log for gold coins)
CREATE TABLE wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    delta_coins INTEGER NOT NULL,
    source TEXT NOT NULL,
    idempotency_key TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX wallet_ledger_user_id_idx ON wallet_ledger(user_id);
CREATE INDEX wallet_ledger_created_at_idx ON wallet_ledger(created_at DESC);
CREATE UNIQUE INDEX wallet_ledger_idempotency_key_unique ON wallet_ledger(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Lives Ledger (transaction log for lives)
CREATE TABLE lives_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    delta_lives INTEGER NOT NULL,
    source TEXT NOT NULL,
    idempotency_key TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX lives_ledger_user_id_idx ON lives_ledger(user_id);
CREATE INDEX lives_ledger_created_at_idx ON lives_ledger(created_at DESC);
CREATE UNIQUE INDEX lives_ledger_idempotency_key_unique ON lives_ledger(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Question Pools (15 pools × 300 questions each)
CREATE TABLE question_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_order INTEGER NOT NULL CHECK (pool_order BETWEEN 1 AND 15),
    topic_id TEXT NOT NULL,
    question_order INTEGER NOT NULL,
    question_hu TEXT NOT NULL,
    answer_correct_hu TEXT NOT NULL,
    answer_wrong1_hu TEXT NOT NULL,
    answer_wrong2_hu TEXT NOT NULL,
    answer_wrong3_hu TEXT NOT NULL,
    question_en TEXT NOT NULL,
    answer_correct_en TEXT NOT NULL,
    answer_wrong1_en TEXT NOT NULL,
    answer_wrong2_en TEXT NOT NULL,
    answer_wrong3_en TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX question_pools_pool_order_idx ON question_pools(pool_order);
CREATE INDEX question_pools_topic_id_idx ON question_pools(topic_id);

-- Topics
CREATE TABLE topics (
    id TEXT PRIMARY KEY,
    name_hu TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Sessions
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    category TEXT NOT NULL,
    questions JSONB NOT NULL,
    current_question INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    pending_rescue BOOLEAN DEFAULT FALSE,
    pending_rescue_session_id TEXT,
    rescue_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX game_sessions_user_id_idx ON game_sessions(user_id);
CREATE INDEX game_sessions_session_id_idx ON game_sessions(session_id);
CREATE INDEX game_sessions_expires_at_idx ON game_sessions(expires_at);

-- Game Results
CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    total_questions INTEGER DEFAULT 15,
    correct_answers INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    average_response_time NUMERIC,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX game_results_user_id_idx ON game_results(user_id);
CREATE INDEX game_results_created_at_idx ON game_results(created_at DESC);

-- Daily Rankings
CREATE TABLE daily_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_date DATE NOT NULL,
    category TEXT DEFAULT 'mixed',
    total_correct_answers INTEGER DEFAULT 0,
    average_response_time NUMERIC DEFAULT 0.00,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, day_date, category)
);

CREATE INDEX daily_rankings_day_date_idx ON daily_rankings(day_date DESC);
CREATE INDEX daily_rankings_user_id_idx ON daily_rankings(user_id);
CREATE INDEX daily_rankings_country_rank_idx ON daily_rankings(day_date, total_correct_answers DESC);

-- Daily Leaderboard Snapshot
CREATE TABLE daily_leaderboard_snapshot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    country_code TEXT,
    snapshot_date DATE NOT NULL,
    rank INTEGER NOT NULL,
    total_correct_answers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX daily_leaderboard_snapshot_date_idx ON daily_leaderboard_snapshot(snapshot_date DESC);
CREATE INDEX daily_leaderboard_snapshot_user_idx ON daily_leaderboard_snapshot(user_id);

-- Daily Prize Table
CREATE TABLE daily_prize_table (
    rank INTEGER PRIMARY KEY,
    day_of_week INTEGER DEFAULT 1,
    gold INTEGER DEFAULT 0,
    lives INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Winner Awarded
CREATE TABLE daily_winner_awarded (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    day_date DATE NOT NULL,
    rank INTEGER NOT NULL,
    gold_awarded INTEGER DEFAULT 0,
    lives_awarded INTEGER DEFAULT 0,
    is_sunday_jackpot BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending',
    reward_payload JSONB,
    username TEXT,
    avatar_url TEXT,
    country_code TEXT,
    user_timezone TEXT,
    total_correct_answers INTEGER DEFAULT 0,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claimed_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, day_date)
);

CREATE INDEX daily_winner_awarded_user_id_idx ON daily_winner_awarded(user_id);
CREATE INDEX daily_winner_awarded_day_date_idx ON daily_winner_awarded(day_date DESC);
CREATE INDEX daily_winner_awarded_status_idx ON daily_winner_awarded(status);

-- Global Leaderboard
CREATE TABLE global_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    username TEXT NOT NULL,
    avatar_url TEXT,
    total_correct_answers INTEGER DEFAULT 0,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX global_leaderboard_rank_idx ON global_leaderboard(rank);
CREATE INDEX global_leaderboard_total_correct_idx ON global_leaderboard(total_correct_answers DESC);

-- Lootbox Instances
CREATE TABLE lootbox_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'stored',
    source TEXT DEFAULT 'daily_drop',
    reward_gold INTEGER,
    reward_lives INTEGER,
    opened_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX lootbox_instances_user_id_idx ON lootbox_instances(user_id);
CREATE INDEX lootbox_instances_status_idx ON lootbox_instances(status);

-- Lootbox Activity Log
CREATE TABLE lootbox_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    session_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX lootbox_activity_log_user_id_idx ON lootbox_activity_log(user_id);
CREATE INDEX lootbox_activity_log_created_at_idx ON lootbox_activity_log(created_at DESC);

-- Booster Types
CREATE TABLE booster_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_gold INTEGER,
    price_usd_cents INTEGER,
    reward_gold INTEGER DEFAULT 0,
    reward_lives INTEGER DEFAULT 0,
    reward_speed_count INTEGER DEFAULT 0,
    reward_speed_duration_min INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booster Purchases
CREATE TABLE booster_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booster_type_id UUID NOT NULL REFERENCES booster_types(id),
    purchase_source TEXT NOT NULL,
    purchase_context TEXT,
    gold_spent INTEGER DEFAULT 0,
    usd_cents_spent INTEGER DEFAULT 0,
    iap_transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX booster_purchases_user_id_idx ON booster_purchases(user_id);
CREATE INDEX booster_purchases_created_at_idx ON booster_purchases(created_at DESC);

-- Purchases (Stripe payments)
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE,
    product_type TEXT NOT NULL,
    amount_usd_cents INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX purchases_user_id_idx ON purchases(user_id);
CREATE INDEX purchases_stripe_payment_intent_id_idx ON purchases(stripe_payment_intent_id);
CREATE INDEX purchases_status_idx ON purchases(status);

-- Invitations
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invitation_code TEXT UNIQUE NOT NULL,
    invited_email TEXT,
    invited_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    accepted BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX invitations_inviter_id_idx ON invitations(inviter_id);
CREATE INDEX invitations_invitation_code_idx ON invitations(invitation_code);
CREATE INDEX invitations_invited_user_id_idx ON invitations(invited_user_id);

-- Friendships
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_a UUID NOT NULL,
    user_id_b UUID NOT NULL,
    status TEXT DEFAULT 'active',
    source TEXT DEFAULT 'invite',
    requested_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (user_id_a < user_id_b)
);

CREATE INDEX friendships_user_id_a_idx ON friendships(user_id_a);
CREATE INDEX friendships_user_id_b_idx ON friendships(user_id_b);
CREATE INDEX friendships_status_idx ON friendships(status);

-- DM Threads
CREATE TABLE dm_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_a UUID NOT NULL,
    user_id_b UUID NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_by_user_a BOOLEAN DEFAULT FALSE,
    archived_by_user_b BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id_a, user_id_b)
);

CREATE INDEX dm_threads_user_id_a_idx ON dm_threads(user_id_a);
CREATE INDEX dm_threads_user_id_b_idx ON dm_threads(user_id_b);

-- DM Messages
CREATE TABLE dm_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES dm_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    body TEXT NOT NULL,
    message_seq BIGSERIAL NOT NULL,
    status TEXT DEFAULT 'sent',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX dm_messages_thread_id_idx ON dm_messages(thread_id);
CREATE INDEX dm_messages_created_at_idx ON dm_messages(created_at DESC);

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reported_question_id TEXT,
    report_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX reports_reporter_id_idx ON reports(reporter_id);
CREATE INDEX reports_reported_user_id_idx ON reports(reported_user_id);
CREATE INDEX reports_status_idx ON reports(status);

-- PIN Reset Tokens
CREATE TABLE pin_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX pin_reset_tokens_user_id_idx ON pin_reset_tokens(user_id);
CREATE INDEX pin_reset_tokens_expires_at_idx ON pin_reset_tokens(expires_at);

-- RPC Rate Limits
CREATE TABLE rpc_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rpc_name TEXT NOT NULL,
    call_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, rpc_name)
);

CREATE INDEX rpc_rate_limits_user_id_idx ON rpc_rate_limits(user_id);
CREATE INDEX rpc_rate_limits_window_start_idx ON rpc_rate_limits(window_start);

-- Analytics tables
CREATE TABLE app_session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    device_type TEXT,
    browser TEXT,
    os_version TEXT,
    screen_size TEXT,
    city TEXT,
    country_code TEXT,
    device_info JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    session_duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX app_session_events_user_id_idx ON app_session_events(user_id);
CREATE INDEX app_session_events_created_at_idx ON app_session_events(created_at DESC);

CREATE TABLE game_question_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    game_result_id UUID REFERENCES game_results(id),
    session_id TEXT NOT NULL,
    category TEXT NOT NULL,
    question_index INTEGER NOT NULL,
    question_id TEXT,
    was_correct BOOLEAN NOT NULL,
    response_time_seconds NUMERIC NOT NULL,
    help_used TEXT,
    difficulty_level TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX game_question_analytics_user_id_idx ON game_question_analytics(user_id);
CREATE INDEX game_question_analytics_created_at_idx ON game_question_analytics(created_at DESC);

-- Legal Documents
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_key TEXT UNIQUE NOT NULL,
    content_hu TEXT NOT NULL,
    content_en TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutorial Progress
CREATE TABLE tutorial_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    route TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, route)
);

CREATE INDEX tutorial_progress_user_id_idx ON tutorial_progress(user_id);

-- Admin Audit Log
CREATE TABLE admin_audit_log (
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

CREATE INDEX admin_audit_log_admin_user_id_idx ON admin_audit_log(admin_user_id);
CREATE INDEX admin_audit_log_created_at_idx ON admin_audit_log(created_at DESC);

-- App Download Links
CREATE TABLE app_download_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_play_url TEXT,
    app_store_url TEXT,
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE lives_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_winner_awarded ENABLE ROW LEVEL SECURITY;
ALTER TABLE lootbox_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE lootbox_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE booster_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE booster_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpc_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_question_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_download_links ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all public profiles" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT WITH CHECK (TRUE);

-- User Roles policies
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON user_roles FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Wallet Ledger policies
CREATE POLICY "Users can view own wallet ledger" ON wallet_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert wallet ledger" ON wallet_ledger FOR INSERT WITH CHECK (TRUE);

-- Lives Ledger policies
CREATE POLICY "Users can view own lives ledger" ON lives_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert lives ledger" ON lives_ledger FOR INSERT WITH CHECK (TRUE);

-- Question Pools policies (public read)
CREATE POLICY "Anyone can view question pools" ON question_pools FOR SELECT USING (TRUE);

-- Topics policies (public read)
CREATE POLICY "Anyone can view active topics" ON topics FOR SELECT USING (is_active = TRUE);

-- Game Sessions policies
CREATE POLICY "Users can view own game sessions" ON game_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own game sessions" ON game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own game sessions" ON game_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Game Results policies
CREATE POLICY "Users can view own game results" ON game_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert game results" ON game_results FOR INSERT WITH CHECK (TRUE);

-- Daily Winner Awarded policies
CREATE POLICY "Daily winners are viewable by everyone" ON daily_winner_awarded FOR SELECT USING (TRUE);
CREATE POLICY "Service role can manage daily winners" ON daily_winner_awarded FOR ALL USING (TRUE);

-- Lootbox policies
CREATE POLICY "Users can view own lootboxes" ON lootbox_instances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own lootboxes" ON lootbox_instances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert lootboxes" ON lootbox_instances FOR INSERT WITH CHECK (TRUE);

-- Booster Types policies
CREATE POLICY "Anyone can view active booster types" ON booster_types FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage booster types" ON booster_types FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Booster Purchases policies
CREATE POLICY "Users can view own purchases" ON booster_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON booster_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchases" ON booster_purchases FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Purchases policies
CREATE POLICY "Users can view own purchases" ON purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage purchases" ON purchases FOR ALL USING (TRUE);

-- Invitations policies
CREATE POLICY "Users can view own invitations" ON invitations FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invited_user_id);
CREATE POLICY "Users can create invitations" ON invitations FOR INSERT WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Admins can view all invitations" ON invitations FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Friendships policies
CREATE POLICY "Users can view own friendships" ON friendships FOR SELECT USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);
CREATE POLICY "Users can manage own friendships" ON friendships FOR ALL USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);

-- DM Threads policies
CREATE POLICY "Users can view own threads" ON dm_threads FOR SELECT USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);
CREATE POLICY "Users can create threads" ON dm_threads FOR INSERT WITH CHECK (auth.uid() = user_id_a OR auth.uid() = user_id_b);

-- DM Messages policies
CREATE POLICY "Users can view messages in own threads" ON dm_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM dm_threads WHERE id = thread_id AND (user_id_a = auth.uid() OR user_id_b = auth.uid()))
);
CREATE POLICY "Users can send messages" ON dm_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM dm_threads WHERE id = thread_id AND (user_id_a = auth.uid() OR user_id_b = auth.uid()))
);

-- Reports policies
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can manage all reports" ON reports FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- PIN Reset Tokens policies
CREATE POLICY "Users can view own tokens" ON pin_reset_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage tokens" ON pin_reset_tokens FOR ALL USING (TRUE);

-- RPC Rate Limits policies
CREATE POLICY "Users can view own rate limits" ON rpc_rate_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage rate limits" ON rpc_rate_limits FOR ALL USING (TRUE);

-- Analytics policies
CREATE POLICY "Users can insert own session events" ON app_session_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all session events" ON app_session_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can insert own question analytics" ON game_question_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own question analytics" ON game_question_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all question analytics" ON game_question_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Legal Documents policies
CREATE POLICY "Anyone can view legal documents" ON legal_documents FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage legal documents" ON legal_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Tutorial Progress policies
CREATE POLICY "Users can view own tutorial progress" ON tutorial_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tutorial progress" ON tutorial_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tutorial progress" ON tutorial_progress FOR UPDATE USING (auth.uid() = user_id);

-- Admin Audit Log policies
CREATE POLICY "Admins can view audit logs" ON admin_audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Service role can insert audit logs" ON admin_audit_log FOR INSERT WITH CHECK (TRUE);

-- App Download Links policies
CREATE POLICY "Anyone can view download links" ON app_download_links FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage download links" ON app_download_links FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- =============================================================================
-- RPC FUNCTIONS
-- =============================================================================

-- Helper function: Check if user has role
CREATE OR REPLACE FUNCTION has_role(p_user_id UUID, p_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = p_user_id AND role = p_role
  );
END;
$$;

-- Credit Wallet (atomic transaction with idempotency)
CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id UUID,
  p_delta_coins INTEGER,
  p_delta_lives INTEGER DEFAULT 0,
  p_source TEXT DEFAULT 'unknown',
  p_idempotency_key TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_coins INTEGER;
  v_existing_lives INTEGER;
BEGIN
  SET LOCAL lock_timeout = '5s';

  -- Check idempotency
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM wallet_ledger WHERE idempotency_key = p_idempotency_key) THEN
      RETURN jsonb_build_object(
        'success', true,
        'error_code', NULL,
        'message', 'Already processed (idempotent)'
      );
    END IF;
  END IF;

  -- Insert coin ledger entry
  IF p_delta_coins != 0 THEN
    INSERT INTO wallet_ledger (user_id, delta_coins, source, idempotency_key, metadata)
    VALUES (p_user_id, p_delta_coins, p_source, p_idempotency_key, p_metadata);
  END IF;

  -- Insert lives ledger entry
  IF p_delta_lives != 0 THEN
    INSERT INTO lives_ledger (user_id, delta_lives, source, idempotency_key, metadata)
    VALUES (p_user_id, p_delta_lives, p_source, p_idempotency_key, p_metadata);
  END IF;

  -- Get current totals
  SELECT COALESCE(SUM(delta_coins), 0) INTO v_existing_coins FROM wallet_ledger WHERE user_id = p_user_id;
  SELECT COALESCE(SUM(delta_lives), 0) INTO v_existing_lives FROM lives_ledger WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'error_code', NULL,
    'total_coins', v_existing_coins,
    'total_lives', v_existing_lives
  );

EXCEPTION 
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'LOCK_TIMEOUT',
      'error_message', 'Database lock timeout exceeded'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'UNKNOWN_ERROR',
      'error_message', SQLERRM
    );
END;
$$;

-- Check Rate Limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_rpc_name TEXT,
  p_max_calls INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_call_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  SET LOCAL lock_timeout = '5s';

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN TRUE; -- Allow anonymous calls
  END IF;

  SELECT call_count, window_start INTO v_call_count, v_window_start
  FROM rpc_rate_limits
  WHERE user_id = v_user_id AND rpc_name = p_rpc_name;

  -- No existing record or window expired
  IF v_call_count IS NULL OR v_window_start < NOW() - (p_window_minutes || ' minutes')::INTERVAL THEN
    INSERT INTO rpc_rate_limits (user_id, rpc_name, call_count, window_start)
    VALUES (v_user_id, p_rpc_name, 1, NOW())
    ON CONFLICT (user_id, rpc_name) DO UPDATE
    SET call_count = 1, window_start = NOW();
    RETURN TRUE;
  END IF;

  -- Check limit
  IF v_call_count >= p_max_calls THEN
    RETURN FALSE; -- Rate limit exceeded
  END IF;

  -- Increment counter
  UPDATE rpc_rate_limits
  SET call_count = call_count + 1
  WHERE user_id = v_user_id AND rpc_name = p_rpc_name;

  RETURN TRUE;

EXCEPTION
  WHEN lock_not_available THEN
    RETURN TRUE; -- On timeout, allow request
  WHEN OTHERS THEN
    RETURN TRUE; -- On error, allow request
END;
$$;

-- Update Daily Ranking for User
CREATE OR REPLACE FUNCTION update_daily_ranking_for_user(
  p_user_id UUID,
  p_correct_answers INTEGER,
  p_avg_response_time NUMERIC,
  p_category TEXT DEFAULT 'mixed'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE;
BEGIN
  SET LOCAL lock_timeout = '5s';

  v_today := CURRENT_DATE;

  INSERT INTO daily_rankings (user_id, day_date, category, total_correct_answers, average_response_time)
  VALUES (p_user_id, v_today, p_category, p_correct_answers, p_avg_response_time)
  ON CONFLICT (user_id, day_date, category) DO UPDATE
  SET total_correct_answers = daily_rankings.total_correct_answers + EXCLUDED.total_correct_answers,
      average_response_time = (daily_rankings.average_response_time + EXCLUDED.average_response_time) / 2,
      updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'error_code', NULL);

EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'LOCK_TIMEOUT',
      'error_message', 'Database lock timeout exceeded'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'UNKNOWN_ERROR',
      'error_message', SQLERRM
    );
END;
$$;

-- Regenerate Lives (background job)
CREATE OR REPLACE FUNCTION regenerate_lives_background()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_current_lives INTEGER;
  v_elapsed_minutes INTEGER;
  v_lives_to_add INTEGER;
BEGIN
  SET LOCAL lock_timeout = '5s';

  FOR v_user IN 
    SELECT 
      p.id,
      COALESCE(SUM(ll.delta_lives), 0) AS total_lives,
      EXTRACT(EPOCH FROM (NOW() - MAX(ll.created_at))) / 60 AS minutes_since_last
    FROM profiles p
    LEFT JOIN lives_ledger ll ON ll.user_id = p.id
    GROUP BY p.id
    HAVING COALESCE(SUM(ll.delta_lives), 0) < 5
  LOOP
    v_current_lives := v_user.total_lives;
    v_elapsed_minutes := FLOOR(COALESCE(v_user.minutes_since_last, 0));

    -- Regenerate 1 life every 12 minutes
    v_lives_to_add := LEAST(FLOOR(v_elapsed_minutes / 12), 5 - v_current_lives);

    IF v_lives_to_add > 0 THEN
      INSERT INTO lives_ledger (user_id, delta_lives, source, metadata)
      VALUES (v_user.id, v_lives_to_add, 'regeneration', '{"auto": true}');
    END IF;
  END LOOP;

EXCEPTION
  WHEN lock_not_available THEN
    -- Skip on timeout
    RETURN;
  WHEN OTHERS THEN
    -- Log error but continue
    RAISE NOTICE 'Error in regenerate_lives_background: %', SQLERRM;
END;
$$;

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION has_role TO authenticated;
GRANT EXECUTE ON FUNCTION credit_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION update_daily_ranking_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION regenerate_lives_background TO service_role;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default admin user (update with your actual admin user ID)
-- INSERT INTO user_roles (user_id, role) VALUES ('<your-admin-user-id>', 'admin');

-- Insert default legal documents
INSERT INTO legal_documents (document_key, content_hu, content_en) VALUES
('aszf', 'Általános Szerződési Feltételek...', 'Terms and Conditions...'),
('privacy', 'Adatkezelési Tájékoztató...', 'Privacy Policy...')
ON CONFLICT (document_key) DO NOTHING;

-- Insert default topics (30 topics)
INSERT INTO topics (id, name_hu, name_en, display_order) VALUES
('mixed', 'Vegyes', 'Mixed', 1),
('history', 'Történelem', 'History', 2),
('geography', 'Földrajz', 'Geography', 3),
('science', 'Tudomány', 'Science', 4),
('sports', 'Sport', 'Sports', 5),
('entertainment', 'Szórakozás', 'Entertainment', 6),
('culture', 'Kultúra', 'Culture', 7),
('nature', 'Természet', 'Nature', 8),
('technology', 'Technológia', 'Technology', 9),
('art', 'Művészet', 'Art', 10),
('music', 'Zene', 'Music', 11),
('literature', 'Irodalom', 'Literature', 12),
('film', 'Film', 'Film', 13),
('food', 'Étel és Ital', 'Food & Drink', 14),
('animals', 'Állatok', 'Animals', 15),
('space', 'Űr', 'Space', 16),
('mythology', 'Mitológia', 'Mythology', 17),
('fashion', 'Divat', 'Fashion', 18),
('architecture', 'Építészet', 'Architecture', 19),
('politics', 'Politika', 'Politics', 20),
('economics', 'Gazdaság', 'Economics', 21),
('health', 'Egészség', 'Health', 22),
('psychology', 'Pszichológia', 'Psychology', 23),
('philosophy', 'Filozófia', 'Philosophy', 24),
('religion', 'Vallás', 'Religion', 25),
('language', 'Nyelvek', 'Languages', 26),
('math', 'Matematika', 'Mathematics', 27),
('chemistry', 'Kémia', 'Chemistry', 28),
('physics', 'Fizika', 'Physics', 29),
('biology', 'Biológia', 'Biology', 30)
ON CONFLICT (id) DO NOTHING;

-- Insert booster types
INSERT INTO booster_types (code, name, description, price_usd_cents, reward_gold, reward_lives, reward_speed_count, reward_speed_duration_min) VALUES
('speed_boost', 'Speed Boost', 'Faster life regeneration for 24 hours', 199, 0, 0, 1, 1440),
('premium_pack', 'Premium Pack', 'Gold + Lives + Speed Boost', 999, 1000, 10, 3, 4320),
('instant_rescue', 'Instant Rescue', 'Continue game immediately after wrong answer', 99, 0, 0, 0, 0)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- SCHEMA VERSION
-- =============================================================================

-- Track schema version for future migrations
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO schema_version (version) VALUES (1) ON CONFLICT (version) DO NOTHING;

-- =============================================================================
-- COMPLETE
-- =============================================================================

-- Schema creation complete. 
-- Next steps:
-- 1. Configure Supabase Auth settings (enable auto-confirm email for development)
-- 2. Add your admin user ID to user_roles table
-- 3. Populate question_pools table with 4500 questions (30 topics × 150 questions)
-- 4. Configure Stripe webhook endpoint
-- 5. Set environment variables in backend and frontend
