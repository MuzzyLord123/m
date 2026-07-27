
-- Enterprise Planner Tasks table
CREATE TABLE public.planner_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  team_id UUID REFERENCES public.client_teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'paused', 'in_review', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  category TEXT DEFAULT 'general',
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_to UUID,
  tags TEXT[] DEFAULT '{}',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_hours NUMERIC(6,1),
  actual_hours NUMERIC(6,1),
  parent_task_id UUID REFERENCES public.planner_tasks(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;

-- Users can see their own tasks
CREATE POLICY "Users can view own tasks"
ON public.planner_tasks FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR assigned_to = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (team_id IS NOT NULL AND is_team_member(team_id))
);

-- Users can create tasks
CREATE POLICY "Users can create tasks"
ON public.planner_tasks FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update own tasks or admin
CREATE POLICY "Users can update tasks"
ON public.planner_tasks FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR assigned_to = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_team_owner(auth.uid())
);

-- Users can delete own tasks
CREATE POLICY "Users can delete own tasks"
ON public.planner_tasks FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_team_owner(auth.uid())
);

-- Indexes
CREATE INDEX idx_planner_tasks_user_id ON public.planner_tasks(user_id);
CREATE INDEX idx_planner_tasks_team_id ON public.planner_tasks(team_id);
CREATE INDEX idx_planner_tasks_status ON public.planner_tasks(status);
CREATE INDEX idx_planner_tasks_assigned ON public.planner_tasks(assigned_to);
CREATE INDEX idx_planner_tasks_due ON public.planner_tasks(due_date);

-- Auto-update timestamp trigger
CREATE TRIGGER update_planner_tasks_updated_at
BEFORE UPDATE ON public.planner_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
