-- Create user_boosters table to store purchased boosters
CREATE TABLE public.user_boosters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booster_type TEXT NOT NULL CHECK (booster_type IN ('DoubleSpeed', 'MegaSpeed', 'GigaSpeed', 'DingleSpeed')),
  activated BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_boosters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_boosters
CREATE POLICY "Users can view their own boosters"
ON public.user_boosters
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own boosters"
ON public.user_boosters
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boosters"
ON public.user_boosters
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boosters"
ON public.user_boosters
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_boosters_user_id ON public.user_boosters(user_id);
CREATE INDEX idx_user_boosters_activated ON public.user_boosters(user_id, activated);