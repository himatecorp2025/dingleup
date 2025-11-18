-- Drop unused materialized view refresh functions
DROP FUNCTION IF EXISTS public.refresh_leaderboard_cache() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_admin_stats() CASCADE;

-- Drop unused materialized views
DROP MATERIALIZED VIEW IF EXISTS public.leaderboard_cache CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.admin_stats_summary CASCADE;

-- Drop trigger function that references the refresh (if exists)
DROP FUNCTION IF EXISTS public.trg_refresh_leaderboard_public_cache() CASCADE;

-- The leaderboard_public_cache is a regular table, not a materialized view
-- It's managed by the refresh_leaderboard_public_cache() function which we keep
-- No changes needed for leaderboard_public_cache itself