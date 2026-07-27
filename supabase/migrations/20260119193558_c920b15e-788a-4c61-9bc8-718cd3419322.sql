-- Create storage bucket for ad creatives
INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-creatives', 'ad-creatives', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload ad creatives
CREATE POLICY "Admins can upload ad creatives"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ad-creatives' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to update ad creatives
CREATE POLICY "Admins can update ad creatives"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'ad-creatives' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to delete ad creatives
CREATE POLICY "Admins can delete ad creatives"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ad-creatives' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow public read access for ad creatives (so clients can view them)
CREATE POLICY "Public can view ad creatives"
ON storage.objects FOR SELECT
USING (bucket_id = 'ad-creatives');