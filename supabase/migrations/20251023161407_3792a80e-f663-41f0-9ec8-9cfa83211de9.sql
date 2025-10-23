-- Bővítsük a message_media táblát thumbnail és meta információkkal
ALTER TABLE public.message_media
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS width integer,
ADD COLUMN IF NOT EXISTS height integer,
ADD COLUMN IF NOT EXISTS duration_ms integer,
ADD COLUMN IF NOT EXISTS mime_type text;

-- Index a gyorsabb lekérdezésekhez
CREATE INDEX IF NOT EXISTS idx_message_media_message_id ON public.message_media(message_id);
CREATE INDEX IF NOT EXISTS idx_message_media_type ON public.message_media(media_type);