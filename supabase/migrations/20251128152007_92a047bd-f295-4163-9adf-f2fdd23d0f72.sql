-- Legal documents táblázat admin kezeléshez
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_key TEXT NOT NULL UNIQUE, -- 'aszf_hu', 'aszf_en', 'privacy_hu', 'privacy_en'
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can read legal documents)
CREATE POLICY "Anyone can read legal documents"
  ON public.legal_documents
  FOR SELECT
  USING (true);

-- Admin write access
CREATE POLICY "Admins can update legal documents"
  ON public.legal_documents
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default empty documents
INSERT INTO public.legal_documents (document_key, content) VALUES
  ('aszf_hu', 'Általános Szerződési Feltételek tartalma ide kerül...'),
  ('aszf_en', 'Terms and Conditions content goes here...'),
  ('privacy_hu', 'Adatkezelési Tájékoztató tartalma ide kerül...'),
  ('privacy_en', 'Privacy Policy content goes here...')
ON CONFLICT (document_key) DO NOTHING;