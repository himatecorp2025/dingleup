-- Create translations table with 8 language columns
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  hu TEXT NOT NULL,  -- Hungarian (source language)
  en TEXT,           -- English
  de TEXT,           -- German
  fr TEXT,           -- French
  es TEXT,           -- Spanish
  it TEXT,           -- Italian
  pt TEXT,           -- Portuguese
  nl TEXT,           -- Dutch
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_translations_key ON public.translations(key);

-- Add preferred_language column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_language TEXT CHECK (preferred_language IN ('hu', 'en', 'de', 'fr', 'es', 'it', 'pt', 'nl'));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_translations_updated_at()
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

CREATE TRIGGER trigger_update_translations_updated_at
BEFORE UPDATE ON public.translations
FOR EACH ROW
EXECUTE FUNCTION public.update_translations_updated_at();

-- RLS policies for translations table
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Everyone can read translations (public data)
CREATE POLICY "Anyone can view translations"
ON public.translations
FOR SELECT
TO public
USING (true);

-- Only admins can insert/update/delete translations
CREATE POLICY "Admins can manage translations"
ON public.translations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE public.translations IS 'Multi-language translations for UI elements (8 languages: hu, en, de, fr, es, it, pt, nl)';
COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred UI language (ISO code: hu, en, de, fr, es, it, pt, nl)';