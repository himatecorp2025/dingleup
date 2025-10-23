-- Create trigger to automatically create friendships when an invitation is accepted
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_create_friendship_on_invitation_accept'
  ) THEN
    CREATE TRIGGER trg_create_friendship_on_invitation_accept
    AFTER UPDATE OF accepted ON public.invitations
    FOR EACH ROW
    WHEN (NEW.accepted = true AND COALESCE(OLD.accepted, false) = false AND NEW.invited_user_id IS NOT NULL)
    EXECUTE FUNCTION public.create_friendship_on_invitation_accept();
  END IF;
END $$;
