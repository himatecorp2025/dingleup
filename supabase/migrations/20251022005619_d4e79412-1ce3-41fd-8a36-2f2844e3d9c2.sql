-- Create friendships table for bidirectional friend connections
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_a UUID NOT NULL,  -- Always LEAST(user1, user2)
  user_id_b UUID NOT NULL,  -- Always GREATEST(user1, user2)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id_a, user_id_b)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_a ON public.friendships(user_id_a);
CREATE INDEX IF NOT EXISTS idx_friendships_user_b ON public.friendships(user_id_b);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Create dm_threads table for direct message threads
CREATE TABLE IF NOT EXISTS public.dm_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_a UUID NOT NULL,  -- Always LEAST(user1, user2)
  user_id_b UUID NOT NULL,  -- Always GREATEST(user1, user2)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id_a, user_id_b)
);

CREATE INDEX IF NOT EXISTS idx_dm_threads_users ON public.dm_threads(user_id_a, user_id_b);
CREATE INDEX IF NOT EXISTS idx_dm_threads_last_message ON public.dm_threads(last_message_at DESC);

-- Create messages table (note: we already have a messages table, so we'll call this dm_messages)
CREATE TABLE IF NOT EXISTS public.dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL CHECK (length(body) <= 2000 AND length(trim(body)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_created ON public.dm_messages(thread_id, created_at DESC);

-- Create message_reads table for tracking read status
CREATE TABLE IF NOT EXISTS public.message_reads (
  thread_id UUID NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

-- Helper function to normalize user IDs (always returns [smaller, larger])
CREATE OR REPLACE FUNCTION public.normalize_user_ids(uid1 UUID, uid2 UUID)
RETURNS UUID[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF uid1 < uid2 THEN
    RETURN ARRAY[uid1, uid2];
  ELSE
    RETURN ARRAY[uid2, uid1];
  END IF;
END;
$$;

-- Trigger to update thread's last_message_at
CREATE OR REPLACE FUNCTION public.update_thread_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.dm_threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_dm_thread_timestamp
AFTER INSERT ON public.dm_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_thread_last_message();

-- Function to create friendship and DM thread when invitation is accepted
CREATE OR REPLACE FUNCTION public.create_friendship_from_invitation(p_inviter_id UUID, p_invitee_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  normalized_ids UUID[];
  v_friendship_id UUID;
  v_thread_id UUID;
BEGIN
  -- Normalize user IDs
  normalized_ids := normalize_user_ids(p_inviter_id, p_invitee_id);
  
  -- Insert or update friendship
  INSERT INTO public.friendships (user_id_a, user_id_b, status)
  VALUES (normalized_ids[1], normalized_ids[2], 'active')
  ON CONFLICT (user_id_a, user_id_b) 
  DO UPDATE SET status = 'active', updated_at = now()
  RETURNING id INTO v_friendship_id;
  
  -- Insert or get DM thread
  INSERT INTO public.dm_threads (user_id_a, user_id_b)
  VALUES (normalized_ids[1], normalized_ids[2])
  ON CONFLICT (user_id_a, user_id_b) 
  DO NOTHING
  RETURNING id INTO v_thread_id;
  
  -- If thread already existed, get its ID
  IF v_thread_id IS NULL THEN
    SELECT id INTO v_thread_id FROM public.dm_threads
    WHERE user_id_a = normalized_ids[1] AND user_id_b = normalized_ids[2];
  END IF;
  
  -- Initialize message reads for both users
  INSERT INTO public.message_reads (thread_id, user_id, last_read_at)
  VALUES 
    (v_thread_id, p_inviter_id, now()),
    (v_thread_id, p_invitee_id, now())
  ON CONFLICT (thread_id, user_id) DO NOTHING;
  
  RETURN json_build_object(
    'success', true,
    'friendship_id', v_friendship_id,
    'thread_id', v_thread_id
  );
END;
$$;

-- RLS Policies for friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
ON public.friendships FOR SELECT
USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);

CREATE POLICY "Users can create friendships"
ON public.friendships FOR INSERT
WITH CHECK (auth.uid() = user_id_a OR auth.uid() = user_id_b);

CREATE POLICY "Users can update their friendships"
ON public.friendships FOR UPDATE
USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);

-- RLS Policies for dm_threads
ALTER TABLE public.dm_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their threads"
ON public.dm_threads FOR SELECT
USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);

CREATE POLICY "Users can create threads"
ON public.dm_threads FOR INSERT
WITH CHECK (auth.uid() = user_id_a OR auth.uid() = user_id_b);

-- RLS Policies for dm_messages
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their threads"
ON public.dm_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dm_threads
    WHERE dm_threads.id = dm_messages.thread_id
    AND (dm_threads.user_id_a = auth.uid() OR dm_threads.user_id_b = auth.uid())
  )
);

CREATE POLICY "Users can send messages to their threads"
ON public.dm_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.dm_threads
    WHERE dm_threads.id = dm_messages.thread_id
    AND (dm_threads.user_id_a = auth.uid() OR dm_threads.user_id_b = auth.uid())
  )
);

-- RLS Policies for message_reads
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their message reads"
ON public.message_reads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their message reads"
ON public.message_reads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update read status"
ON public.message_reads FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime for dm_messages (optional but recommended)
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages;