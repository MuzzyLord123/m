CREATE TABLE public.marketing_page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.marketing_page_views TO anon, authenticated;
GRANT SELECT ON public.marketing_page_views TO authenticated;
GRANT ALL ON public.marketing_page_views TO service_role;

ALTER TABLE public.marketing_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views"
  ON public.marketing_page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view page views"
  ON public.marketing_page_views FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_marketing_page_views_created_at ON public.marketing_page_views(created_at DESC);
CREATE INDEX idx_marketing_page_views_path ON public.marketing_page_views(path);
CREATE INDEX idx_marketing_page_views_session ON public.marketing_page_views(session_id);