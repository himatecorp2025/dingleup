-- AUTH & PROFILE BACKEND OPTIMIZATION - Performance indexes
-- NO BUSINESS LOGIC CHANGES - Only performance improvements

-- ============================================================
-- 1. Optimize admin role checks (used in get-daily-gift-status and other auth checks)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles (user_id, role);

COMMENT ON INDEX idx_user_roles_user_role IS 'Speeds up has_role() function calls for admin verification';

-- ============================================================
-- 2. Optimize timezone lookups (frequently accessed in daily gift/winners logic)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_timezone 
ON public.profiles (user_timezone) 
WHERE user_timezone IS NOT NULL;

COMMENT ON INDEX idx_profiles_timezone IS 'Speeds up timezone-based queries for daily reward processing';

-- ============================================================
-- 3. Optimize recovery code lookups (used in forgot-pin flow)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_recovery_attempts 
ON public.profiles (pin_reset_attempts, pin_reset_last_attempt_at) 
WHERE pin_reset_attempts > 0;

COMMENT ON INDEX idx_profiles_recovery_attempts IS 'Speeds up rate limit checks in PIN recovery flow';

-- ============================================================
-- 4. Optimize invitation code lookups (used in registration flow)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_invitation_code 
ON public.profiles (invitation_code) 
WHERE invitation_code IS NOT NULL;

COMMENT ON INDEX idx_profiles_invitation_code IS 'Speeds up invitation code validation during user registration';