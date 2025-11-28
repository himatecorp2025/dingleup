-- Create app_download_links table for admin-configurable download links
CREATE TABLE IF NOT EXISTS public.app_download_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_play_url TEXT,
  app_store_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_download_links ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read download links
CREATE POLICY "Download links are public"
ON public.app_download_links
FOR SELECT
USING (true);

-- Policy: Only admins can update download links
CREATE POLICY "Only admins can update download links"
ON public.app_download_links
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Insert default row (empty links initially)
INSERT INTO public.app_download_links (id, google_play_url, app_store_url)
VALUES ('00000000-0000-0000-0000-000000000001', '', '')
ON CONFLICT (id) DO NOTHING;