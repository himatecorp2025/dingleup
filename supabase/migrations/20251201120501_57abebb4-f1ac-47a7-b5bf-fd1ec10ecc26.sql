-- PHASE 2 OPTIMIZATION: Denormalize speed token check in profiles
-- This eliminates the expensive EXISTS subquery from use_life() and regenerate_lives_background()

-- Add column to store active speed token expiry directly in profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active_speed_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for speed token expiry queries
CREATE INDEX IF NOT EXISTS idx_profiles_speed_expires
ON public.profiles (active_speed_expires_at)
WHERE active_speed_expires_at IS NOT NULL;

-- Backfill: populate from existing speed_tokens
UPDATE public.profiles p
SET active_speed_expires_at = (
  SELECT MAX(st.expires_at)
  FROM public.speed_tokens st
  WHERE st.user_id = p.id
    AND st.used_at IS NOT NULL
    AND st.expires_at > NOW()
);

-- Create trigger function to maintain active_speed_expires_at when speed tokens are used
CREATE OR REPLACE FUNCTION public.sync_active_speed_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a speed token is used/updated, update the profile
  IF NEW.used_at IS NOT NULL AND NEW.expires_at > NOW() THEN
    UPDATE public.profiles
    SET active_speed_expires_at = GREATEST(
      COALESCE(active_speed_expires_at, '1970-01-01'::timestamptz),
      NEW.expires_at
    )
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to speed_tokens table
DROP TRIGGER IF EXISTS trigger_sync_active_speed_token ON public.speed_tokens;
CREATE TRIGGER trigger_sync_active_speed_token
AFTER INSERT OR UPDATE ON public.speed_tokens
FOR EACH ROW
EXECUTE FUNCTION public.sync_active_speed_token();

-- Create cleanup function to nullify expired speed token entries (runs in background)
CREATE OR REPLACE FUNCTION public.cleanup_expired_speed_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET active_speed_expires_at = NULL
  WHERE active_speed_expires_at IS NOT NULL
    AND active_speed_expires_at <= NOW();
END;
$$;