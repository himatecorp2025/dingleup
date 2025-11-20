-- Simplify to fastest possible random selection for small-medium tables
-- For 2700 rows, simple random() is faster than TABLESAMPLE overhead

DROP FUNCTION IF EXISTS public.get_random_questions_fast(integer);

-- Ultra-fast random selection - optimized for tables under 10k rows
CREATE OR REPLACE FUNCTION public.get_random_questions(num_questions integer)
RETURNS TABLE(id text, question text, answers jsonb, audience jsonb, third text, source_category text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, question, answers, audience, third, source_category
  FROM questions
  ORDER BY random()
  LIMIT num_questions;
$$;