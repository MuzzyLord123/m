-- Invoice Studio backend (owner-approved unfreeze, 2026-07-30).
-- Presets and design storage, multi-line invoice generation, and the
-- client-facing my_invoices read path. Mirrors the applied migration
-- invoice_studio_v2.

CREATE TABLE IF NOT EXISTS public.invoice_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoice_presets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoice_presets_own ON public.invoice_presets;
CREATE POLICY invoice_presets_own ON public.invoice_presets
  FOR ALL USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_presets TO authenticated;

CREATE TABLE IF NOT EXISTS public.invoice_design (
  owner_user_id uuid PRIMARY KEY,
  design jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoice_design ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoice_design_own ON public.invoice_design;
CREATE POLICY invoice_design_own ON public.invoice_design
  FOR ALL USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_design TO authenticated;

CREATE OR REPLACE FUNCTION public.issuer_invoice_design()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT d.design FROM public.invoice_design d WHERE d.owner_user_id = public.get_primary_admin_id()),
    '{}'::jsonb);
$$;
GRANT EXECUTE ON FUNCTION public.issuer_invoice_design() TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_generate_invoice_v2(
  _entity_type text, _entity_id uuid,
  _lines jsonb,
  _due_date date DEFAULT NULL,
  _notes text DEFAULT NULL,
  _post boolean DEFAULT false)
RETURNS TABLE(invoice_id uuid, invoice_number text, subtotal numeric, tax_total numeric, total numeric, status text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean;
  v_crm_org uuid := public.get_primary_admin_id();
  v_acct uuid;
  v_name text; v_email text; v_phone text;
  v_currency text := 'GBP';
  v_company_id uuid; v_contact_id uuid; v_opp_id uuid;
  v_cust uuid; v_inv uuid; v_number text;
  v_sub numeric := 0; v_tax numeric := 0; v_tot numeric := 0;
  l jsonb; v_no int := 0;
  l_qty numeric; l_price numeric; l_rate numeric; l_sub numeric; l_tax numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  v_is_admin := public.has_role(v_uid, 'admin');

  IF _lines IS NULL OR jsonb_array_length(_lines) = 0 THEN
    RAISE EXCEPTION 'Add at least one line';
  END IF;

  IF v_is_admin THEN
    v_acct := public.crm_accounting_org();
  ELSE
    SELECT id INTO v_acct FROM public.acc_organizations
     WHERE owner_user_id = v_uid ORDER BY created_at LIMIT 1;
    IF v_acct IS NULL THEN
      INSERT INTO public.acc_organizations (owner_user_id, name, base_currency)
        VALUES (v_uid, 'My business', 'GBP') RETURNING id INTO v_acct;
    END IF;
  END IF;
  IF v_acct IS NULL THEN RAISE EXCEPTION 'No accounting organisation configured'; END IF;

  IF _entity_type = 'opportunity' THEN
    SELECT o.title, o.company_id, o.contact_id, COALESCE(o.currency,'GBP')
      INTO v_name, v_company_id, v_contact_id, v_currency
      FROM public.crm_opportunities o WHERE o.id = _entity_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Opportunity not found'; END IF;
    v_opp_id := _entity_id;
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
      FROM public.crm_companies c WHERE c.id = _entity_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Company not found'; END IF;
    v_company_id := _entity_id;
  ELSIF _entity_type = 'contact' THEN
    SELECT COALESCE(ct.full_name, trim(coalesce(ct.first_name,'') || ' ' || coalesce(ct.last_name,'')), ct.email), ct.email, ct.phone
      INTO v_name, v_email, v_phone
      FROM public.crm_contacts ct WHERE ct.id = _entity_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Contact not found'; END IF;
    v_contact_id := _entity_id;
  ELSE
    RAISE EXCEPTION 'Unknown entity_type: %', _entity_type;
  END IF;
  IF v_name IS NULL OR v_name = '' THEN v_name := 'Customer'; END IF;

  FOR l IN SELECT * FROM jsonb_array_elements(_lines) LOOP
    l_qty := COALESCE((l->>'quantity')::numeric, 1);
    l_price := COALESCE((l->>'unit_price')::numeric, 0);
    l_rate := COALESCE((l->>'tax_rate')::numeric, 0);
    l_sub := round(l_qty * l_price, 2);
    l_tax := round(l_sub * l_rate, 2);
    v_sub := v_sub + l_sub;
    v_tax := v_tax + l_tax;
  END LOOP;
  v_tot := v_sub + v_tax;
  IF v_tot <= 0 THEN RAISE EXCEPTION 'Invoice total must be greater than zero'; END IF;

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
      VALUES (v_acct, v_name, v_email, v_phone, v_currency, v_uid, v_company_id, v_contact_id)
      RETURNING id INTO v_cust;
  END IF;

  v_number := public.crm_next_invoice_number(v_acct);

  INSERT INTO public.acc_ar_invoices (
      org_id, customer_id, invoice_number, invoice_date, due_date,
      subtotal, tax_total, total, currency, notes, status, created_by,
      crm_company_id, crm_contact_id, crm_opportunity_id)
    VALUES (
      v_acct, v_cust, v_number, CURRENT_DATE, COALESCE(_due_date, CURRENT_DATE + 14),
      v_sub, v_tax, v_tot, v_currency, _notes, 'draft', v_uid,
      v_company_id, v_contact_id, v_opp_id)
    RETURNING id INTO v_inv;

  FOR l IN SELECT * FROM jsonb_array_elements(_lines) LOOP
    v_no := v_no + 1;
    l_qty := COALESCE((l->>'quantity')::numeric, 1);
    l_price := COALESCE((l->>'unit_price')::numeric, 0);
    l_rate := COALESCE((l->>'tax_rate')::numeric, 0);
    l_sub := round(l_qty * l_price, 2);
    l_tax := round(l_sub * l_rate, 2);
    INSERT INTO public.acc_ar_invoice_lines (
        invoice_id, line_no, description, quantity, unit_price, tax_rate,
        line_subtotal, line_tax, line_total)
      VALUES (v_inv, v_no, COALESCE(NULLIF(l->>'description',''), 'Item'), l_qty, l_price, l_rate,
        l_sub, l_tax, l_sub + l_tax);
  END LOOP;

  INSERT INTO public.crm_financial_links (
      org_id, entity_type, entity_id, finance_type, finance_id,
      amount, currency, status, occurred_at, created_by, metadata)
    VALUES (
      v_crm_org, _entity_type, _entity_id, 'ar_invoice', v_inv,
      v_tot, v_currency, 'draft', now(), v_uid,
      jsonb_build_object('invoice_number', v_number, 'source', 'invoice studio'))
    ON CONFLICT DO NOTHING;

  IF _post THEN
    PERFORM public.acc_post_ar_invoice(v_inv);
  END IF;

  RETURN QUERY SELECT i.id, i.invoice_number, i.subtotal, i.tax_total, i.total, i.status::text
    FROM public.acc_ar_invoices i WHERE i.id = v_inv;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_generate_invoice_v2(text, uuid, jsonb, date, text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.my_invoices()
RETURNS TABLE(
  invoice_id uuid, invoice_number text, invoice_date date, due_date date,
  subtotal numeric, tax_total numeric, total numeric, amount_paid numeric,
  currency text, status text, notes text, customer_name text,
  posted_at timestamptz, lines jsonb)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH me AS (
    SELECT lower(u.email) AS email FROM auth.users u WHERE u.id = auth.uid()
  )
  SELECT i.id, i.invoice_number, i.invoice_date, i.due_date,
         i.subtotal, i.tax_total, i.total, i.amount_paid,
         i.currency, i.status::text, i.notes, c.name,
         i.posted_at,
         COALESCE((
           SELECT jsonb_agg(jsonb_build_object(
             'description', il.description, 'quantity', il.quantity,
             'unit_price', il.unit_price, 'tax_rate', il.tax_rate,
             'line_total', il.line_total) ORDER BY il.line_no)
           FROM public.acc_ar_invoice_lines il WHERE il.invoice_id = i.id
         ), '[]'::jsonb)
  FROM public.acc_ar_invoices i
  JOIN public.acc_customers c ON c.id = i.customer_id
  WHERE i.status <> 'draft'
    AND (
      lower(COALESCE(c.email, '')) = (SELECT email FROM me)
      OR EXISTS (
        SELECT 1 FROM public.crm_contacts ct
        WHERE ct.id = COALESCE(i.crm_contact_id, c.crm_contact_id)
          AND lower(COALESCE(ct.email, '')) = (SELECT email FROM me))
    )
  ORDER BY i.invoice_date DESC, i.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.my_invoices() TO authenticated;

NOTIFY pgrst, 'reload schema';
