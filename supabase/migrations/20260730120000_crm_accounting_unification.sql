-- CRM and accounting unification (owner-approved freeze lift, 2026-07-30).
-- Applied to the live project as two migrations:
--   crm_accounting_unification_seed  and  crm_accounting_unification_engine.
-- This file mirrors both so the repo matches the live database.
--
-- Seed: owner accounting organisation, chart of accounts (identical rows
-- to acc_seed_default_coa, inlined because that function is auth-gated in
-- a migration context), default CRM lifecycle stages.

ALTER TABLE public.acc_organizations DISABLE TRIGGER USER;

DO $$
DECLARE v_owner uuid; v_acct uuid;
BEGIN
  v_owner := public.get_primary_admin_id();
  IF v_owner IS NULL THEN RETURN; END IF;

  SELECT id INTO v_acct FROM public.acc_organizations
   WHERE owner_user_id = v_owner ORDER BY created_at LIMIT 1;
  IF v_acct IS NULL THEN
    INSERT INTO public.acc_organizations (owner_user_id, name, base_currency)
      VALUES (v_owner, 'Quooro', 'GBP') RETURNING id INTO v_acct;
  END IF;

  INSERT INTO public.acc_chart_of_accounts (org_id, code, name, type, subtype) VALUES
    (v_acct, '1000', 'Bank - Current Account',        'asset',     'current_asset'),
    (v_acct, '1010', 'Bank - Savings',                'asset',     'current_asset'),
    (v_acct, '1020', 'Petty Cash',                    'asset',     'current_asset'),
    (v_acct, '1100', 'Accounts Receivable',           'asset',     'current_asset'),
    (v_acct, '1200', 'Prepayments',                   'asset',     'current_asset'),
    (v_acct, '1300', 'Inventory',                     'asset',     'current_asset'),
    (v_acct, '1500', 'Fixed Assets - Equipment',      'asset',     'fixed_asset'),
    (v_acct, '1510', 'Accumulated Depreciation',      'asset',     'fixed_asset'),
    (v_acct, '2000', 'Accounts Payable',              'liability', 'current_liability'),
    (v_acct, '2100', 'VAT Payable',                   'liability', 'current_liability'),
    (v_acct, '2110', 'VAT Receivable',                'liability', 'current_liability'),
    (v_acct, '2120', 'VAT Control',                   'liability', 'current_liability'),
    (v_acct, '2200', 'PAYE / NI Payable',             'liability', 'current_liability'),
    (v_acct, '2210', 'Pension Payable',               'liability', 'current_liability'),
    (v_acct, '2220', 'Net Wages Payable',             'liability', 'current_liability'),
    (v_acct, '2300', 'Corporation Tax Payable',       'liability', 'current_liability'),
    (v_acct, '2400', 'Accruals',                      'liability', 'current_liability'),
    (v_acct, '2500', 'Loans Payable',                 'liability', 'long_term_liability'),
    (v_acct, '3000', 'Share Capital',                 'equity',    'equity'),
    (v_acct, '3100', 'Retained Earnings',             'equity',    'equity'),
    (v_acct, '3200', 'Owner Drawings',                'equity',    'equity'),
    (v_acct, '4000', 'Sales Revenue',                 'revenue',   'operating_revenue'),
    (v_acct, '4100', 'Service Revenue',               'revenue',   'operating_revenue'),
    (v_acct, '4900', 'Other Income',                  'revenue',   'other_revenue'),
    (v_acct, '4910', 'Gain on Asset Disposal',        'revenue',   'other_revenue'),
    (v_acct, '5000', 'Cost of Goods Sold',            'expense',   'cogs'),
    (v_acct, '6000', 'Salaries & Wages',              'expense',   'operating_expense'),
    (v_acct, '6010', 'Employer NI Contributions',     'expense',   'operating_expense'),
    (v_acct, '6100', 'Rent',                          'expense',   'operating_expense'),
    (v_acct, '6110', 'Utilities',                     'expense',   'operating_expense'),
    (v_acct, '6120', 'Office Supplies',               'expense',   'operating_expense'),
    (v_acct, '6130', 'Software & Subscriptions',      'expense',   'operating_expense'),
    (v_acct, '6140', 'Marketing & Advertising',       'expense',   'operating_expense'),
    (v_acct, '6150', 'Professional Fees',             'expense',   'operating_expense'),
    (v_acct, '6160', 'Travel',                        'expense',   'operating_expense'),
    (v_acct, '6170', 'Insurance',                     'expense',   'operating_expense'),
    (v_acct, '6200', 'Depreciation',                  'expense',   'operating_expense'),
    (v_acct, '6300', 'Bank Fees',                     'expense',   'operating_expense'),
    (v_acct, '6900', 'Other Expenses',                'expense',   'operating_expense'),
    (v_acct, '6910', 'Loss on Asset Disposal',        'expense',   'operating_expense')
  ON CONFLICT (org_id, code) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.crm_lifecycle_stages WHERE org_id = v_owner) THEN
    INSERT INTO public.crm_lifecycle_stages (org_id, name, slug, category, order_index, color, is_default) VALUES
      (v_owner, 'New',       'new',       'lead',     0, '#7A8699', true),
      (v_owner, 'Contacted', 'contacted', 'prospect', 1, '#5B8DB8', false),
      (v_owner, 'Engaged',   'engaged',   'prospect', 2, '#C2A14D', false),
      (v_owner, 'Proposal',  'proposal',  'prospect', 3, '#C2410C', false),
      (v_owner, 'Won',       'won',       'customer', 4, '#3E7C4F', false),
      (v_owner, 'Lost',      'lost',      'churned',  5, '#8A4B3B', false);
  END IF;
END $$;

ALTER TABLE public.acc_organizations ENABLE TRIGGER USER;

-- Engine: invoice generation, won-deal automation, ledger sync, timeline.

CREATE OR REPLACE FUNCTION public.crm_accounting_org()
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid := public.get_primary_admin_id();
  v_org uuid;
BEGIN
  IF v_owner IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO v_org FROM public.acc_organizations
   WHERE owner_user_id = v_owner ORDER BY created_at LIMIT 1;
  IF v_org IS NULL THEN
    INSERT INTO public.acc_organizations (owner_user_id, name, base_currency)
      VALUES (v_owner, 'Quooro', 'GBP') RETURNING id INTO v_org;
  END IF;
  RETURN v_org;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_next_invoice_number(_org uuid)
RETURNS text
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prefix text := 'INV-' || to_char(now(), 'YYYY') || '-';
  v_n int;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(substring(invoice_number from length(v_prefix) + 1), '\D', '', 'g'), '')::int), 0) + 1
    INTO v_n
    FROM public.acc_ar_invoices
   WHERE org_id = _org AND invoice_number LIKE v_prefix || '%';
  RETURN v_prefix || lpad(v_n::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_generate_invoice_core(
  _entity_type text, _entity_id uuid,
  _amount numeric DEFAULT NULL, _tax_rate numeric DEFAULT 0.20,
  _description text DEFAULT NULL, _due_date date DEFAULT NULL,
  _actor uuid DEFAULT NULL, _source text DEFAULT 'manual')
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org uuid := public.get_primary_admin_id();
  v_acct uuid;
  v_name text; v_email text; v_phone text;
  v_currency text := 'GBP';
  v_company_id uuid; v_contact_id uuid; v_opp_id uuid;
  v_amount numeric := _amount;
  v_desc text := _description;
  v_cust uuid; v_inv uuid; v_number text;
  v_subtotal numeric; v_tax numeric; v_total numeric;
BEGIN
  IF v_org IS NULL THEN RAISE EXCEPTION 'No organisation configured'; END IF;
  v_acct := public.crm_accounting_org();
  IF v_acct IS NULL THEN RAISE EXCEPTION 'No accounting organisation configured'; END IF;

  IF _entity_type = 'opportunity' THEN
    SELECT o.title, o.company_id, o.contact_id, COALESCE(o.currency,'GBP'), o.value
      INTO v_name, v_company_id, v_contact_id, v_currency, v_amount
      FROM public.crm_opportunities o WHERE o.id = _entity_id AND o.org_id = v_org;
    IF NOT FOUND THEN RAISE EXCEPTION 'Opportunity not found'; END IF;
    v_opp_id := _entity_id;
    v_amount := COALESCE(_amount, v_amount);
    v_desc := COALESCE(_description, v_name);
    IF v_company_id IS NOT NULL THEN
      SELECT c.name, c.email, c.phone INTO v_name, v_email, v_phone
        FROM public.crm_companies c WHERE c.id = v_company_id;
    ELSIF v_contact_id IS NOT NULL THEN
      SELECT COALESCE(ct.full_name, trim(coalesce(ct.first_name,'') || ' ' || coalesce(ct.last_name,'')), ct.email), ct.email, ct.phone
        INTO v_name, v_email, v_phone
        FROM public.crm_contacts ct WHERE ct.id = v_contact_id;
    END IF;
  ELSIF _entity_type = 'company' THEN
    SELECT c.name, c.email, c.phone INTO v_name, v_email, v_phone
      FROM public.crm_companies c WHERE c.id = _entity_id AND c.org_id = v_org;
    IF NOT FOUND THEN RAISE EXCEPTION 'Company not found'; END IF;
    v_company_id := _entity_id;
  ELSIF _entity_type = 'contact' THEN
    SELECT COALESCE(ct.full_name, trim(coalesce(ct.first_name,'') || ' ' || coalesce(ct.last_name,'')), ct.email), ct.email, ct.phone
      INTO v_name, v_email, v_phone
      FROM public.crm_contacts ct WHERE ct.id = _entity_id AND ct.org_id = v_org;
    IF NOT FOUND THEN RAISE EXCEPTION 'Contact not found'; END IF;
    v_contact_id := _entity_id;
  ELSE
    RAISE EXCEPTION 'Unknown entity_type: %', _entity_type;
  END IF;

  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'An amount greater than zero is required';
  END IF;
  IF v_name IS NULL OR v_name = '' THEN v_name := 'CRM customer'; END IF;

  SELECT id INTO v_cust FROM public.acc_customers
   WHERE org_id = v_acct AND (
     (v_company_id IS NOT NULL AND crm_company_id = v_company_id) OR
     (v_contact_id IS NOT NULL AND crm_contact_id = v_contact_id))
   ORDER BY created_at LIMIT 1;
  IF v_cust IS NULL AND v_email IS NOT NULL THEN
    SELECT id INTO v_cust FROM public.acc_customers
     WHERE org_id = v_acct AND lower(email) = lower(v_email)
     ORDER BY created_at LIMIT 1;
  END IF;
  IF v_cust IS NULL THEN
    INSERT INTO public.acc_customers (org_id, name, email, phone, currency, created_by, crm_company_id, crm_contact_id)
      VALUES (v_acct, v_name, v_email, v_phone, v_currency, _actor, v_company_id, v_contact_id)
      RETURNING id INTO v_cust;
  ELSE
    UPDATE public.acc_customers
       SET crm_company_id = COALESCE(crm_company_id, v_company_id),
           crm_contact_id = COALESCE(crm_contact_id, v_contact_id)
     WHERE id = v_cust;
  END IF;

  v_subtotal := round(v_amount, 2);
  v_tax := round(v_amount * COALESCE(_tax_rate, 0), 2);
  v_total := v_subtotal + v_tax;
  v_number := public.crm_next_invoice_number(v_acct);

  INSERT INTO public.acc_ar_invoices (
      org_id, customer_id, invoice_number, invoice_date, due_date,
      subtotal, tax_total, total, currency, notes, status, created_by,
      crm_company_id, crm_contact_id, crm_opportunity_id)
    VALUES (
      v_acct, v_cust, v_number, CURRENT_DATE, COALESCE(_due_date, CURRENT_DATE + 14),
      v_subtotal, v_tax, v_total, v_currency,
      'Generated from CRM (' || _source || ')', 'draft', _actor,
      v_company_id, v_contact_id, v_opp_id)
    RETURNING id INTO v_inv;

  INSERT INTO public.acc_ar_invoice_lines (
      invoice_id, line_no, description, quantity, unit_price, tax_rate,
      line_subtotal, line_tax, line_total)
    VALUES (
      v_inv, 1, COALESCE(v_desc, 'Services'), 1, v_subtotal, COALESCE(_tax_rate, 0),
      v_subtotal, v_tax, v_total);

  INSERT INTO public.crm_financial_links (
      org_id, entity_type, entity_id, finance_type, finance_id,
      amount, currency, status, occurred_at, created_by, metadata)
    VALUES (
      v_org, _entity_type, _entity_id, 'ar_invoice', v_inv,
      v_total, v_currency, 'draft', now(), _actor,
      jsonb_build_object('invoice_number', v_number, 'source', _source))
    ON CONFLICT DO NOTHING;

  RETURN v_inv;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_generate_invoice(
  _entity_type text, _entity_id uuid,
  _amount numeric DEFAULT NULL, _tax_rate numeric DEFAULT 0.20,
  _description text DEFAULT NULL, _due_date date DEFAULT NULL,
  _post boolean DEFAULT false)
RETURNS TABLE(invoice_id uuid, invoice_number text, total numeric, status text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_inv uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  v_inv := public.crm_generate_invoice_core(_entity_type, _entity_id, _amount, _tax_rate, _description, _due_date, auth.uid(), 'manual');
  IF _post THEN
    PERFORM public.acc_post_ar_invoice(v_inv);
  END IF;
  RETURN QUERY SELECT i.id, i.invoice_number, i.total, i.status::text
    FROM public.acc_ar_invoices i WHERE i.id = v_inv;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_generate_invoice(text, uuid, numeric, numeric, text, date, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_auto_invoice_on_won()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_cat text; v_slug text;
BEGIN
  IF NEW.lifecycle_stage_id IS NULL OR NEW.lifecycle_stage_id IS NOT DISTINCT FROM OLD.lifecycle_stage_id THEN
    RETURN NEW;
  END IF;
  SELECT category::text, slug INTO v_cat, v_slug
    FROM public.crm_lifecycle_stages WHERE id = NEW.lifecycle_stage_id;
  IF (v_cat = 'customer' OR v_slug ILIKE '%won%') AND COALESCE(NEW.value, 0) > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.crm_financial_links
       WHERE entity_type = 'opportunity' AND entity_id = NEW.id AND finance_type = 'ar_invoice'
    ) THEN
      BEGIN
        PERFORM public.crm_generate_invoice_core('opportunity', NEW.id, NULL, 0.20, NULL, NULL, auth.uid(), 'auto won deal');
      EXCEPTION WHEN OTHERS THEN
        NULL; -- invoice generation must never block a stage move
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_crm_auto_invoice_on_won ON public.crm_opportunities;
CREATE TRIGGER trg_crm_auto_invoice_on_won
  AFTER UPDATE OF lifecycle_stage_id ON public.crm_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.crm_auto_invoice_on_won();

CREATE OR REPLACE FUNCTION public.acc_ar_invoice_sync_crm_link()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_et text; v_eid uuid; v_crm_org uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_crm_org := public.get_primary_admin_id();
    IF v_crm_org IS NULL THEN RETURN NEW; END IF;
    FOR v_et, v_eid IN
      SELECT * FROM (VALUES
        ('company', NEW.crm_company_id),
        ('contact', NEW.crm_contact_id),
        ('opportunity', NEW.crm_opportunity_id)) AS t(et, eid)
      WHERE t.eid IS NOT NULL
    LOOP
      INSERT INTO public.crm_financial_links (org_id, entity_type, entity_id, finance_type, finance_id, amount, currency, status, occurred_at, created_by, metadata)
      SELECT v_crm_org, v_et, v_eid, 'ar_invoice', NEW.id, NEW.total, NEW.currency, NEW.status::text, now(), NEW.created_by,
             jsonb_build_object('invoice_number', NEW.invoice_number, 'source', 'ledger')
      WHERE NOT EXISTS (
        SELECT 1 FROM public.crm_financial_links
         WHERE entity_type = v_et AND entity_id = v_eid
           AND finance_type = 'ar_invoice' AND finance_id = NEW.id);
    END LOOP;
  ELSE
    UPDATE public.crm_financial_links
       SET status = NEW.status::text, amount = NEW.total, currency = NEW.currency, updated_at = now()
     WHERE finance_type = 'ar_invoice' AND finance_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_acc_ar_invoice_sync_crm ON public.acc_ar_invoices;
CREATE TRIGGER trg_acc_ar_invoice_sync_crm
  AFTER INSERT OR UPDATE OF status, total ON public.acc_ar_invoices
  FOR EACH ROW EXECUTE FUNCTION public.acc_ar_invoice_sync_crm_link();

CREATE OR REPLACE FUNCTION public.acc_ar_payment_sync_crm_link()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_inv public.acc_ar_invoices%ROWTYPE; v_et text; v_eid uuid; v_crm_org uuid;
BEGIN
  SELECT * INTO v_inv FROM public.acc_ar_invoices WHERE id = NEW.invoice_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  v_crm_org := public.get_primary_admin_id();
  IF v_crm_org IS NULL THEN RETURN NEW; END IF;
  FOR v_et, v_eid IN
    SELECT * FROM (VALUES
      ('company', v_inv.crm_company_id),
      ('contact', v_inv.crm_contact_id),
      ('opportunity', v_inv.crm_opportunity_id)) AS t(et, eid)
    WHERE t.eid IS NOT NULL
  LOOP
    INSERT INTO public.crm_financial_links (org_id, entity_type, entity_id, finance_type, finance_id, amount, currency, status, occurred_at, created_by, metadata)
    SELECT v_crm_org, v_et, v_eid, 'ar_payment', NEW.id, NEW.amount, v_inv.currency, 'received', COALESCE(NEW.payment_date::timestamptz, now()), NEW.created_by,
           jsonb_build_object('invoice_number', v_inv.invoice_number, 'method', NEW.method, 'reference', NEW.reference)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.crm_financial_links
       WHERE entity_type = v_et AND entity_id = v_eid
         AND finance_type = 'ar_payment' AND finance_id = NEW.id);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_acc_ar_payment_sync_crm ON public.acc_ar_payments;
CREATE TRIGGER trg_acc_ar_payment_sync_crm
  AFTER INSERT ON public.acc_ar_payments
  FOR EACH ROW EXECUTE FUNCTION public.acc_ar_payment_sync_crm_link();

CREATE OR REPLACE FUNCTION public.crm_timeline(_entity_type text, _entity_id uuid, _limit integer DEFAULT 50, _before timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS TABLE(event_id uuid, event_type text, kind text, direction text, subject text, body text, occurred_at timestamp with time zone, actor_id uuid, metadata jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org uuid;
BEGIN
  IF _entity_type = 'company' THEN
    SELECT org_id INTO v_org FROM public.crm_companies WHERE id = _entity_id;
  ELSIF _entity_type = 'contact' THEN
    SELECT org_id INTO v_org FROM public.crm_contacts WHERE id = _entity_id;
  ELSIF _entity_type = 'opportunity' THEN
    SELECT org_id INTO v_org FROM public.crm_opportunities WHERE id = _entity_id;
  ELSE
    RAISE EXCEPTION 'Unknown entity_type: %', _entity_type;
  END IF;

  IF v_org IS NULL THEN RETURN; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR v_org = public.get_primary_admin_id()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  RETURN QUERY
  (
    SELECT c.id, 'communication'::text, c.kind::text, c.direction::text,
           c.subject, c.body, c.occurred_at, c.owner_id,
           jsonb_build_object('from', c.from_address, 'to', c.to_addresses,
                              'status', c.status, 'duration', c.duration_seconds,
                              'tags', c.tags) || c.metadata
    FROM public.crm_communications c
    WHERE (_before IS NULL OR c.occurred_at < _before)
      AND (
        (_entity_type = 'company'     AND c.company_id     = _entity_id) OR
        (_entity_type = 'contact'     AND c.contact_id     = _entity_id) OR
        (_entity_type = 'opportunity' AND c.opportunity_id = _entity_id)
      )
  )
  UNION ALL
  (
    SELECT h.id, 'lifecycle'::text, 'lifecycle'::text, NULL::text,
           COALESCE(s2.name, 'Stage changed'),
           h.note,
           h.created_at, h.changed_by,
           jsonb_build_object('from_stage', s1.name, 'to_stage', s2.name)
    FROM public.crm_lifecycle_history h
    LEFT JOIN public.crm_lifecycle_stages s1 ON s1.id = h.from_stage_id
    LEFT JOIN public.crm_lifecycle_stages s2 ON s2.id = h.to_stage_id
    WHERE h.entity_type = _entity_type
      AND h.entity_id = _entity_id
      AND (_before IS NULL OR h.created_at < _before)
  )
  UNION ALL
  (
    SELECT fl.id, 'finance'::text, fl.finance_type, NULL::text,
           CASE fl.finance_type
             WHEN 'ar_invoice' THEN
               'Invoice ' || COALESCE(fl.metadata->>'invoice_number',
                 (SELECT ai.invoice_number FROM public.acc_ar_invoices ai WHERE ai.id = fl.finance_id), '')
               || CASE WHEN fl.status IS NOT NULL THEN ' ' || fl.status ELSE '' END
             WHEN 'ar_payment' THEN 'Payment received'
             WHEN 'client_invoice' THEN 'Client invoice' || CASE WHEN fl.status IS NOT NULL THEN ' ' || fl.status ELSE '' END
             WHEN 'proposal' THEN 'Proposal linked'
             WHEN 'contract' THEN 'Contract linked'
             ELSE initcap(replace(fl.finance_type, '_', ' '))
           END,
           COALESCE(fl.currency, 'GBP') || ' ' || to_char(COALESCE(fl.amount, 0), 'FM999,999,990.00'),
           COALESCE(fl.occurred_at, fl.created_at), fl.created_by, fl.metadata
    FROM public.crm_financial_links fl
    WHERE fl.entity_type = _entity_type
      AND fl.entity_id = _entity_id
      AND (_before IS NULL OR COALESCE(fl.occurred_at, fl.created_at) < _before)
  )
  ORDER BY 7 DESC
  LIMIT _limit;
END;
$$;
