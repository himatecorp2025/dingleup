-- Create topics table with 25 predefined topics
CREATE TABLE IF NOT EXISTS public.topics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert 25 topics
INSERT INTO public.topics (name, description) VALUES
('Egészség', 'Általános egészségügyi ismeretek'),
('Fitnesz', 'Edzés, testmozgás, sportolás'),
('Táplálkozás', 'Táplálkozástudományos ismeretek'),
('Orvostudomány', 'Orvosi és klinikai ismeretek'),
('Mentális egészség', 'Lelki egészség és jóllét'),
('Magyar történelem', 'Magyar történelmi események'),
('Világtörténelem', 'Nemzetközi történelmi események'),
('Ókori civilizációk', 'Antik kultúrák és civilizációk'),
('Technológia', 'Technológiai újítások és találmányok'),
('Tudomány', 'Általános tudományos ismeretek'),
('Földrajz', 'Földrajzi és geológiai ismeretek'),
('Irodalom', 'Általános irodalmi művek'),
('Magyar irodalom', 'Magyar költők és írók művei'),
('Zene', 'Általános zenei ismeretek'),
('Klasszikus zene', 'Klasszikus zeneszerzők és műveik'),
('Művészet', 'Képzőművészeti alkotások'),
('Építészet', 'Építészeti stílusok és épületek'),
('Film és színház', 'Filmművészet és színházi előadások'),
('Popkultúra', 'Modern popkulturális ismeretek'),
('Pénzügy', 'Pénzügyi alapismeretek'),
('Befektetés', 'Befektetési stratégiák és eszközök'),
('Vállalkozás', 'Vállalkozói ismeretek'),
('Gazdaság', 'Makrogazdasági és mikrogazdasági alapok'),
('Önismeret', 'Önismeret és személyiségfejlesztés'),
('Pszichológia', 'Pszichológiai ismeretek és modellek');

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answers JSONB NOT NULL,
  audience JSONB NOT NULL,
  third TEXT NOT NULL,
  topic_id INTEGER REFERENCES public.topics(id),
  source_category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on topics table
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Everyone can read topics
CREATE POLICY "Anyone can view topics"
  ON public.topics
  FOR SELECT
  USING (true);

-- Enable RLS on questions table
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Everyone can read questions
CREATE POLICY "Anyone can view questions"
  ON public.questions
  FOR SELECT
  USING (true);

-- Only service role can manage questions
CREATE POLICY "Service role can manage questions"
  ON public.questions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');