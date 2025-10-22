-- Add subscriber_type column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscriber_type TEXT DEFAULT 'paid' CHECK (subscriber_type IN ('paid', 'comp'));

-- Set comp user (himatecorp2025@gmail.com) as permanent Genius subscriber
UPDATE public.profiles
SET 
  is_subscribed = true,
  subscriber_type = 'comp',
  subscriber_since = NOW(),
  subscriber_renew_at = NOW() + INTERVAL '100 years'
WHERE email = 'himatecorp2025@gmail.com';

-- Create index for faster subscriber queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscriber_type ON public.profiles(subscriber_type);

COMMENT ON COLUMN public.profiles.subscriber_type IS 'Type of subscription: paid (Stripe) or comp (complimentary/test)';