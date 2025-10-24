-- Document data collection start dates for admin analytics
-- This migration adds documentation about when data collection started for each analytics feature

-- Add comment to game_help_usage table documenting data collection start
COMMENT ON TABLE public.game_help_usage IS 'Tracks usage of help features (third, skip, audience, 2x_answer) during games. DATA COLLECTION START: 2025-10-24 00:15:58 UTC - No historical data exists before this date. The table was created on 2025-10-24, so all help usage data before this date is not available.';

-- Add comment to game_results table for reference
COMMENT ON TABLE public.game_results IS 'Stores completed game results. Historical data available from 2025-10-17. Help usage tracking (game_help_usage table) only available from 2025-10-24.';

-- Create a metadata table to track data collection milestones
CREATE TABLE IF NOT EXISTS public.data_collection_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL UNIQUE,
  collection_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.data_collection_metadata ENABLE ROW LEVEL SECURITY;

-- Only admins can view this metadata
CREATE POLICY "Admins can view data collection metadata"
  ON public.data_collection_metadata
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert the help usage tracking milestone
INSERT INTO public.data_collection_metadata (feature_name, collection_start_date, description)
VALUES (
  'game_help_usage',
  '2025-10-24 00:15:58+00'::TIMESTAMP WITH TIME ZONE,
  'Help usage tracking (third, skip, audience, 2x_answer) started on 2025-10-24. No historical data exists before this date. The game_results table has historical data from 2025-10-17, but without help usage details.'
);

-- Add index for performance
CREATE INDEX idx_data_collection_metadata_feature ON public.data_collection_metadata(feature_name);

-- Add documentation comment
COMMENT ON TABLE public.data_collection_metadata IS 'Tracks when different data collection features were implemented. Used for admin analytics to understand data availability periods.';