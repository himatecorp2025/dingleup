-- Admin can view all invitations
CREATE POLICY "Admins can view all invitations" 
ON public.invitations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));