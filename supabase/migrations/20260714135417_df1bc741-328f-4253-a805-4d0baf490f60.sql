
CREATE TABLE public.crm_financial_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('company','contact','opportunity')),
  entity_id uuid NOT NULL,
  finance_type text NOT NULL CHECK (finance_type IN (
    'acc_customer','ar_invoice','ar_payment','ap_bill','ap_payment',
    'proposal','contract','client_invoice'
  )),
  finance_id uuid NOT NULL,
  amount numeric(18,2),
  currency text DEFAULT 'GBP',
  status text,
  occurred_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, finance_type, finance_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_financial_links TO authenticated;
GRANT ALL ON public.crm_financial_links TO service_role;

ALTER TABLE public.crm_financial_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_financial_links org access"
ON public.crm_financial_links FOR ALL TO authenticated
USING (org_id = public.get_primary_admin_id())
WITH CHECK (org_id = public.get_primary_admin_id());

CREATE INDEX idx_crm_fin_links_entity ON public.crm_financial_links (entity_type, entity_id);
CREATE INDEX idx_crm_fin_links_finance ON public.crm_financial_links (finance_type, finance_id);
CREATE INDEX idx_crm_fin_links_org ON public.crm_financial_links (org_id);

CREATE TRIGGER trg_crm_fin_links_updated_at
BEFORE UPDATE ON public.crm_financial_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Back-pointers
ALTER TABLE public.acc_customers
  ADD COLUMN IF NOT EXISTS crm_company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS crm_contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL;

ALTER TABLE public.acc_ar_invoices
  ADD COLUMN IF NOT EXISTS crm_company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS crm_contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS crm_opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE SET NULL;

ALTER TABLE public.acc_ar_payments
  ADD COLUMN IF NOT EXISTS crm_company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL;

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS crm_company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS crm_contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS crm_opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE SET NULL;

ALTER TABLE public.client_contracts
  ADD COLUMN IF NOT EXISTS crm_company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS crm_opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE SET NULL;

ALTER TABLE public.client_invoices
  ADD COLUMN IF NOT EXISTS crm_company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_acc_customers_crm_company ON public.acc_customers(crm_company_id);
CREATE INDEX IF NOT EXISTS idx_acc_ar_invoices_crm_company ON public.acc_ar_invoices(crm_company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_crm_company ON public.proposals(crm_company_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_crm_company ON public.client_contracts(crm_company_id);
CREATE INDEX IF NOT EXISTS idx_client_invoices_crm_company ON public.client_invoices(crm_company_id);

-- Backfills
UPDATE public.acc_customers ac
SET crm_company_id = c.id
FROM public.crm_companies c
WHERE ac.crm_company_id IS NULL
  AND ac.name IS NOT NULL AND c.name IS NOT NULL
  AND lower(trim(ac.name)) = lower(trim(c.name));

UPDATE public.proposals p
SET crm_company_id = c.id
FROM public.crm_companies c
WHERE p.crm_company_id IS NULL
  AND p.lead_id IS NOT NULL
  AND c.linked_lead_id = p.lead_id;

UPDATE public.proposals p
SET crm_contact_id = ct.id
FROM public.crm_contacts ct
WHERE p.crm_contact_id IS NULL
  AND p.lead_id IS NOT NULL
  AND ct.linked_lead_id = p.lead_id;

UPDATE public.client_contracts cc
SET crm_company_id = c.id
FROM public.crm_companies c
WHERE cc.crm_company_id IS NULL
  AND cc.team_id IS NOT NULL
  AND c.linked_client_team_id = cc.team_id;

UPDATE public.client_invoices ci
SET crm_company_id = c.id
FROM public.crm_companies c
WHERE ci.crm_company_id IS NULL
  AND ci.team_id IS NOT NULL
  AND c.linked_client_team_id = ci.team_id;

-- Seed link table
INSERT INTO public.crm_financial_links (org_id, entity_type, entity_id, finance_type, finance_id, amount, currency, status, occurred_at)
SELECT public.get_primary_admin_id(), 'company', ac.crm_company_id, 'acc_customer', ac.id, NULL, NULL, NULL, ac.created_at
FROM public.acc_customers ac WHERE ac.crm_company_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.crm_financial_links (org_id, entity_type, entity_id, finance_type, finance_id, amount, currency, status, occurred_at)
SELECT public.get_primary_admin_id(), 'company', ai.crm_company_id, 'ar_invoice', ai.id, ai.total, ai.currency, ai.status, ai.invoice_date
FROM public.acc_ar_invoices ai WHERE ai.crm_company_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.crm_financial_links (org_id, entity_type, entity_id, finance_type, finance_id, amount, currency, status, occurred_at)
SELECT public.get_primary_admin_id(), 'company', p.crm_company_id, 'proposal', p.id, p.total_amount, p.currency, p.status, p.created_at
FROM public.proposals p WHERE p.crm_company_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.crm_financial_links (org_id, entity_type, entity_id, finance_type, finance_id, amount, currency, status, occurred_at)
SELECT public.get_primary_admin_id(), 'company', cc.crm_company_id, 'contract', cc.id, NULL, NULL, cc.status, cc.created_at
FROM public.client_contracts cc WHERE cc.crm_company_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.crm_financial_links (org_id, entity_type, entity_id, finance_type, finance_id, amount, currency, status, occurred_at)
SELECT public.get_primary_admin_id(), 'company', ci.crm_company_id, 'client_invoice', ci.id, ci.amount, ci.currency, ci.status, ci.created_at
FROM public.client_invoices ci WHERE ci.crm_company_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Helpers
CREATE OR REPLACE FUNCTION public.crm_entity_financials(_entity_type text, _entity_id uuid)
RETURNS TABLE (finance_type text, finance_id uuid, reference text, amount numeric, currency text, status text, occurred_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT fl.finance_type, fl.finance_id,
    COALESCE(
      (SELECT ai.invoice_number FROM public.acc_ar_invoices ai WHERE ai.id = fl.finance_id AND fl.finance_type = 'ar_invoice'),
      (SELECT p.title FROM public.proposals p WHERE p.id = fl.finance_id AND fl.finance_type = 'proposal'),
      (SELECT cc.title FROM public.client_contracts cc WHERE cc.id = fl.finance_id AND fl.finance_type = 'contract'),
      (SELECT ci.invoice_number FROM public.client_invoices ci WHERE ci.id = fl.finance_id AND fl.finance_type = 'client_invoice'),
      fl.finance_id::text
    ) AS reference,
    fl.amount, fl.currency, fl.status, fl.occurred_at
  FROM public.crm_financial_links fl
  WHERE fl.entity_type = _entity_type AND fl.entity_id = _entity_id
    AND fl.org_id = public.get_primary_admin_id()
  ORDER BY fl.occurred_at DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.crm_entity_lifetime_value(_entity_type text, _entity_id uuid)
RETURNS TABLE (invoiced numeric, paid numeric, outstanding numeric, currency text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH inv AS (
    SELECT COALESCE(SUM(fl.amount),0)::numeric AS total, MAX(fl.currency) AS ccy
    FROM public.crm_financial_links fl
    WHERE fl.entity_type = _entity_type AND fl.entity_id = _entity_id
      AND fl.finance_type IN ('ar_invoice','client_invoice')
      AND fl.org_id = public.get_primary_admin_id()
  ),
  pay AS (
    SELECT COALESCE(SUM(fl.amount),0)::numeric AS total
    FROM public.crm_financial_links fl
    WHERE fl.entity_type = _entity_type AND fl.entity_id = _entity_id
      AND fl.finance_type = 'ar_payment'
      AND fl.org_id = public.get_primary_admin_id()
  )
  SELECT inv.total, pay.total, (inv.total - pay.total), COALESCE(inv.ccy,'GBP')
  FROM inv, pay;
$$;

GRANT EXECUTE ON FUNCTION public.crm_entity_financials(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_entity_lifetime_value(text, uuid) TO authenticated;
