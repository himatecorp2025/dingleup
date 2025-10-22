-- KRITIKUS BIZTONSÁGI JAVÍTÁSOK - Javított verzió

-- 1. Email címek és érzékeny adatok védelme a profiles táblában
DROP POLICY IF EXISTS "Users can view public profile info for search and social features" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Felhasználók láthatják saját teljes profiljukat
CREATE POLICY "Users can view own complete profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Csak bizonyos mezők láthatóak mindenki számára (search, leaderboard)
-- FIGYELEM: Ez a policy lehetővé teszi a SELECT-et, de az alkalmazásnak
-- csak a biztonságos mezőket kell lekérdeznie (id, username, avatar_url, invitation_code)
CREATE POLICY "Users can search other profiles with limited fields"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id != auth.uid()
  );


-- 2. User presence védelme - csak barátok és saját magunk láthatjuk
DROP POLICY IF EXISTS "Anyone can view user presence" ON public.user_presence;

CREATE POLICY "Users can view own and friends presence"
  ON public.user_presence
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'active'
        AND (
          (f.user_id_a = auth.uid() AND f.user_id_b = user_presence.user_id) OR
          (f.user_id_b = auth.uid() AND f.user_id_a = user_presence.user_id)
        )
    )
  );