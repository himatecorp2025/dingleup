-- Ensure realtime works and public read for weekly rankings
-- 1) Add table to realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication p
    JOIN pg_publication_tables pt ON p.pubname = 'supabase_realtime' AND pt.pubname = 'supabase_realtime'
    WHERE pt.schemaname = 'public' AND pt.tablename = 'weekly_rankings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_rankings;
  END IF;
END$$;

-- 2) Send full row images for updates
ALTER TABLE public.weekly_rankings REPLICA IDENTITY FULL;

-- 3) RLS: allow SELECT for everyone (leaderboard is public data)
ALTER TABLE public.weekly_rankings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'weekly_rankings' AND policyname = 'public_read_weekly_rankings'
  ) THEN
    CREATE POLICY public_read_weekly_rankings
      ON public.weekly_rankings
      FOR SELECT
      USING (true);
  END IF;
END $$;
