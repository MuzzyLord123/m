
-- Designer sites table
CREATE TABLE public.designer_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  site_name TEXT NOT NULL,
  description TEXT,
  template_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  settings JSONB DEFAULT '{}',
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.designer_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sites"
  ON public.designer_sites FOR SELECT
  USING (public.is_owner(user_id));

CREATE POLICY "Users can create their own sites"
  ON public.designer_sites FOR INSERT
  WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Users can update their own sites"
  ON public.designer_sites FOR UPDATE
  USING (public.is_owner(user_id));

CREATE POLICY "Users can delete their own sites"
  ON public.designer_sites FOR DELETE
  USING (public.is_owner(user_id));

CREATE TRIGGER update_designer_sites_updated_at
  BEFORE UPDATE ON public.designer_sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_designer_sites_user_id ON public.designer_sites(user_id);

-- Designer pages table
CREATE TABLE public.designer_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.designer_sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  page_name TEXT NOT NULL DEFAULT 'Untitled Page',
  slug TEXT NOT NULL DEFAULT '/',
  elements JSONB DEFAULT '[]',
  page_settings JSONB DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_homepage BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.designer_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pages"
  ON public.designer_pages FOR SELECT
  USING (public.is_owner(user_id));

CREATE POLICY "Users can create their own pages"
  ON public.designer_pages FOR INSERT
  WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Users can update their own pages"
  ON public.designer_pages FOR UPDATE
  USING (public.is_owner(user_id));

CREATE POLICY "Users can delete their own pages"
  ON public.designer_pages FOR DELETE
  USING (public.is_owner(user_id));

CREATE TRIGGER update_designer_pages_updated_at
  BEFORE UPDATE ON public.designer_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_designer_pages_site_id ON public.designer_pages(site_id);
CREATE INDEX idx_designer_pages_user_id ON public.designer_pages(user_id);
