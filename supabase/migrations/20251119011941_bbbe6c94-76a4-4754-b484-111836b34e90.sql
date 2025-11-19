-- Fix double-counting of question likes by removing duplicate trigger
DROP TRIGGER IF EXISTS trigger_sync_question_like_count ON public.question_likes;

-- Recalculate like_count for all questions based on current likes table
UPDATE public.questions q
SET like_count = COALESCE((
  SELECT COUNT(*) FROM public.question_likes l
  WHERE l.question_id = q.id
), 0);