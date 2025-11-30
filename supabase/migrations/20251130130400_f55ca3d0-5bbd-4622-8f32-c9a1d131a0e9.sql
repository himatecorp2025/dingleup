-- Enable realtime for all critical tables

-- profiles table
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- wallet_ledger table
ALTER TABLE public.wallet_ledger REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'wallet_ledger'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_ledger;
  END IF;
END $$;

-- lives_ledger table
ALTER TABLE public.lives_ledger REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'lives_ledger'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lives_ledger;
  END IF;
END $$;

-- game_results table
ALTER TABLE public.game_results REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'game_results'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_results;
  END IF;
END $$;

-- booster_purchases table
ALTER TABLE public.booster_purchases REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'booster_purchases'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booster_purchases;
  END IF;
END $$;

-- purchases table
ALTER TABLE public.purchases REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'purchases'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;
  END IF;
END $$;

-- question_likes table
ALTER TABLE public.question_likes REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'question_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.question_likes;
  END IF;
END $$;

-- question_dislikes table
ALTER TABLE public.question_dislikes REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'question_dislikes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.question_dislikes;
  END IF;
END $$;

-- game_question_analytics table
ALTER TABLE public.game_question_analytics REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'game_question_analytics'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_question_analytics;
  END IF;
END $$;