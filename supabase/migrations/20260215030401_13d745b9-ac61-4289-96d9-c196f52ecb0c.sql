-- Create storage bucket for designer image uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('designer-uploads', 'designer-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload designer files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'designer-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access for designer uploads
CREATE POLICY "Public read access for designer uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'designer-uploads');

-- Allow users to delete their own designer uploads
CREATE POLICY "Users can delete own designer files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'designer-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);