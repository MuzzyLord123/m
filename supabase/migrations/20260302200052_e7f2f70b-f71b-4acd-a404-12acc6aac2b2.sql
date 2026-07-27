
-- ============================================
-- Feature 1: AI Business Intelligence tables
-- ============================================

CREATE TABLE public.business_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'weekly_summary',
  title TEXT NOT NULL,
  content TEXT,
  ai_analysis JSONB,
  charts_data JSONB,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'generated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON public.business_reports FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can create own reports" ON public.business_reports FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users can update own reports" ON public.business_reports FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "Users can delete own reports" ON public.business_reports FOR DELETE USING (public.is_owner(user_id));

CREATE TABLE public.kpi_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT DEFAULT '',
  period TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kpi_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own kpi goals" ON public.kpi_goals FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can create own kpi goals" ON public.kpi_goals FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users can update own kpi goals" ON public.kpi_goals FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "Users can delete own kpi goals" ON public.kpi_goals FOR DELETE USING (public.is_owner(user_id));

-- ============================================
-- Feature 2: White-Label & Branded Reports
-- ============================================

CREATE TABLE public.brand_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  team_id UUID REFERENCES public.client_teams(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#6366f1',
  accent_color TEXT DEFAULT '#8b5cf6',
  company_name TEXT,
  custom_domain TEXT,
  email_header_url TEXT,
  login_background_url TEXT,
  report_template TEXT DEFAULT 'executive_summary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand settings" ON public.brand_settings FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can create own brand settings" ON public.brand_settings FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users can update own brand settings" ON public.brand_settings FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "Users can delete own brand settings" ON public.brand_settings FOR DELETE USING (public.is_owner(user_id));

-- ============================================
-- Feature 3: Advanced Automations
-- ============================================

CREATE TABLE public.automation_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workflow_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  node_results JSONB,
  error_message TEXT,
  trigger_type TEXT,
  trigger_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own automation runs" ON public.automation_runs FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can create own automation runs" ON public.automation_runs FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users can update own automation runs" ON public.automation_runs FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "Users can delete own automation runs" ON public.automation_runs FOR DELETE USING (public.is_owner(user_id));

CREATE TABLE public.automation_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workflow_id UUID,
  schedule_name TEXT NOT NULL,
  cron_expression TEXT NOT NULL DEFAULT '0 9 * * 1',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedules" ON public.automation_schedules FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can create own schedules" ON public.automation_schedules FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users can update own schedules" ON public.automation_schedules FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "Users can delete own schedules" ON public.automation_schedules FOR DELETE USING (public.is_owner(user_id));

CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  key_name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions JSONB DEFAULT '["read"]'::jsonb,
  rate_limit INTEGER DEFAULT 100,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api keys" ON public.api_keys FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can create own api keys" ON public.api_keys FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users can update own api keys" ON public.api_keys FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "Users can delete own api keys" ON public.api_keys FOR DELETE USING (public.is_owner(user_id));

-- Indexes for performance
CREATE INDEX idx_business_reports_user ON public.business_reports(user_id);
CREATE INDEX idx_kpi_goals_user ON public.kpi_goals(user_id);
CREATE INDEX idx_brand_settings_user ON public.brand_settings(user_id);
CREATE INDEX idx_automation_runs_user ON public.automation_runs(user_id);
CREATE INDEX idx_automation_runs_workflow ON public.automation_runs(workflow_id);
CREATE INDEX idx_automation_schedules_user ON public.automation_schedules(user_id);
CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_business_reports_updated_at BEFORE UPDATE ON public.business_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kpi_goals_updated_at BEFORE UPDATE ON public.kpi_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_brand_settings_updated_at BEFORE UPDATE ON public.brand_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_automation_schedules_updated_at BEFORE UPDATE ON public.automation_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
