-- Fix PostgreSQL type error: speed_tokens.expires_at comparison
-- The error "operator does not exist: timestamp with time zone > time with time zone" 
-- is caused by comparing expires_at (TIME WITH TIME ZONE) with NOW() (TIMESTAMP WITH TIME ZONE)
-- Fix: Change expires_at column type from TIME WITH TIME ZONE to TIMESTAMP WITH TIME ZONE

ALTER TABLE public.speed_tokens 
ALTER COLUMN expires_at TYPE TIMESTAMP WITH TIME ZONE USING expires_at::TIMESTAMP WITH TIME ZONE;

-- Verify the change
COMMENT ON COLUMN public.speed_tokens.expires_at IS 'Token expiration timestamp - fixed from TIME to TIMESTAMP WITH TIME ZONE';