-- Add scheduled_date and priority to content_requests table
ALTER TABLE public.content_requests 
ADD COLUMN scheduled_date date,
ADD COLUMN priority text DEFAULT 'normal';

-- Add website management fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN domain_name text,
ADD COLUMN ssl_status text DEFAULT 'pending',
ADD COLUMN hosting_provider text DEFAULT 'Lovable Cloud',
ADD COLUMN last_updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN site_files_url text,
ADD COLUMN version_history jsonb DEFAULT '[]'::jsonb;

-- Create a function to update last_updated_at
CREATE OR REPLACE FUNCTION public.update_profile_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic last_updated_at updates on profiles
DROP TRIGGER IF EXISTS update_profiles_last_updated ON public.profiles;
CREATE TRIGGER update_profiles_last_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_last_updated();

-- Create storage bucket for site files
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-files', 'site-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for site-files bucket
CREATE POLICY "Admins can manage site files"
ON storage.objects
FOR ALL
USING (bucket_id = 'site-files' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'site-files' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can download their own site files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'site-files' AND auth.uid()::text = (storage.foldername(name))[1]);