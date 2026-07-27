
-- CMS Collections (like Webflow's Collection types)
CREATE TABLE public.cms_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.designer_sites(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  icon TEXT DEFAULT 'file-text',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(site_id, slug)
);

-- CMS Entries (individual items in a collection)
CREATE TABLE public.cms_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.cms_collections(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES public.designer_sites(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, slug)
);

-- Site Products (auto-synced from inventory for storefront)
CREATE TABLE public.site_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.designer_sites(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  inv_product_id UUID REFERENCES public.inv_products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  compare_at_price NUMERIC,
  currency TEXT NOT NULL DEFAULT 'GBP',
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  sort_order INT DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  inventory_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(site_id, slug)
);

-- Enable RLS
ALTER TABLE public.cms_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_products ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users manage own CMS collections" ON public.cms_collections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own CMS entries" ON public.cms_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own site products" ON public.site_products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public read CMS entries" ON public.cms_entries FOR SELECT USING (status = 'published');
CREATE POLICY "Public read site products" ON public.site_products FOR SELECT USING (status = 'active');

-- Triggers for updated_at
CREATE TRIGGER update_cms_collections_updated_at BEFORE UPDATE ON public.cms_collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_cms_entries_updated_at BEFORE UPDATE ON public.cms_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_site_products_updated_at BEFORE UPDATE ON public.site_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
