-- Töröljük a meglévő triggert CASCADE-del
DROP TRIGGER IF EXISTS trigger_sync_question_translations ON questions CASCADE;
DROP FUNCTION IF EXISTS sync_question_to_translations() CASCADE;

-- Újra létrehozzuk AFTER INSERT módban
CREATE OR REPLACE FUNCTION sync_question_to_translations()
RETURNS TRIGGER AS $$
BEGIN
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_question_translations
AFTER INSERT ON questions
FOR EACH ROW
EXECUTE FUNCTION sync_question_to_translations();