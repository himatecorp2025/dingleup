-- Backfill friendships from existing invitations
-- Create friendships for all accepted invitations
INSERT INTO public.friendships (user_id_a, user_id_b, status, created_at)
SELECT 
  inviter_id,
  invited_user_id,
  'active',
  accepted_at
FROM public.invitations
WHERE accepted = true
  AND invited_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE (f.user_id_a = invitations.inviter_id AND f.user_id_b = invitations.invited_user_id)
       OR (f.user_id_a = invitations.invited_user_id AND f.user_id_b = invitations.inviter_id)
  )
ON CONFLICT DO NOTHING;

-- Create function to automatically create friendship when invitation is accepted
CREATE OR REPLACE FUNCTION public.create_friendship_on_invitation_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if invitation was just accepted
  IF NEW.accepted = true AND OLD.accepted = false AND NEW.invited_user_id IS NOT NULL THEN
    -- Create friendship if it doesn't exist
    INSERT INTO public.friendships (user_id_a, user_id_b, status, created_at)
    VALUES (NEW.inviter_id, NEW.invited_user_id, 'active', NEW.accepted_at)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic friendship creation
DROP TRIGGER IF EXISTS auto_create_friendship_on_accept ON public.invitations;
CREATE TRIGGER auto_create_friendship_on_accept
  AFTER UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_friendship_on_invitation_accept();