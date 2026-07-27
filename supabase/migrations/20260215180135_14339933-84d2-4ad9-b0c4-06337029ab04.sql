
-- Resource allocations for granular time/capacity tracking
CREATE TABLE public.resource_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.app_projects(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  assigned_to TEXT NOT NULL,
  hours_allocated NUMERIC NOT NULL DEFAULT 0,
  hours_spent NUMERIC NOT NULL DEFAULT 0,
  week_start DATE NOT NULL,
  task_description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resource_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own allocations" ON public.resource_allocations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own allocations" ON public.resource_allocations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own allocations" ON public.resource_allocations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own allocations" ON public.resource_allocations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all allocations" ON public.resource_allocations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all allocations" ON public.resource_allocations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_resource_allocations_user ON public.resource_allocations(user_id);
CREATE INDEX idx_resource_allocations_project ON public.resource_allocations(project_id);
CREATE INDEX idx_resource_allocations_week ON public.resource_allocations(week_start);

CREATE TRIGGER update_resource_allocations_updated_at
  BEFORE UPDATE ON public.resource_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
