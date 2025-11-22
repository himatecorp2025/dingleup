-- Add preferred_country and preferred_language to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_country text,
ADD COLUMN IF NOT EXISTS preferred_language text;

-- Create index for faster language queries
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language ON public.profiles(preferred_language);

-- No CHECK constraint - validation handled at application level
COMMENT ON COLUMN public.profiles.preferred_country IS 'User selected country code (ISO 2-letter, e.g. HU, DE, FR) - used for leaderboard filtering';
COMMENT ON COLUMN public.profiles.preferred_language IS 'User interface language - auto-set from country or manually overridden on landing page';