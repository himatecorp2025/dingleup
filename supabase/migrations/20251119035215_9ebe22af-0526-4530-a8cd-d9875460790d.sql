-- Enable RLS for topics table (if not already enabled)
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to read all topics
CREATE POLICY "Admins can read all topics"
ON public.topics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Also allow public read access for topics (since questions reference them)
CREATE POLICY "Public can read topics"
ON public.topics
FOR SELECT
TO public
USING (true);