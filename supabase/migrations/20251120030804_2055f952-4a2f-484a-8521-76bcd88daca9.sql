-- Fix get_diverse_questions to be truly random on each call
-- STABLE means same results within same transaction - not what we want!
-- VOLATILE ensures fresh randomization every time
DROP FUNCTION IF EXISTS public.get_diverse_questions(INTEGER);

CREATE OR REPLACE FUNCTION public.get_diverse_questions(num_questions INTEGER)
RETURNS TABLE (
  id TEXT,
  question TEXT,
  answers JSONB,
  audience JSONB,
  third TEXT,
  source_category TEXT
)
LANGUAGE sql
VOLATILE -- CRITICAL: Must be VOLATILE for fresh random() on each call
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, question, answers, audience, third, source_category
  FROM (
    SELECT 
      id, 
      question, 
      answers, 
      audience, 
      third, 
      source_category,
      ROW_NUMBER() OVER (PARTITION BY source_category ORDER BY random()) as rn
    FROM questions
    WHERE source_category IS NOT NULL
  ) subq
  WHERE rn = 1
  LIMIT num_questions;
$$;