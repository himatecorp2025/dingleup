-- Enable RLS on leaderboard_public_cache (everyone can SELECT, only server-side functions can INSERT/UPDATE/DELETE)
ALTER TABLE public.leaderboard_public_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard cache"
ON public.leaderboard_public_cache
FOR SELECT
USING (true);

-- Service role only for insert/update/delete (security definer function already handles this)
CREATE POLICY "Only server functions can modify leaderboard cache"
ON public.leaderboard_public_cache
FOR ALL
USING (false)
WITH CHECK (false);