-- Create trigger for question_likes table to sync like counts
DROP TRIGGER IF EXISTS sync_question_like_count_trigger ON public.question_likes;

CREATE TRIGGER sync_question_like_count_trigger
  AFTER INSERT OR DELETE ON public.question_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_question_like_count();