-- Create app_projects table for tracking custom apps, dashboards, and systems
CREATE TABLE public.app_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  project_type TEXT NOT NULL DEFAULT 'dashboard',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  priority TEXT DEFAULT 'normal',
  estimated_hours INTEGER,
  actual_hours INTEGER DEFAULT 0,
  start_date DATE,
  target_completion_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  features JSONB DEFAULT '[]'::jsonb,
  tech_stack JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  admin_notes TEXT,
  preview_url TEXT,
  production_url TEXT,
  repository_url TEXT,
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_projects ENABLE ROW LEVEL SECURITY;

-- Admin policies - full control
CREATE POLICY "Admins can view all app projects"
  ON public.app_projects FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert app projects"
  ON public.app_projects FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update app projects"
  ON public.app_projects FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete app projects"
  ON public.app_projects FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- User policies - view only their own projects
CREATE POLICY "Users can view their own app projects"
  ON public.app_projects FOR SELECT
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_projects_updated_at
  BEFORE UPDATE ON public.app_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();