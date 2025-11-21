
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view translations" ON public.translations;

-- Create new policy that allows everyone (including anon) to view translations
CREATE POLICY "Public can view translations"
  ON public.translations
  FOR SELECT
  TO public
  USING (true);
