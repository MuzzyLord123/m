
CREATE TABLE public.subscription_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_company_id uuid,
  client_name text,
  site_name text NOT NULL,
  site_url text,
  hero_image_url text,
  template_used text,
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('active','paused','cancelled','trial')),
  billing_amount numeric(12,2) DEFAULT 0,
  billing_currency text DEFAULT 'GBP',
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),
  subscription_start_date date,
  next_billing_date date,
  next_renewal_date date,
  hosting_provider text DEFAULT 'vercel' CHECK (hosting_provider IN ('vercel','netlify','cloudflare','other')),
  hosting_status text NOT NULL DEFAULT 'not_deployed' CHECK (hosting_status IN ('live','building','error','not_deployed')),
  is_hosted_only boolean NOT NULL DEFAULT false,
  account_manager_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_sites TO authenticated;
GRANT ALL ON public.subscription_sites TO service_role;
ALTER TABLE public.subscription_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage subscription sites"
  ON public.subscription_sites FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE INDEX idx_subscription_sites_owner ON public.subscription_sites(owner_user_id);
CREATE INDEX idx_subscription_sites_status ON public.subscription_sites(status);
CREATE INDEX idx_subscription_sites_hosting_status ON public.subscription_sites(hosting_status);
CREATE INDEX idx_subscription_sites_renewal ON public.subscription_sites(next_renewal_date);

CREATE TABLE public.subscription_site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_site_id uuid NOT NULL REFERENCES public.subscription_sites(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'created','paused','resumed','cancelled','payment_failed','renewed',
    'hero_image_updated','hosting_status_changed','notes_updated','edited'
  )),
  detail jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_site_events TO authenticated;
GRANT ALL ON public.subscription_site_events TO service_role;
ALTER TABLE public.subscription_site_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view site events"
  ON public.subscription_site_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.subscription_sites s
    WHERE s.id = subscription_site_id AND s.owner_user_id = auth.uid()
  ));

CREATE POLICY "Owner can insert site events"
  ON public.subscription_site_events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.subscription_sites s
    WHERE s.id = subscription_site_id AND s.owner_user_id = auth.uid()
  ));

CREATE INDEX idx_subscription_site_events_site ON public.subscription_site_events(subscription_site_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER subscription_sites_updated_at
  BEFORE UPDATE ON public.subscription_sites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
