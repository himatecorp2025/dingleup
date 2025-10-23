-- Extend friendships status enum
ALTER TABLE public.friendships 
  DROP CONSTRAINT IF EXISTS friendships_status_check;

ALTER TABLE public.friendships 
  ADD CONSTRAINT friendships_status_check 
  CHECK (status IN ('active', 'pending', 'blocked', 'declined', 'canceled'));

-- Add source column to friendships to track if it's from invite or referral
ALTER TABLE public.friendships 
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'invite' 
  CHECK (source IN ('invite', 'referral'));

-- Create thread_participants table for managing chat permissions
CREATE TABLE IF NOT EXISTS public.thread_participants (
  thread_id uuid NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_send boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_thread_participants_user 
  ON public.thread_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_participants_thread 
  ON public.thread_participants(thread_id);

CREATE INDEX IF NOT EXISTS idx_friendships_status 
  ON public.friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_requested_by 
  ON public.friendships(requested_by);

CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_created 
  ON public.dm_messages(thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_presence_online 
  ON public.user_presence(is_online, last_seen DESC);

-- Enable RLS on thread_participants
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for thread_participants
CREATE POLICY "Users can view their thread participants"
  ON public.thread_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dm_threads t
      WHERE t.id = thread_participants.thread_id
        AND (t.user_id_a = auth.uid() OR t.user_id_b = auth.uid())
    )
  );

CREATE POLICY "Service can manage thread participants"
  ON public.thread_participants FOR ALL
  USING (auth.role() = 'service_role');

-- Function to sync referrals to friendships automatically
CREATE OR REPLACE FUNCTION public.sync_referral_to_friendship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_ids uuid[];
BEGIN
  -- Only process accepted invitations
  IF NEW.accepted = true AND NEW.invited_user_id IS NOT NULL THEN
    normalized_ids := normalize_user_ids(NEW.inviter_id, NEW.invited_user_id);
    
    -- Create friendship with referral source
    INSERT INTO public.friendships (user_id_a, user_id_b, status, source, requested_by)
    VALUES (normalized_ids[1], normalized_ids[2], 'active', 'referral', NEW.inviter_id)
    ON CONFLICT (user_id_a, user_id_b) 
    DO UPDATE SET status = 'active', source = 'referral', updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-syncing referrals
DROP TRIGGER IF EXISTS sync_referral_friendship ON public.invitations;
CREATE TRIGGER sync_referral_friendship
  AFTER UPDATE ON public.invitations
  FOR EACH ROW
  WHEN (NEW.accepted = true AND OLD.accepted = false)
  EXECUTE FUNCTION public.sync_referral_to_friendship();

-- Enable realtime only for tables that aren't already enabled
DO $$
BEGIN
  -- Try to add friendships to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Table already in publication
  END;

  -- Try to add thread_participants to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.thread_participants;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Table already in publication
  END;
END $$;