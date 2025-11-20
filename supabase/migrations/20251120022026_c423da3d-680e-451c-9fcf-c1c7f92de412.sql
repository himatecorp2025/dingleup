-- Create function to get diverse questions (1 per topic max) with correct types
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
STABLE
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