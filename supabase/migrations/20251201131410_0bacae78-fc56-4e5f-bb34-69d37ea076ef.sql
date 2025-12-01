-- PHASE 1: DATABASE LAYER SYNC - wallet_ledger RLS fix
-- Documentation requires: wallet_ledger INSERT should be service-role only via RPC
-- Found issue: "Authenticated can insert wallet ledger" policy allows direct INSERT from client

-- Drop the incorrect policy that allows authenticated users to insert directly
DROP POLICY IF EXISTS "Authenticated can insert wallet ledger" ON public.wallet_ledger;

-- Verify service role policy exists (already created in previous migrations)
-- Service role already has "Service role can manage all wallet ledger" policy with ALL command

-- NOTE: All wallet crediting MUST go through credit_wallet() or credit_lives() RPCs
-- This prevents race conditions, ensures idempotency, and maintains transaction safety