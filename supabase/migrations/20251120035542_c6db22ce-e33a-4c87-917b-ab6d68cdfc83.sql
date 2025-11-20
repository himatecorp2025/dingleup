-- Optimize question selection performance

-- Add index on questions table for faster random selection
CREATE INDEX IF NOT EXISTS idx_questions_random ON questions(id);

-- Optimized random question selection using CTE
-- This is faster than ORDER BY random() on large tables
CREATE OR REPLACE FUNCTION public.get_random_questions_fast(num_questions integer)
RETURNS TABLE(id text, question text, answers jsonb, audience jsonb, third text, source_category text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH random_sample AS (
    SELECT q.id
    FROM questions q
    TABLESAMPLE SYSTEM (5)  -- 5% sample for speed
    LIMIT num_questions * 3  -- oversample to ensure enough
  )
  SELECT q.id, q.question, q.answers, q.audience, q.third, q.source_category
  FROM questions q
  WHERE q.id IN (SELECT id FROM random_sample)
  ORDER BY random()
  LIMIT num_questions;
$$;