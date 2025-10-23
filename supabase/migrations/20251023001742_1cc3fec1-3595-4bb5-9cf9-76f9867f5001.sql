-- Storage policies for chat-media bucket
-- Allow users to upload to their own folder
CREATE POLICY "Users can upload their own chat images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM dm_threads 
    WHERE user_id_a = auth.uid() OR user_id_b = auth.uid()
  )
);

-- Allow users to view images in threads they're part of
CREATE POLICY "Users can view images in their threads"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM dm_threads 
    WHERE user_id_a = auth.uid() OR user_id_b = auth.uid()
  )
);

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete their own chat images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM dm_threads 
    WHERE user_id_a = auth.uid() OR user_id_b = auth.uid()
  )
);