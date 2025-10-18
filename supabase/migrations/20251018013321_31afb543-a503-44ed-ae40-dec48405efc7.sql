-- Create a table for newsletter subscribers
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to subscribe
CREATE POLICY "Anyone can subscribe" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (true);

-- Policy: Only service role can view subscribers
CREATE POLICY "Service role can view subscribers" 
ON public.subscribers 
FOR SELECT 
USING (auth.role() = 'service_role');