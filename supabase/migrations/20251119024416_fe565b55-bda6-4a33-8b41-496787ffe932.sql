-- Játékos-profilozó rendszer táblák

-- 1. user_topic_stats: Játékos témánkénti statisztikái
CREATE TABLE IF NOT EXISTS public.user_topic_stats (
  user_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id           integer NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  answered_count     integer NOT NULL DEFAULT 0,
  correct_count      integer NOT NULL DEFAULT 0,
  like_count         integer NOT NULL DEFAULT 0,
  dislike_count      integer NOT NULL DEFAULT 0,
  avg_response_ms    integer,
  score              numeric(10,4) NOT NULL DEFAULT 0,
  last_answered_at   timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

-- 2. question_seen_history: Mely kérdéseket látta már a user
CREATE TABLE IF NOT EXISTS public.question_seen_history (
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  seen_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

-- 3. user_game_settings: AI-profilozás be/ki kapcsolása
CREATE TABLE IF NOT EXISTS public.user_game_settings (
  user_id                              uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  ai_personalized_questions_enabled    boolean NOT NULL DEFAULT true,
  created_at                           timestamptz NOT NULL DEFAULT now(),
  updated_at                           timestamptz NOT NULL DEFAULT now()
);

-- Indexek a teljesítmény növelésére
CREATE INDEX IF NOT EXISTS idx_user_topic_stats_user_id ON public.user_topic_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_stats_score ON public.user_topic_stats(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_question_seen_history_user_id ON public.question_seen_history(user_id);
CREATE INDEX IF NOT EXISTS idx_question_seen_history_seen_at ON public.question_seen_history(user_id, seen_at DESC);

-- RLS policies
ALTER TABLE public.user_topic_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_seen_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_settings ENABLE ROW LEVEL SECURITY;

-- user_topic_stats policies
CREATE POLICY "Users can view their own topic stats"
  ON public.user_topic_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all topic stats"
  ON public.user_topic_stats FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage topic stats"
  ON public.user_topic_stats FOR ALL
  USING (auth.role() = 'service_role'::text);

-- question_seen_history policies
CREATE POLICY "Users can view their own seen history"
  ON public.question_seen_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage seen history"
  ON public.question_seen_history FOR ALL
  USING (auth.role() = 'service_role'::text);

-- user_game_settings policies
CREATE POLICY "Users can view their own game settings"
  ON public.user_game_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own game settings"
  ON public.user_game_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game settings"
  ON public.user_game_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all game settings"
  ON public.user_game_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));