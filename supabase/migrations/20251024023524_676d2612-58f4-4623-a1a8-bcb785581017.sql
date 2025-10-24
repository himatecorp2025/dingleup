-- Add admin policies for friendships and dm_messages tables

-- Admin policy for friendships table
CREATE POLICY "Admins can view all friendships"
ON public.friendships
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policy for dm_messages table  
CREATE POLICY "Admins can view all messages"
ON public.dm_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));