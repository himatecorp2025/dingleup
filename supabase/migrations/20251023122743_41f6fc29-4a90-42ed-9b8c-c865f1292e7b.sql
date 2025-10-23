-- Fix RLS for weekly_login_rewards (config table - read-only for users)
ALTER TABLE public.weekly_login_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weekly login rewards"
ON public.weekly_login_rewards FOR SELECT
USING (true);

CREATE POLICY "Service role can manage rewards config"
ON public.weekly_login_rewards FOR ALL
USING (auth.role() = 'service_role');