-- Enable realtime for leaderboard_cache table
ALTER TABLE public.leaderboard_cache REPLICA IDENTITY FULL;

-- Check if leaderboard_cache is already in publication, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'leaderboard_cache'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_cache;
  END IF;
END $$;

-- Enable realtime for daily_prize_table
ALTER TABLE public.daily_prize_table REPLICA IDENTITY FULL;

-- Check if daily_prize_table is already in publication, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'daily_prize_table'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_prize_table;
  END IF;
END $$;