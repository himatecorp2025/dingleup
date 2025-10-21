-- Create purchases table to track all in-app purchases
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL, -- 'DoubleSpeed', 'MegaSpeed', 'GigaSpeed', 'DingleSpeed'
  payment_method TEXT NOT NULL, -- 'coins' or 'stripe'
  amount_usd NUMERIC(10, 2), -- Amount in USD (for stripe payments)
  amount_coins INTEGER, -- Amount in coins (for coin payments)
  stripe_payment_intent_id TEXT, -- Stripe payment intent ID
  stripe_charge_id TEXT, -- Stripe charge ID
  country TEXT, -- User's country
  currency TEXT, -- Payment currency
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'pending', 'failed', 'refunded'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB -- Additional data (device info, app version, etc.)
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
ON public.purchases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all purchases
CREATE POLICY "Admins can view all purchases"
ON public.purchases
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert purchases
CREATE POLICY "Service role can insert purchases"
ON public.purchases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_created_at ON public.purchases(created_at DESC);
CREATE INDEX idx_purchases_country ON public.purchases(country);
CREATE INDEX idx_purchases_product_type ON public.purchases(product_type);