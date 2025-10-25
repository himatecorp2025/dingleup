-- Create table to track weekly winners popup views
CREATE TABLE IF NOT EXISTS public.weekly_winners_popup_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  last_shown_week TEXT NOT NULL, -- Format: YYYY-WW (e.g., "2025-W43")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_weekly_winners_popup_views_user_id 
  ON public.weekly_winners_popup_views(user_id);

-- Enable RLS
ALTER TABLE public.weekly_winners_popup_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own popup view records
CREATE POLICY "Users can view their own popup views"
  ON public.weekly_winners_popup_views
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own popup view records
CREATE POLICY "Users can insert their own popup views"
  ON public.weekly_winners_popup_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own popup view records
CREATE POLICY "Users can update their own popup views"
  ON public.weekly_winners_popup_views
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all popup view records
CREATE POLICY "Admins can view all popup views"
  ON public.weekly_winners_popup_views
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));