-- Add message status tracking
ALTER TABLE public.dm_messages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'error'));

-- Create message reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.dm_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('👍', '❤️', '😂', '😮', '😢', '😡')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Create typing status table
CREATE TABLE IF NOT EXISTS public.typing_status (
  thread_id UUID NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (thread_id, user_id)
);

-- Create message media table for images/files
CREATE TABLE IF NOT EXISTS public.message_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.dm_messages(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'file', 'video', 'audio')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_media ENABLE ROW LEVEL SECURITY;

-- RLS policies for reactions
CREATE POLICY "Users can view reactions in their threads"
ON public.message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dm_messages m
    JOIN public.dm_threads t ON m.thread_id = t.id
    WHERE m.id = message_reactions.message_id
    AND (t.user_id_a = auth.uid() OR t.user_id_b = auth.uid())
  )
);

CREATE POLICY "Users can add reactions"
ON public.message_reactions FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.dm_messages m
    JOIN public.dm_threads t ON m.thread_id = t.id
    WHERE m.id = message_reactions.message_id
    AND (t.user_id_a = auth.uid() OR t.user_id_b = auth.uid())
  )
);

CREATE POLICY "Users can remove their reactions"
ON public.message_reactions FOR DELETE
USING (user_id = auth.uid());

-- RLS policies for typing status
CREATE POLICY "Users can view typing in their threads"
ON public.typing_status FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dm_threads t
    WHERE t.id = typing_status.thread_id
    AND (t.user_id_a = auth.uid() OR t.user_id_b = auth.uid())
  )
);

CREATE POLICY "Users can update their typing status"
ON public.typing_status FOR ALL
USING (user_id = auth.uid());

-- RLS policies for message media
CREATE POLICY "Users can view media in their threads"
ON public.message_media FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dm_messages m
    JOIN public.dm_threads t ON m.thread_id = t.id
    WHERE m.id = message_media.message_id
    AND (t.user_id_a = auth.uid() OR t.user_id_b = auth.uid())
  )
);

CREATE POLICY "Users can add media to their messages"
ON public.message_media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dm_messages m
    WHERE m.id = message_media.message_id
    AND m.sender_id = auth.uid()
  )
);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_media;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_thread ON public.typing_status(thread_id);
CREATE INDEX IF NOT EXISTS idx_message_media_message ON public.message_media(message_id);