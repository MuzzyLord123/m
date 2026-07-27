
-- Automation rules engine
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_event TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  conditions JSONB DEFAULT '[]',
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}',
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view automation rules"
  ON public.automation_rules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create automation rules"
  ON public.automation_rules FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update automation rules"
  ON public.automation_rules FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete automation rules"
  ON public.automation_rules FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Automation rule execution log
CREATE TABLE public.automation_rule_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  trigger_data JSONB DEFAULT '{}',
  action_result JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rule_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view automation logs"
  ON public.automation_rule_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert automation logs"
  ON public.automation_rule_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_automation_rules_active ON public.automation_rules(is_active);
CREATE INDEX idx_automation_rule_logs_rule_id ON public.automation_rule_logs(rule_id);
CREATE INDEX idx_automation_rule_logs_executed_at ON public.automation_rule_logs(executed_at DESC);
