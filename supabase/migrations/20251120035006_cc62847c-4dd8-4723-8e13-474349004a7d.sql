-- Simplify question selection: just random 15 questions from entire questions table
-- No topic/category logic, just pure random selection

DROP FUNCTION IF EXISTS public.get_diverse_questions(integer);

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