-- Create a truly public cache for leaderboard (no user_id)
CREATE TABLE IF NOT EXISTS public.leaderboard_public_cache (
  rank integer PRIMARY KEY,
  username text NOT NULL,
  avatar_url text,
  total_correct_answers integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT ON public.leaderboard_public_cache TO anon, authenticated;

-- Refresh procedure (SECURITY DEFINER) to populate cache from global_leaderboard
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_public_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(1234567890);

  DELETE FROM public.leaderboard_public_cache;

  INSERT INTO public.leaderboard_public_cache (rank, username, avatar_url, total_correct_answers, updated_at)
  SELECT 
    COALESCE(gl.rank, ROW_NUMBER() OVER (ORDER BY gl.total_correct_answers DESC, gl.updated_at DESC)) AS rank,
    gl.username,
    gl.avatar_url,
    gl.total_correct_answers,
    gl.updated_at
  FROM public.global_leaderboard gl
  ORDER BY 
    COALESCE(gl.rank, 2147483647) ASC,
    gl.total_correct_answers DESC
  LIMIT 100;
END;
$$;

-- Trigger wrapper to call the refresh on any change
CREATE OR REPLACE FUNCTION public.trg_refresh_leaderboard_public_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_leaderboard_public_cache();
  RETURN NULL; -- statement-level trigger
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_leaderboard_public_cache ON public.global_leaderboard;
CREATE TRIGGER trg_refresh_leaderboard_public_cache
AFTER INSERT OR UPDATE OR DELETE ON public.global_leaderboard
FOR EACH STATEMENT
EXECUTE FUNCTION public.trg_refresh_leaderboard_public_cache();

-- Initial populate so clients immediately see data
SELECT public.refresh_leaderboard_public_cache();