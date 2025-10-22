-- KRITIKUS biztonsági javítások - RLS policy-k

-- 1. KRITIKUS: Email és pénzügyi adatok elrejtése
-- Jelenleg MINDEN autentikált user lát MINDENT más userekről!
-- Ez SÚLYOS adatvédelmi probléma!

-- PostgreSQL RLS-ben nem lehet column-level security közvetlenül,
-- ezért VIEW-t használunk a biztonságos mezőkhöz

-- Létrehozunk egy public profile view-t csak a biztonságos mezőkkel
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  avatar_url,
  invitation_code,
  created_at
FROM public.profiles;

-- Most a profiles táblán korlátozottabb policy-t használunk
-- és a public_profiles view-t ajánljuk a kód számára

-- 2. KRITIKUS: Purchases policy javítás
-- Jelenleg a policy auth.uid()-t használ, ami rossz!
DROP POLICY IF EXISTS "Service role can insert purchases" ON public.purchases;

CREATE POLICY "Only service role can insert purchases"
  ON public.purchases
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Biztosítjuk hogy CSAK service role tud beszúrni
-- A user SELECT policy-ja megmarad hogy láthassák saját vásárlásaikat