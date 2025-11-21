-- Fix security warnings: Add search_path to immutable function

CREATE OR REPLACE FUNCTION public.get_correct_answer_from_jsonb(answers_jsonb JSONB)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
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