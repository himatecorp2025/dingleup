-- BACKEND OPTIMIZATION: Add critical indexes for high-load auth/profile operations
-- These indexes improve query performance under heavy concurrent load

-- 1. Optimize login_attempts_pin lookups (username-based rate limiting)
CREATE INDEX IF NOT EXISTS idx_login_attempts_username 
  ON public.login_attempts_pin(username);

CREATE INDEX IF NOT EXISTS idx_login_attempts_locked 
  ON public.login_attempts_pin(locked_until) 
  WHERE locked_until IS NOT NULL;

-- 2. Optimize PIN reset rate limiting queries
CREATE INDEX IF NOT EXISTS idx_profiles_pin_reset_attempts 
  ON public.profiles(pin_reset_attempts, pin_reset_last_attempt_at) 
  WHERE pin_reset_attempts > 0;

-- 3. Optimize recovery code lookups (forgot-pin flow)
CREATE INDEX IF NOT EXISTS idx_profiles_recovery_hash 
  ON public.profiles(recovery_code_hash) 
  WHERE recovery_code_hash IS NOT NULL;

-- 4. Optimize age verification queries (Age Gate flow)
CREATE INDEX IF NOT EXISTS idx_profiles_age_verified 
  ON public.profiles(age_verified) 
  WHERE age_verified = false;

-- 5. Optimize welcome bonus eligibility checks
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_bonus 
  ON public.profiles(welcome_bonus_claimed) 
  WHERE welcome_bonus_claimed = false;

-- 6. Optimize daily gift queries (timezone-aware)
CREATE INDEX IF NOT EXISTS idx_profiles_daily_gift_last_seen 
  ON public.profiles(daily_gift_last_seen);

-- 7. Optimize invitation code lookups (case-sensitive, exact match)
CREATE INDEX IF NOT EXISTS idx_profiles_invitation_code_upper 
  ON public.profiles(UPPER(invitation_code));

COMMENT ON INDEX idx_login_attempts_username IS 'Optimizes rate limiting lookup on login flow';
COMMENT ON INDEX idx_profiles_pin_reset_attempts IS 'Optimizes PIN reset rate limiting queries';
COMMENT ON INDEX idx_profiles_recovery_hash IS 'Optimizes forgot-pin recovery code validation';
COMMENT ON INDEX idx_profiles_age_verified IS 'Optimizes Age Gate eligibility checks';
COMMENT ON INDEX idx_profiles_welcome_bonus IS 'Optimizes Welcome Bonus eligibility checks';
COMMENT ON INDEX idx_profiles_daily_gift_last_seen IS 'Optimizes Daily Gift popup timing queries';
COMMENT ON INDEX idx_profiles_invitation_code_upper IS 'Optimizes invitation code validation during registration';