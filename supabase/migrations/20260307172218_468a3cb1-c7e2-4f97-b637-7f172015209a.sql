
-- Site deployments / version history
CREATE TABLE public.site_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  user_id UUID NOT NULL,
  version_number INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  subdomain TEXT,
  custom_domain TEXT,
  live_url TEXT,
  storage_path TEXT,
  file_count INT DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  build_log JSONB DEFAULT '[]'::jsonb,
  page_count INT DEFAULT 0,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Site domain management
CREATE TABLE public.site_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  user_id UUID NOT NULL,
  domain_type TEXT NOT NULL DEFAULT 'subdomain',
  domain_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  dns_verified BOOLEAN DEFAULT false,
  ssl_active BOOLEAN DEFAULT false,
  dns_instructions JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(domain_name)
);

-- RLS
ALTER TABLE public.site_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_domains ENABLE ROW LEVEL SECURITY;

-- Policies for site_deployments
CREATE POLICY "Users can view own deployments"
  ON public.site_deployments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own deployments"
  ON public.site_deployments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own deployments"
  ON public.site_deployments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admin can view all deployments
CREATE POLICY "Admins can view all deployments"
  ON public.site_deployments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies for site_domains
CREATE POLICY "Users can manage own domains"
  ON public.site_domains FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all domains"
  ON public.site_domains FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_site_deployments_updated_at
  BEFORE UPDATE ON public.site_deployments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_site_domains_updated_at
  BEFORE UPDATE ON public.site_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
