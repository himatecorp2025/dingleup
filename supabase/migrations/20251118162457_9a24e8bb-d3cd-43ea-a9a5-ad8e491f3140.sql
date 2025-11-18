-- Create question_likes table for TikTok-style question liking
CREATE TABLE IF NOT EXISTS public.question_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_question_like UNIQUE (question_id, user_id)
);

-- Add like_count column to questions table (denormalized for performance)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_likes_question_id ON public.question_likes(question_id);
CREATE INDEX IF NOT EXISTS idx_question_likes_user_id ON public.question_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_like_count ON public.questions(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id_like_count ON public.questions(topic_id, like_count DESC);

-- Enable RLS on question_likes
ALTER TABLE public.question_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for question_likes
CREATE POLICY "Users can view all question likes"
  ON public.question_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own likes"
  ON public.question_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.question_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update like_count on questions table
CREATE OR REPLACE FUNCTION public.sync_question_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.questions
    SET like_count = like_count + 1
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.questions
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update like_count
CREATE TRIGGER trigger_sync_question_like_count
  AFTER INSERT OR DELETE ON public.question_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_question_like_count();

-- Backfill existing questions like_count (set to 0 if null)
UPDATE public.questions SET like_count = 0 WHERE like_count IS NULL;