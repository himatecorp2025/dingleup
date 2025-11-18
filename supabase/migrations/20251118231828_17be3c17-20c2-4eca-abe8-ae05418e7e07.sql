-- Fix RLS policy violations for analytics tables
-- Add proper RLS policies to protect user data

-- navigation_events table
ALTER TABLE public.navigation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own navigation events"
ON public.navigation_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own navigation events"
ON public.navigation_events
FOR SELECT
USING (auth.uid() = user_id);

-- app_session_events table
ALTER TABLE public.app_session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own session events"
ON public.app_session_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own session events"
ON public.app_session_events
FOR SELECT
USING (auth.uid() = user_id);

-- Admin access for both tables
CREATE POLICY "Admins can view all navigation events"
ON public.navigation_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can view all session events"
ON public.app_session_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);