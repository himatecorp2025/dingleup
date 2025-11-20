-- Fix get_diverse_questions: Add ORDER BY random() before LIMIT
-- This ensures both question selection within topics AND topic selection are random

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
VOLATILE -- CRITICAL: Fresh random() on each call
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
  ORDER BY random()  -- CRITICAL: Randomize which 15 topics are selected from 27
  LIMIT num_questions;
$$;