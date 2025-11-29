-- Restore invitations table (ACTIVE referral/invite system - NOT legacy!)
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL,
  invited_email TEXT,
  invited_user_id UUID,
  invitation_code TEXT NOT NULL UNIQUE,
  accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT invitations_invited_user_id_fkey FOREIGN KEY (invited_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS policies
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sent invitations"
  ON public.invitations FOR SELECT
  USING (auth.uid() = inviter_id);

CREATE POLICY "Users can view invitations sent to them"
  ON public.invitations FOR SELECT
  USING (auth.uid() = invited_user_id);

CREATE POLICY "Users can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Admins can view all invitations"
  ON public.invitations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON public.invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_user_id ON public.invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(invitation_code);