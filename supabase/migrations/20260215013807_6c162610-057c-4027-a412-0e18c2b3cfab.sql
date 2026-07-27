
-- New table: designer_components (user-saved reusable blocks)
CREATE TABLE public.designer_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Custom',
  elements JSONB NOT NULL DEFAULT '[]',
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.designer_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own components"
  ON public.designer_components FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own components"
  ON public.designer_components FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own components"
  ON public.designer_components FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own components"
  ON public.designer_components FOR DELETE
  USING (auth.uid() = user_id);

-- New table: designer_assets (uploaded media per site)
CREATE TABLE public.designer_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  site_id UUID REFERENCES public.designer_sites(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.designer_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
  ON public.designer_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload own assets"
  ON public.designer_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.designer_assets FOR DELETE
  USING (auth.uid() = user_id);

-- Add global_styles and publishing columns to designer_sites
ALTER TABLE public.designer_sites 
  ADD COLUMN IF NOT EXISTS global_styles JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS published_url TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX idx_designer_components_user ON public.designer_components(user_id);
CREATE INDEX idx_designer_assets_user ON public.designer_assets(user_id);
CREATE INDEX idx_designer_assets_site ON public.designer_assets(site_id);
