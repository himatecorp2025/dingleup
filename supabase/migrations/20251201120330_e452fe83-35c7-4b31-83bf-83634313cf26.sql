-- PHASE 1 OPTIMIZATION: Materialized View for Daily Rankings
-- This eliminates the O(N log N) rank recalculation from happening on EVERY game completion
-- Instead, ranks are computed every 5 minutes in the background

-- Create materialized view for current daily rankings with pre-computed ranks
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_daily_rankings_current AS
SELECT 
  dr.user_id,
  dr.day_date,
  dr.category,
  dr.total_correct_answers,
  dr.average_response_time,
  p.username,
  p.avatar_url,
  p.country_code,
  ROW_NUMBER() OVER (
    PARTITION BY dr.day_date, dr.category, p.country_code
    ORDER BY dr.total_correct_answers DESC, dr.average_response_time ASC
  ) AS rank,
  NOW() AS refreshed_at
FROM public.daily_rankings dr
INNER JOIN public.profiles p ON dr.user_id = p.id
WHERE dr.day_date = CURRENT_DATE
  AND p.country_code IS NOT NULL;

-- Create unique index for CONCURRENTLY refresh support
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_rankings_unique 
ON public.mv_daily_rankings_current (user_id, day_date, category, country_code);

-- Create performance indexes on the materialized view
CREATE INDEX IF NOT EXISTS idx_mv_daily_rankings_country_rank
ON public.mv_daily_rankings_current (country_code, day_date, category, rank);

CREATE INDEX IF NOT EXISTS idx_mv_daily_rankings_user_lookup
ON public.mv_daily_rankings_current (user_id, day_date);

-- Initial population
REFRESH MATERIALIZED VIEW public.mv_daily_rankings_current;