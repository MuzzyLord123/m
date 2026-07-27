-- Create Asset Folders table
CREATE TABLE IF NOT EXISTS public.asset_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES public.asset_folders(id) ON DELETE CASCADE,
  color text DEFAULT '#00b8d4',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create Asset Tags table  
CREATE TABLE IF NOT EXISTS public.asset_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#00b8d4',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create Client Assets table
CREATE TABLE IF NOT EXISTS public.client_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  folder_id uuid REFERENCES public.asset_folders(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  original_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  description text,
  is_starred boolean DEFAULT false,
  download_count integer DEFAULT 0,
  last_accessed_at timestamp with time zone,
  is_encrypted boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create Asset Tag Assignments
CREATE TABLE IF NOT EXISTS public.asset_tag_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id uuid NOT NULL REFERENCES public.client_assets(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.asset_tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(asset_id, tag_id)
);

-- Create Storage Quotas table
CREATE TABLE IF NOT EXISTS public.storage_quotas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  quota_bytes bigint NOT NULL DEFAULT 5368709120,
  used_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.asset_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Asset Folders Policies
CREATE POLICY "asset_folders_select" ON public.asset_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "asset_folders_insert" ON public.asset_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "asset_folders_update" ON public.asset_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "asset_folders_delete" ON public.asset_folders FOR DELETE USING (auth.uid() = user_id);

-- Asset Tags Policies
CREATE POLICY "asset_tags_select" ON public.asset_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "asset_tags_insert" ON public.asset_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "asset_tags_update" ON public.asset_tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "asset_tags_delete" ON public.asset_tags FOR DELETE USING (auth.uid() = user_id);

-- Client Assets Policies
CREATE POLICY "client_assets_select" ON public.client_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "client_assets_insert" ON public.client_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "client_assets_update" ON public.client_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "client_assets_delete" ON public.client_assets FOR DELETE USING (auth.uid() = user_id);

-- Storage Quotas Policies
CREATE POLICY "storage_quotas_select" ON public.storage_quotas FOR SELECT USING (auth.uid() = user_id);

-- Tag Assignments Policies
CREATE POLICY "tag_assignments_select" ON public.asset_tag_assignments FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.client_assets WHERE id = asset_tag_assignments.asset_id AND user_id = auth.uid()));
CREATE POLICY "tag_assignments_insert" ON public.asset_tag_assignments FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.client_assets WHERE id = asset_tag_assignments.asset_id AND user_id = auth.uid()));
CREATE POLICY "tag_assignments_delete" ON public.asset_tag_assignments FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.client_assets WHERE id = asset_tag_assignments.asset_id AND user_id = auth.uid()));

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('client-assets', 'client-assets', false) ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_asset_folders_user ON public.asset_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_tags_user ON public.asset_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_client_assets_user ON public.client_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_client_assets_folder ON public.client_assets(folder_id);

-- Quota tracking trigger
CREATE OR REPLACE FUNCTION public.track_storage_quota()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.storage_quotas (user_id, used_bytes)
    VALUES (NEW.user_id, NEW.file_size)
    ON CONFLICT (user_id) DO UPDATE SET used_bytes = storage_quotas.used_bytes + NEW.file_size, updated_at = now();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.storage_quotas SET used_bytes = GREATEST(0, used_bytes - OLD.file_size), updated_at = now() WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS track_asset_storage ON public.client_assets;
CREATE TRIGGER track_asset_storage AFTER INSERT OR DELETE ON public.client_assets FOR EACH ROW EXECUTE FUNCTION public.track_storage_quota();