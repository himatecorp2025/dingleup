-- Create game_sessions table for server-side game validation
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL UNIQUE,
  category TEXT NOT NULL,
  questions JSONB NOT NULL,
  current_question INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own game sessions"
ON public.game_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game sessions"
ON public.game_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game sessions"
ON public.game_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX idx_game_sessions_session_id ON public.game_sessions(session_id);
CREATE INDEX idx_game_sessions_expires_at ON public.game_sessions(expires_at);

-- Cleanup function for expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_game_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.game_sessions
  WHERE expires_at < now() AND completed_at IS NULL;
END;
$$;