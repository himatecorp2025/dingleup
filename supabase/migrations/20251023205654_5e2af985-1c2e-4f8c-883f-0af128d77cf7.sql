-- Drop the old constraint
ALTER TABLE public.message_media 
DROP CONSTRAINT IF EXISTS message_media_media_type_check;

-- Add new constraint with 'document' support
ALTER TABLE public.message_media 
ADD CONSTRAINT message_media_media_type_check 
CHECK (media_type = ANY (ARRAY['image'::text, 'video'::text, 'audio'::text, 'document'::text, 'file'::text]));