
-- Add INSERT policy for wallet_ledger to allow edge functions to insert
CREATE POLICY "Authenticated can insert wallet ledger"
ON public.wallet_ledger
FOR INSERT
TO authenticated
WITH CHECK (true);
