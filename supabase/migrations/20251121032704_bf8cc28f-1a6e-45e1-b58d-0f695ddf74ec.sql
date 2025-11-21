-- Create question_translations table for multilingual quiz questions
-- NOTE: questions.id is TEXT, not UUID
CREATE TABLE IF NOT EXISTS public.question_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  lang TEXT NOT NULL CHECK (lang IN ('hu','en','de','fr','es','it','pt','nl')),
  
  question_text TEXT NOT NULL,
  answer_a TEXT NOT NULL,
  answer_b TEXT NOT NULL,
  answer_c TEXT NOT NULL,
  
  explanation TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(question_id, lang)
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_question_translations_question_lang 
  ON public.question_translations(question_id, lang);

-- Add trigger for updated_at
CREATE TRIGGER update_question_translations_updated_at
  BEFORE UPDATE ON public.question_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.question_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: everyone can read, only service role can write
CREATE POLICY "Anyone can view question translations"
  ON public.question_translations
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage question translations"
  ON public.question_translations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');