-- Backfill existing questions to question_translations table (Hungarian source)
-- Extract individual answers from JSONB array

INSERT INTO public.question_translations (question_id, lang, question_text, answer_a, answer_b, answer_c, created_at, updated_at)
SELECT 
  id,
  'hu' as lang,
  question,
  (answers->0->>'text') as answer_a,
  (answers->1->>'text') as answer_b,
  (answers->2->>'text') as answer_c,
  created_at,
  NOW() as updated_at
FROM public.questions
WHERE 
  answers IS NOT NULL 
  AND jsonb_array_length(answers) = 3
ON CONFLICT (question_id, lang) DO NOTHING;

-- Create function to extract correct_answer letter from answers JSONB
CREATE OR REPLACE FUNCTION public.get_correct_answer_from_jsonb(answers_jsonb JSONB)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  i INTEGER;
  answer_obj JSONB;
BEGIN
  FOR i IN 0..2 LOOP
    answer_obj := answers_jsonb->i;
    IF (answer_obj->>'correct')::boolean = true THEN
      RETURN answer_obj->>'key';
    END IF;
  END LOOP;
  RETURN 'A'; -- Default fallback
END;
$$;

-- Add correct_answer column to questions table if not exists
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS correct_answer TEXT;

-- Populate correct_answer column from JSONB answers
UPDATE public.questions
SET correct_answer = get_correct_answer_from_jsonb(answers)
WHERE correct_answer IS NULL AND answers IS NOT NULL;

-- Create trigger to automatically insert Hungarian source when new question is created
CREATE OR REPLACE FUNCTION public.sync_question_to_translations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Extract answers from JSONB
  IF NEW.answers IS NOT NULL AND jsonb_array_length(NEW.answers) = 3 THEN
    INSERT INTO public.question_translations (question_id, lang, question_text, answer_a, answer_b, answer_c)
    VALUES (
      NEW.id, 
      'hu', 
      NEW.question,
      (NEW.answers->0->>'text'),
      (NEW.answers->1->>'text'),
      (NEW.answers->2->>'text')
    )
    ON CONFLICT (question_id, lang) DO UPDATE
    SET 
      question_text = EXCLUDED.question_text,
      answer_a = EXCLUDED.answer_a,
      answer_b = EXCLUDED.answer_b,
      answer_c = EXCLUDED.answer_c,
      updated_at = NOW();
  END IF;
  
  -- Update correct_answer column
  NEW.correct_answer := get_correct_answer_from_jsonb(NEW.answers);
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires before insert or update on questions table
DROP TRIGGER IF EXISTS trigger_sync_question_translations ON public.questions;
CREATE TRIGGER trigger_sync_question_translations
  BEFORE INSERT OR UPDATE OF question, answers
  ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_question_to_translations();