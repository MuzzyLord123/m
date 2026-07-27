
-- Add workflow execution tracking
CREATE TABLE public.workflow_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  trigger_data JSONB DEFAULT '{}',
  node_results JSONB DEFAULT '[]',
  error TEXT,
  duration_ms INTEGER
);

ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own runs" ON public.workflow_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own runs" ON public.workflow_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own runs" ON public.workflow_runs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own runs" ON public.workflow_runs FOR DELETE USING (auth.uid() = user_id);

-- Add workflow_type and template_id columns to workflows
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS workflow_type TEXT NOT NULL DEFAULT 'execute';
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS run_count INTEGER NOT NULL DEFAULT 0;
