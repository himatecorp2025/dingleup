-- Add WebAuthn biometric authentication columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS webauthn_credential_id TEXT,
ADD COLUMN IF NOT EXISTS webauthn_public_key TEXT,
ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS webauthn_challenge TEXT,
ADD COLUMN IF NOT EXISTS challenge_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster credential lookups
CREATE INDEX IF NOT EXISTS idx_profiles_webauthn_credential 
ON public.profiles(webauthn_credential_id) 
WHERE webauthn_credential_id IS NOT NULL;

-- Create index for challenge cleanup
CREATE INDEX IF NOT EXISTS idx_profiles_challenge_expires 
ON public.profiles(challenge_expires_at) 
WHERE challenge_expires_at IS NOT NULL;

COMMENT ON COLUMN public.profiles.webauthn_credential_id IS 'WebAuthn credential ID (base64url encoded) for biometric authentication';
COMMENT ON COLUMN public.profiles.webauthn_public_key IS 'WebAuthn public key (base64url encoded) for signature verification';
COMMENT ON COLUMN public.profiles.biometric_enabled IS 'Whether biometric authentication is enabled for this user';
COMMENT ON COLUMN public.profiles.webauthn_challenge IS 'Temporary challenge for WebAuthn authentication (expires after 5 minutes)';
COMMENT ON COLUMN public.profiles.challenge_expires_at IS 'Expiration timestamp for webauthn_challenge';