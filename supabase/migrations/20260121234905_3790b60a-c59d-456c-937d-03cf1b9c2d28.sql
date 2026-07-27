-- Create client-assets storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-assets', 
  'client-assets', 
  false,
  52428800, -- 50MB max file size
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    'text/plain', 'text/csv'
  ]
);

-- Storage policies for client-assets bucket with unique names
CREATE POLICY "client_assets_users_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "client_assets_users_view"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "client_assets_users_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "client_assets_admins_manage"
ON storage.objects FOR ALL
USING (bucket_id = 'client-assets' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'client-assets' AND has_role(auth.uid(), 'admin'));