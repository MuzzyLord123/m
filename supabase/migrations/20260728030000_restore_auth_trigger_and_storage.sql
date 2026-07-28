-- Restore the auth trigger and storage layer missed by the schema replay
--
-- The rebuild was driven by a `pg_dump` of the `public` schema, so everything
-- the project owns in the `auth` and `storage` schemas was silently dropped on
-- the floor. Nothing errored -- the objects simply never existed in the new
-- project -- which is why this only surfaced when auth was exercised.
--
-- Three consequences, all of which break the app:
--
--   1. No `on_auth_user_created` trigger on auth.users. Sign-up (email *and*
--      Google) creates the auth record, then never creates the matching
--      `profiles` row or the default `user_roles` entry. The user ends up
--      authenticated but invisible to every RLS policy in the app, because all
--      of them resolve identity through those two tables. Effectively every
--      login lands in a broken half-state.
--   2. No storage buckets. Every upload path -- avatars, branding, client
--      assets, designer uploads, site files, product images -- fails.
--   3. No storage.objects policies, so even once the buckets exist nothing is
--      readable or writable.
--
-- `product-images` has policies in the source migrations but no bucket insert:
-- it was created through the dashboard on the old project. It is created here
-- so the policies it carries are actually reachable.

-- 1. auth.users -> profiles + default role -----------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Buckets -----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES
  ('customer-uploads', 'customer-uploads', true),
  ('avatars',          'avatars',          true),
  ('ad-creatives',     'ad-creatives',     true),
  ('content-requests', 'content-requests', true),
  ('designer-uploads', 'designer-uploads', true),
  ('branding-assets',  'branding-assets',  true),
  ('product-images',   'product-images',   true),
  ('site-files',       'site-files',       false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('client-assets', 'client-assets', false, 52428800, ARRAY[
  'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
  'application/pdf','application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'video/mp4','video/webm','video/quicktime',
  'audio/mpeg','audio/wav','audio/ogg',
  'application/zip','application/x-rar-compressed','application/x-7z-compressed',
  'text/plain','text/csv'
])
ON CONFLICT (id) DO NOTHING;

-- 3. storage.objects policies -------------------------------------------------
-- Replayed from the source migrations, with H3 fixed (see below).
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname='storage' AND tablename='objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- customer-uploads: own folder write, public read (bucket is public)
CREATE POLICY "Users can upload their own files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'customer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'customer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- avatars
CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ad-creatives: admin-managed, public read
CREATE POLICY "Public can view ad creatives" ON storage.objects FOR SELECT
  USING (bucket_id = 'ad-creatives');
CREATE POLICY "Admins can upload ad creatives" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ad-creatives' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update ad creatives" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ad-creatives' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete ad creatives" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ad-creatives' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- content-requests: admin-managed, public read
CREATE POLICY "Anyone can view content request files" ON storage.objects FOR SELECT
  USING (bucket_id = 'content-requests');
CREATE POLICY "Admins can upload content request files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content-requests' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete content request files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'content-requests' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- designer-uploads
CREATE POLICY "Public read access for designer uploads" ON storage.objects FOR SELECT
  USING (bucket_id = 'designer-uploads');
CREATE POLICY "Users can upload designer files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'designer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own designer files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'designer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- branding-assets
CREATE POLICY "Anyone can view branding assets" ON storage.objects FOR SELECT
  USING (bucket_id = 'branding-assets');
CREATE POLICY "Users can upload branding assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'branding-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update branding assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'branding-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete branding assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'branding-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- product-images
CREATE POLICY "product-images public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
CREATE POLICY "product-images owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "product-images owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "product-images owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- client-assets: private, own folder only, admins manage
CREATE POLICY "client_assets_users_view" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "client_assets_users_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "client_assets_users_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'client-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "client_assets_admins_manage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'client-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'client-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- site-files: H3 fixed.
--
-- The source grants every authenticated user unscoped INSERT and UPDATE on this
-- bucket:
--   "Authenticated users can upload site files"
--       WITH CHECK (bucket_id = 'site-files')
--   "Users can update their site files"
--       USING (bucket_id = 'site-files')
-- Neither mentions the owning folder, so any logged-in user can overwrite any
-- other tenant's deployed website -- replacing live HTML/JS on a domain they do
-- not control. That is audit finding H3, and replaying it verbatim would carry
-- a known critical straight into the new project, so writes are scoped to the
-- caller's own folder here. Read stays open because these files are served as
-- published sites; admins keep full management.
CREATE POLICY "Anyone can read site files" ON storage.objects FOR SELECT
  USING (bucket_id = 'site-files');
CREATE POLICY "Users can upload own site files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own site files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-files' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'site-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own site files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can manage site files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'site-files' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'site-files' AND public.has_role(auth.uid(), 'admin'::public.app_role));
