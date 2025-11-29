-- Fix invitations table foreign keys to point to profiles table (not auth.users)
ALTER TABLE public.invitations 
  DROP CONSTRAINT IF EXISTS invitations_inviter_id_fkey,
  DROP CONSTRAINT IF EXISTS invitations_invited_user_id_fkey;

-- Add correct foreign keys to profiles table
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_inviter_id_fkey 
    FOREIGN KEY (inviter_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT invitations_invited_user_id_fkey 
    FOREIGN KEY (invited_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;