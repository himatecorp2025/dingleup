-- További biztonsági policy-k

-- Game results táblához szigorúbb policy
-- Csak server-side functions írhatnak ide
DROP POLICY IF EXISTS "Users can insert their own game results" ON public.game_results;

CREATE POLICY "Only service role can insert game results"
  ON public.game_results
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- A SELECT policy megmarad, hogy a user láthassa saját eredményeit


-- Reports táblához character limit check
-- (Az RLS már megfelelő, csak biztosítjuk hogy ne lehessen túl hosszú szöveg)
ALTER TABLE public.reports 
  ADD CONSTRAINT bug_description_length 
  CHECK (length(bug_description) <= 2000);

ALTER TABLE public.reports 
  ADD CONSTRAINT violation_description_length 
  CHECK (length(violation_description) <= 2000);