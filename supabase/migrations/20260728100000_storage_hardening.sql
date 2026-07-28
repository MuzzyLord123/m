-- (1) customer-uploads holds AI chat exports and generated INVOICES under
-- chat-exports/<user_id>/... and was a PUBLIC bucket, so anyone with (or
-- guessing) an object URL could read another customer's invoice or exported CRM
-- data. Every read path in the app already uses createSignedUrl - there is no
-- getPublicUrl call against it - so making it private changes nothing
-- functionally. Signed URLs work only on private buckets by design.
UPDATE storage.buckets SET public = false WHERE id = 'customer-uploads';

-- (2) Every bucket had an UNLIMITED object size, so any authenticated user
-- could exhaust storage (and the bill) with one upload.
UPDATE storage.buckets SET file_size_limit = 52428800   -- 50 MB
 WHERE file_size_limit IS NULL
   AND id IN ('avatars','branding-assets','product-images','ad-creatives',
              'content-requests','customer-uploads');

UPDATE storage.buckets SET file_size_limit = 209715200  -- 200 MB, these host site assets
 WHERE file_size_limit IS NULL
   AND id IN ('designer-uploads','site-files');

-- (3) The image-only public buckets accepted ANY mime type. An uploaded
-- text/html file in a public bucket becomes an attacker-controlled page served
-- from the project's own domain - stored XSS / phishing surface. Restricted to
-- image types only, which is all these buckets are used for.
--
-- designer-uploads and site-files are deliberately left unrestricted: they host
-- published site assets and legitimately need HTML, CSS and fonts.
UPDATE storage.buckets
   SET allowed_mime_types = ARRAY[
     'image/png','image/jpeg','image/jpg','image/gif','image/webp','image/avif','image/svg+xml'
   ]
 WHERE id IN ('avatars','product-images');

UPDATE storage.buckets
   SET allowed_mime_types = ARRAY[
     'image/png','image/jpeg','image/jpg','image/gif','image/webp','image/avif',
     'video/mp4','video/quicktime','video/webm'
   ]
 WHERE id = 'ad-creatives';

-- (4) Maintenance function; ordinary users have no reason to invoke it.
REVOKE ALL ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;
