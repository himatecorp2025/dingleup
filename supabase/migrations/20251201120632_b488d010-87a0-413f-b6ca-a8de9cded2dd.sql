-- Fix RLS on archive tables (they should not be directly accessible by users)
ALTER TABLE public.wallet_ledger_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lives_ledger_archive ENABLE ROW LEVEL SECURITY;

-- No policies needed - these tables are only accessed via service role functions
COMMENT ON TABLE public.wallet_ledger_archive IS 'Archive table for old wallet ledger entries. Only accessible via archive_old_wallet_ledger() function.';
COMMENT ON TABLE public.lives_ledger_archive IS 'Archive table for old lives ledger entries. Only accessible via archive_old_lives_ledger() function.';