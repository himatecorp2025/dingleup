-- Add age consent and terms acceptance tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age_consent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.age_consent IS 'User confirmed their date of birth is truthful and accepted terms';
COMMENT ON COLUMN public.profiles.terms_accepted_at IS 'Timestamp when user accepted terms and provided DOB';