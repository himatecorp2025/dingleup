-- Add screenshot support to reports table
ALTER TABLE public.reports 
ADD COLUMN screenshot_urls TEXT[] DEFAULT '{}';

-- Create storage bucket for report screenshots if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-screenshots', 
  'report-screenshots', 
  false,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for report screenshots
CREATE POLICY "Users can upload their own report screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'report-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own report screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'report-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all report screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'report-screenshots'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);