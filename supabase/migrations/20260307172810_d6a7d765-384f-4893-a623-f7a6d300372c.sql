
UPDATE storage.buckets SET public = true WHERE id = 'site-files';

-- Add storage policies for site-files bucket
CREATE POLICY "Authenticated users can upload site files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-files');

CREATE POLICY "Anyone can read public site files"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'site-files');

CREATE POLICY "Users can update their site files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site-files');
