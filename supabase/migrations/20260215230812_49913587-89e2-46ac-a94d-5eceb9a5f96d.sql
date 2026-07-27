
-- CAD Projects table
CREATE TABLE public.cad_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Drawing',
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  folder TEXT DEFAULT '',
  units TEXT NOT NULL DEFAULT 'mm',
  thumbnail_url TEXT,
  drawing_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  is_template BOOLEAN NOT NULL DEFAULT false,
  template_category TEXT,
  shared_mode TEXT DEFAULT 'private', -- private, view, comment, edit
  share_token UUID,
  entity_count INTEGER NOT NULL DEFAULT 0,
  layer_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cad_projects ENABLE ROW LEVEL SECURITY;

-- Users can view their own projects
CREATE POLICY "Users can view own CAD projects"
ON public.cad_projects FOR SELECT
USING (auth.uid() = user_id);

-- Users can view shared projects
CREATE POLICY "Anyone can view shared CAD projects"
ON public.cad_projects FOR SELECT
USING (shared_mode != 'private' AND share_token IS NOT NULL);

-- Users can create their own projects
CREATE POLICY "Users can create own CAD projects"
ON public.cad_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own CAD projects"
ON public.cad_projects FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own CAD projects"
ON public.cad_projects FOR DELETE
USING (auth.uid() = user_id);

-- CAD Project Versions for version history
CREATE TABLE public.cad_project_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.cad_projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_name TEXT,
  drawing_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  entity_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cad_project_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project versions"
ON public.cad_project_versions FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.cad_projects WHERE id = project_id AND user_id = auth.uid())
);

CREATE POLICY "Users can create own project versions"
ON public.cad_project_versions FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.cad_projects WHERE id = project_id AND user_id = auth.uid())
);

CREATE POLICY "Users can delete own project versions"
ON public.cad_project_versions FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.cad_projects WHERE id = project_id AND user_id = auth.uid())
);

-- Auto-save drafts table
CREATE TABLE public.cad_autosaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.cad_projects(id) ON DELETE SET NULL,
  drawing_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cad_autosaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own autosaves"
ON public.cad_autosaves FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_cad_projects_updated_at
BEFORE UPDATE ON public.cad_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_cad_projects_user_id ON public.cad_projects(user_id);
CREATE INDEX idx_cad_project_versions_project_id ON public.cad_project_versions(project_id);
CREATE INDEX idx_cad_autosaves_user_id ON public.cad_autosaves(user_id);
