-- AUTH & PROFILE BACKEND OPTIMIZATION - ROUND 3 (2025-12-01)
-- Forgot-PIN optimization indexes and additional performance improvements

-- ============================================================
-- 1. FORGOT-PIN PERFORMANCE INDEXES
-- ============================================================

-- Index for fast username lookups during PIN reset (case-insensitive)
-- CRITICAL: Supports ilike() queries in forgot-pin edge function
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower 
ON public.profiles (LOWER(username));

-- Index for PIN reset rate limiting queries
-- Supports WHERE pin_reset_attempts >= 5 AND pin_reset_last_attempt_at checks
CREATE INDEX IF NOT EXISTS idx_profiles_pin_reset_rate_limit
ON public.profiles (pin_reset_attempts, pin_reset_last_attempt_at)
WHERE pin_reset_attempts > 0;

-- Index for recovery code hash lookups
-- CRITICAL: Supports recovery code validation queries
CREATE INDEX IF NOT EXISTS idx_profiles_recovery_code_hash
ON public.profiles (recovery_code_hash)
WHERE recovery_code_hash IS NOT NULL;

-- ============================================================
-- 2. LIFE REGENERATION HOT PATH INDEX
-- ============================================================

-- Composite index for use_life() and regenerate_lives_background()
-- CRITICAL: Supports WHERE lives < max_lives AND last_life_regeneration < NOW() queries
CREATE INDEX IF NOT EXISTS idx_profiles_lives_regen
ON public.profiles (lives, last_life_regeneration)
WHERE lives < COALESCE(max_lives, 15);

-- ============================================================
-- 3. DAILY GIFT HOT PATH INDEXES
-- ============================================================

-- Index for daily gift eligibility checks
-- Supports WHERE daily_gift_last_claimed queries with timezone-aware date calculations
CREATE INDEX IF NOT EXISTS idx_profiles_daily_gift_claimed
ON public.profiles (daily_gift_last_claimed)
WHERE daily_gift_last_claimed IS NOT NULL;

-- Index for daily gift streak queries
-- Supports dashboard and gift status queries
CREATE INDEX IF NOT EXISTS idx_profiles_daily_gift_streak
ON public.profiles (daily_gift_streak)
WHERE daily_gift_streak > 0;

-- ============================================================
-- 4. WELCOME BONUS HOT PATH INDEX
-- ============================================================

-- Index for unclaimed welcome bonus users
-- Supports WHERE welcome_bonus_claimed = false queries
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_bonus_unclaimed
ON public.profiles (id)
WHERE welcome_bonus_claimed = false;

-- ============================================================
-- 5. LOGIN ATTEMPTS HOT PATH INDEXES
-- ============================================================

-- Index for username-based rate limiting lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_pin_username
ON public.login_attempts_pin (username);

-- Index for locked account queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_pin_locked
ON public.login_attempts_pin (locked_until)
WHERE locked_until IS NOT NULL;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON INDEX idx_profiles_username_lower IS 'Optimizes case-insensitive username lookups in forgot-pin and login flows';
COMMENT ON INDEX idx_profiles_pin_reset_rate_limit IS 'Optimizes PIN reset rate limiting queries (max 5 attempts/hour)';
COMMENT ON INDEX idx_profiles_recovery_code_hash IS 'Optimizes recovery code validation in forgot-pin flow';
COMMENT ON INDEX idx_profiles_lives_regen IS 'CRITICAL: Optimizes life regeneration queries in use_life() and background job';
COMMENT ON INDEX idx_profiles_daily_gift_claimed IS 'Optimizes daily gift eligibility checks';
COMMENT ON INDEX idx_profiles_daily_gift_streak IS 'Optimizes dashboard gift streak queries';
COMMENT ON INDEX idx_profiles_welcome_bonus_unclaimed IS 'Optimizes welcome bonus eligibility queries';
COMMENT ON INDEX idx_login_attempts_pin_username IS 'Optimizes username-based login rate limiting';
COMMENT ON INDEX idx_login_attempts_pin_locked IS 'Optimizes locked account queries during login';