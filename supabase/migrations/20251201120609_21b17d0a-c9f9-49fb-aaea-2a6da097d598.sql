-- PHASE 2 OPTIMIZATION: Wallet ledger growth management
-- Creates archive table and maintenance function to prevent unbounded growth
-- (Partitioning deferred to Phase 3 due to Supabase constraints)

-- Create archive table for old wallet ledger entries
CREATE TABLE IF NOT EXISTS public.wallet_ledger_archive (
  LIKE public.wallet_ledger INCLUDING ALL
);

-- Add archive timestamp
ALTER TABLE public.wallet_ledger_archive
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on archive table
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_archive_user_created
ON public.wallet_ledger_archive (user_id, created_at DESC);

-- Create archive function (archives entries older than 90 days)
CREATE OR REPLACE FUNCTION public.archive_old_wallet_ledger()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_archived_count INTEGER;
  v_cutoff_date DATE;
BEGIN
  -- Archive entries older than 90 days
  v_cutoff_date := CURRENT_DATE - INTERVAL '90 days';
  
  -- Copy to archive
  INSERT INTO public.wallet_ledger_archive 
  SELECT *, NOW() as archived_at
  FROM public.wallet_ledger
  WHERE created_at < v_cutoff_date;
  
  GET DIAGNOSTICS v_archived_count = ROW_COUNT;
  
  -- Delete from main table
  DELETE FROM public.wallet_ledger
  WHERE created_at < v_cutoff_date;
  
  RETURN jsonb_build_object(
    'success', true,
    'archived_count', v_archived_count,
    'cutoff_date', v_cutoff_date
  );
END;
$$;

COMMENT ON FUNCTION public.archive_old_wallet_ledger() IS 
'Archives wallet ledger entries older than 90 days to prevent table bloat. Run monthly via cron.';

-- Create similar archive for lives_ledger
CREATE TABLE IF NOT EXISTS public.lives_ledger_archive (
  LIKE public.lives_ledger INCLUDING ALL
);

ALTER TABLE public.lives_ledger_archive
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_lives_ledger_archive_user_created
ON public.lives_ledger_archive (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.archive_old_lives_ledger()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_archived_count INTEGER;
  v_cutoff_date DATE;
BEGIN
  v_cutoff_date := CURRENT_DATE - INTERVAL '90 days';
  
  INSERT INTO public.lives_ledger_archive 
  SELECT *, NOW() as archived_at
  FROM public.lives_ledger
  WHERE created_at < v_cutoff_date;
  
  GET DIAGNOSTICS v_archived_count = ROW_COUNT;
  
  DELETE FROM public.lives_ledger
  WHERE created_at < v_cutoff_date;
  
  RETURN jsonb_build_object(
    'success', true,
    'archived_count', v_archived_count,
    'cutoff_date', v_cutoff_date
  );
END;
$$;