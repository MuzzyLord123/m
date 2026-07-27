
DO $$ BEGIN CREATE TYPE public.crm_relationship_type AS ENUM ('customer','supplier','partner','prospect','lead','investor','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.crm_entity_status AS ENUM ('active','inactive','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.crm_lifecycle_category AS ENUM ('lead','prospect','customer','churned','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.crm_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL, owner_id uuid,
  name text NOT NULL, legal_name text, domain text, website text, industry text, size text,
  phone text, email text,
  address_line1 text, address_line2 text, city text, region text, postal_code text, country text,
  notes text, tags text[] DEFAULT '{}', source text,
  relationship_type public.crm_relationship_type[] NOT NULL DEFAULT '{prospect}',
  status public.crm_entity_status NOT NULL DEFAULT 'active',
  lifecycle_stage_id uuid, linked_lead_id uuid, linked_client_team_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_companies TO authenticated;
GRANT ALL ON public.crm_companies TO service_role;
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org members manage crm_companies" ON public.crm_companies;
CREATE POLICY "org members manage crm_companies" ON public.crm_companies FOR ALL
  USING (org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_crm_companies_org ON public.crm_companies(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_companies_domain ON public.crm_companies(domain);
CREATE INDEX IF NOT EXISTS idx_crm_companies_rel ON public.crm_companies USING gin(relationship_type);
DROP TRIGGER IF EXISTS trg_crm_companies_updated ON public.crm_companies;
CREATE TRIGGER trg_crm_companies_updated BEFORE UPDATE ON public.crm_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL, owner_id uuid,
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  first_name text, last_name text, full_name text,
  email text, phone text, mobile text, job_title text,
  notes text, tags text[] DEFAULT '{}',
  relationship_type public.crm_relationship_type[] NOT NULL DEFAULT '{prospect}',
  status public.crm_entity_status NOT NULL DEFAULT 'active',
  lifecycle_stage_id uuid, is_primary boolean NOT NULL DEFAULT false,
  linked_lead_id uuid, source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contacts TO authenticated;
GRANT ALL ON public.crm_contacts TO service_role;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org members manage crm_contacts" ON public.crm_contacts;
CREATE POLICY "org members manage crm_contacts" ON public.crm_contacts FOR ALL
  USING (org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org ON public.crm_contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON public.crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts(email);
DROP TRIGGER IF EXISTS trg_crm_contacts_updated ON public.crm_contacts;
CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.crm_lifecycle_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL, name text NOT NULL, slug text NOT NULL,
  category public.crm_lifecycle_category NOT NULL DEFAULT 'other',
  order_index int NOT NULL DEFAULT 0, color text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_lifecycle_stages TO authenticated;
GRANT ALL ON public.crm_lifecycle_stages TO service_role;
ALTER TABLE public.crm_lifecycle_stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org members manage lifecycle_stages" ON public.crm_lifecycle_stages;
CREATE POLICY "org members manage lifecycle_stages" ON public.crm_lifecycle_stages FOR ALL
  USING (org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_crm_lifecycle_stages_updated ON public.crm_lifecycle_stages;
CREATE TRIGGER trg_crm_lifecycle_stages_updated BEFORE UPDATE ON public.crm_lifecycle_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.crm_lifecycle_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL, entity_type text NOT NULL, entity_id uuid NOT NULL,
  from_stage_id uuid, to_stage_id uuid, changed_by uuid, note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.crm_lifecycle_history TO authenticated;
GRANT ALL ON public.crm_lifecycle_history TO service_role;
ALTER TABLE public.crm_lifecycle_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org members view lifecycle_history" ON public.crm_lifecycle_history;
CREATE POLICY "org members view lifecycle_history" ON public.crm_lifecycle_history FOR SELECT
  USING (org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "org members insert lifecycle_history" ON public.crm_lifecycle_history;
CREATE POLICY "org members insert lifecycle_history" ON public.crm_lifecycle_history FOR INSERT
  WITH CHECK (org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_lifecycle_history_entity ON public.crm_lifecycle_history(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS public.crm_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL, owner_id uuid,
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  title text NOT NULL, description text,
  value numeric(19,2) DEFAULT 0, currency text DEFAULT 'GBP',
  stage text NOT NULL DEFAULT 'lead', probability int DEFAULT 0,
  expected_close_date date, actual_close_date date,
  source text, tags text[] DEFAULT '{}', notes text,
  lifecycle_stage_id uuid,
  status public.crm_entity_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_opportunities TO authenticated;
GRANT ALL ON public.crm_opportunities TO service_role;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org members manage crm_opportunities" ON public.crm_opportunities;
CREATE POLICY "org members manage crm_opportunities" ON public.crm_opportunities FOR ALL
  USING (org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_crm_opps_org ON public.crm_opportunities(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_opps_company ON public.crm_opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_opps_contact ON public.crm_opportunities(contact_id);
DROP TRIGGER IF EXISTS trg_crm_opportunities_updated ON public.crm_opportunities;
CREATE TRIGGER trg_crm_opportunities_updated BEFORE UPDATE ON public.crm_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.crm_deals_compat AS
SELECT o.id, o.org_id, o.owner_id AS assigned_to, o.title, o.description,
  o.value AS amount, o.currency, o.stage, o.probability,
  o.expected_close_date, o.actual_close_date, o.company_id, o.contact_id,
  o.source, o.tags, o.notes, o.status::text AS deal_status,
  o.created_at, o.updated_at
FROM public.crm_opportunities o;
GRANT SELECT ON public.crm_deals_compat TO authenticated;

INSERT INTO public.crm_companies (org_id, name, relationship_type, linked_client_team_id, source, status)
SELECT public.get_primary_admin_id(), COALESCE(ct.team_name, 'Untitled Team'),
  ARRAY['customer']::public.crm_relationship_type[], ct.id, 'client_teams', 'active'
FROM public.client_teams ct
WHERE NOT EXISTS (SELECT 1 FROM public.crm_companies c WHERE c.linked_client_team_id = ct.id);

INSERT INTO public.crm_companies (org_id, name, phone, email, source, relationship_type, linked_lead_id)
SELECT public.get_primary_admin_id(), l.business_name, l.phone, l.email,
  COALESCE(l.source::text, 'leads'), ARRAY['lead']::public.crm_relationship_type[], l.id
FROM public.leads l
WHERE COALESCE(l.is_personal, false) = false
  AND l.business_name IS NOT NULL AND l.business_name <> ''
  AND NOT EXISTS (SELECT 1 FROM public.crm_companies c WHERE c.linked_lead_id = l.id);

INSERT INTO public.crm_contacts
  (org_id, company_id, full_name, first_name, last_name, email, phone, source, relationship_type, linked_lead_id)
SELECT public.get_primary_admin_id(),
  (SELECT c.id FROM public.crm_companies c WHERE c.linked_lead_id = l.id LIMIT 1),
  COALESCE(l.contact_name, l.personal_name, l.business_name),
  NULLIF(split_part(COALESCE(l.contact_name, l.personal_name, ''),' ',1),''),
  NULLIF(regexp_replace(COALESCE(l.contact_name, l.personal_name, ''),'^\S+\s*',''),''),
  l.email, l.phone, COALESCE(l.source::text, 'leads'),
  ARRAY['lead']::public.crm_relationship_type[], l.id
FROM public.leads l
WHERE NOT EXISTS (SELECT 1 FROM public.crm_contacts c WHERE c.linked_lead_id = l.id);
