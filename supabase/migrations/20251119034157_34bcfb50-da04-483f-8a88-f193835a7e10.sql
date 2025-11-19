-- Create user_ad_interest_candidates table for ad interest analytics
CREATE TABLE public.user_ad_interest_candidates (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id integer NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  interest_score numeric(10,4) NOT NULL DEFAULT 0,
  last_update timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

-- Create index for faster queries
CREATE INDEX idx_user_ad_interest_user_id ON public.user_ad_interest_candidates(user_id);
CREATE INDEX idx_user_ad_interest_topic_id ON public.user_ad_interest_candidates(topic_id);
CREATE INDEX idx_user_ad_interest_score ON public.user_ad_interest_candidates(interest_score DESC);

-- Enable RLS
ALTER TABLE public.user_ad_interest_candidates ENABLE ROW LEVEL SECURITY;

-- Admin can view all ad interest data
CREATE POLICY "Admins can view all ad interests"
ON public.user_ad_interest_candidates
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage ad interests
CREATE POLICY "Service role can manage ad interests"
ON public.user_ad_interest_candidates
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');