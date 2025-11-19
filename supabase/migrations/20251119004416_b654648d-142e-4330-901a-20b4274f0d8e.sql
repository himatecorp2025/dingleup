-- Create question_dislikes table (questions.id is TEXT not UUID!)
CREATE TABLE IF NOT EXISTS public.question_dislikes (
  id bigserial PRIMARY KEY,
  question_id text NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, user_id)
);

-- Add dislike_count to questions table
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS dislike_count integer NOT NULL DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_question_dislikes_question_id ON public.question_dislikes(question_id);
CREATE INDEX IF NOT EXISTS idx_question_dislikes_user_id ON public.question_dislikes(user_id);

-- Enable RLS on question_dislikes
ALTER TABLE public.question_dislikes ENABLE ROW LEVEL SECURITY;

-- RLS policies for question_dislikes
CREATE POLICY "Users can view all dislikes"
  ON public.question_dislikes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own dislikes"
  ON public.question_dislikes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dislikes"
  ON public.question_dislikes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to sync dislike count (similar to like count trigger)
CREATE OR REPLACE FUNCTION public.sync_question_dislike_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.questions
    SET dislike_count = dislike_count + 1
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.questions
    SET dislike_count = GREATEST(0, dislike_count - 1)
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for dislike count sync
DROP TRIGGER IF EXISTS sync_question_dislike_count_trigger ON public.question_dislikes;
CREATE TRIGGER sync_question_dislike_count_trigger
  AFTER INSERT OR DELETE ON public.question_dislikes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_question_dislike_count();