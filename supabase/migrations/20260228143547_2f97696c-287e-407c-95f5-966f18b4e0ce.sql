
-- 1. User Activity Log
CREATE TABLE public.user_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_name TEXT NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ual_user_visited ON public.user_activity_log (user_id, visited_at DESC);
CREATE INDEX idx_ual_feature ON public.user_activity_log (user_id, feature_name);
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own activity" ON public.user_activity_log FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users insert own activity" ON public.user_activity_log FOR INSERT WITH CHECK (public.is_owner(user_id));

-- 2. Dashboard Metrics Cache
CREATE TABLE public.dashboard_metrics_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  period TEXT NOT NULL DEFAULT 'weekly',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, metric_key, period)
);
CREATE INDEX idx_dmc_user ON public.dashboard_metrics_cache (user_id, period);
ALTER TABLE public.dashboard_metrics_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own metrics" ON public.dashboard_metrics_cache FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users insert own metrics" ON public.dashboard_metrics_cache FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users update own metrics" ON public.dashboard_metrics_cache FOR UPDATE USING (public.is_owner(user_id));

-- 3. Enable Realtime (conversations already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_log;
