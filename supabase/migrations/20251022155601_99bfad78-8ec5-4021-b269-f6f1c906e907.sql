-- ============================================
-- Genius Subscription System - Database Schema
-- ============================================

-- 1. Extend profiles table with subscription fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscriber_since TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscriber_type TEXT DEFAULT 'paid' CHECK (subscriber_type IN ('paid', 'comp')),
ADD COLUMN IF NOT EXISTS subscriber_renew_at TIMESTAMPTZ;

-- Ensure is_subscriber exists (might already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_subscriber'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_subscriber BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2. Create tips_tricks_videos table
CREATE TABLE IF NOT EXISTS tips_tricks_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumb_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration_sec INTEGER,
  published_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on videos table
ALTER TABLE tips_tricks_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for videos
CREATE POLICY "Genius subscribers can view active videos"
  ON tips_tricks_videos FOR SELECT
  USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_subscriber = true
    )
  );

CREATE POLICY "Admins can manage videos"
  ON tips_tricks_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_subscriber ON profiles(is_subscriber);
CREATE INDEX IF NOT EXISTS idx_videos_sort_active ON tips_tricks_videos(sort_order, is_active);
CREATE INDEX IF NOT EXISTS idx_videos_published ON tips_tricks_videos(published_at DESC);

-- 4. Set up comp user (himatecorp2025@gmail.com)
DO $$
DECLARE
  comp_user_id UUID;
BEGIN
  -- Find user by email in auth.users
  SELECT id INTO comp_user_id 
  FROM auth.users 
  WHERE email = 'himatecorp2025@gmail.com'
  LIMIT 1;
  
  -- If user exists, update their profile
  IF comp_user_id IS NOT NULL THEN
    UPDATE profiles
    SET 
      is_subscriber = true,
      subscriber_type = 'comp',
      subscriber_since = now(),
      subscriber_renew_at = now() + interval '100 years' -- Effectively permanent
    WHERE id = comp_user_id;
  END IF;
END $$;

-- 5. Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('tips-videos', 'tips-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage policies for video uploads (admin only)
CREATE POLICY "Admins can upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tips-videos' 
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'tips-videos' 
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tips-videos' 
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Genius members can view videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tips-videos'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_subscriber = true
    )
  );

-- 7. Update existing check-subscription results
-- Ensure life regeneration rate is 6 minutes for subscribers
UPDATE profiles
SET lives_regeneration_rate = 6
WHERE is_subscriber = true AND lives_regeneration_rate != 6;