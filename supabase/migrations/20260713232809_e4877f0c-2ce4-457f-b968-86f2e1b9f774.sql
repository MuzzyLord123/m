
-- =========================================================
-- Accounting Phase 3: Accounts Receivable (AR)
-- =========================================================

-- ---------- acc_customers ----------
CREATE TABLE public.acc_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  billing_address text,
  tax_number text,
  currency text NOT NULL DEFAULT 'GBP',
  default_ar_account_id uuid REFERENCES public.acc_chart_of_accounts(id),
  default_revenue_account_id uuid REFERENCES public.acc_chart_of_accounts(id),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_customers TO authenticated;
GRANT ALL ON public.acc_customers TO service_role;
ALTER TABLE public.acc_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acc_customers_admin_all" ON public.acc_customers FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "acc_customers_org_member" ON public.acc_customers FOR ALL
  USING (public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_customers_updated BEFORE UPDATE ON public.acc_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- acc_ar_invoices ----------
CREATE TYPE public.acc_ar_invoice_status AS ENUM ('draft','posted','paid','void');

CREATE TABLE public.acc_ar_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.acc_customers(id) ON DELETE RESTRICT,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  currency text NOT NULL DEFAULT 'GBP',
  subtotal numeric(19,4) NOT NULL DEFAULT 0,
  tax_total numeric(19,4) NOT NULL DEFAULT 0,
  total numeric(19,4) NOT NULL DEFAULT 0,
  amount_paid numeric(19,4) NOT NULL DEFAULT 0,
  status public.acc_ar_invoice_status NOT NULL DEFAULT 'draft',
  notes text,
  client_invoice_id uuid REFERENCES public.client_invoices(id) ON DELETE SET NULL,
  journal_entry_id uuid REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL,
  reversal_entry_id uuid REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL,
  posted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, invoice_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_ar_invoices TO authenticated;
GRANT ALL ON public.acc_ar_invoices TO service_role;
ALTER TABLE public.acc_ar_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acc_ar_invoices_admin_all" ON public.acc_ar_invoices FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "acc_ar_invoices_org_member" ON public.acc_ar_invoices FOR ALL
  USING (public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_ar_invoices_updated BEFORE UPDATE ON public.acc_ar_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_acc_ar_invoices_org_status ON public.acc_ar_invoices(org_id, status);
CREATE INDEX idx_acc_ar_invoices_customer ON public.acc_ar_invoices(customer_id);

-- ---------- acc_ar_invoice_lines ----------
CREATE TABLE public.acc_ar_invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.acc_ar_invoices(id) ON DELETE CASCADE,
  line_no int NOT NULL,
  description text NOT NULL,
  quantity numeric(19,4) NOT NULL DEFAULT 1,
  unit_price numeric(19,4) NOT NULL DEFAULT 0,
  tax_rate numeric(9,4) NOT NULL DEFAULT 0, -- e.g. 0.20 = 20%
  line_subtotal numeric(19,4) NOT NULL DEFAULT 0,
  line_tax numeric(19,4) NOT NULL DEFAULT 0,
  line_total numeric(19,4) NOT NULL DEFAULT 0,
  revenue_account_id uuid REFERENCES public.acc_chart_of_accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (invoice_id, line_no)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_ar_invoice_lines TO authenticated;
GRANT ALL ON public.acc_ar_invoice_lines TO service_role;
ALTER TABLE public.acc_ar_invoice_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acc_ar_invoice_lines_admin_all" ON public.acc_ar_invoice_lines FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "acc_ar_invoice_lines_org_member" ON public.acc_ar_invoice_lines FOR ALL
  USING (EXISTS (SELECT 1 FROM public.acc_ar_invoices i
                 WHERE i.id = invoice_id AND public.acc_is_org_member(auth.uid(), i.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.acc_ar_invoices i
                 WHERE i.id = invoice_id AND public.acc_is_org_member(auth.uid(), i.org_id)));

-- ---------- acc_ar_payments ----------
CREATE TABLE public.acc_ar_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.acc_ar_invoices(id) ON DELETE RESTRICT,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(19,4) NOT NULL CHECK (amount > 0),
  bank_account_id uuid NOT NULL REFERENCES public.acc_chart_of_accounts(id),
  reference text,
  method text,
  journal_entry_id uuid REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL,
  posted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_ar_payments TO authenticated;
GRANT ALL ON public.acc_ar_payments TO service_role;
ALTER TABLE public.acc_ar_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acc_ar_payments_admin_all" ON public.acc_ar_payments FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "acc_ar_payments_org_member" ON public.acc_ar_payments FOR ALL
  USING (public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_ar_payments_updated BEFORE UPDATE ON public.acc_ar_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Helpers to resolve default accounts
-- =========================================================
CREATE OR REPLACE FUNCTION public.acc_account_by_code(_org_id uuid, _code text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT id FROM public.acc_chart_of_accounts WHERE org_id=_org_id AND code=_code LIMIT 1;
$$;

-- =========================================================
-- Post an AR invoice to the ledger
-- Dr Accounts Receivable (total)
-- Cr Revenue (per line subtotal, per revenue account)
-- Cr VAT Payable (sum of line tax)
-- =========================================================
CREATE OR REPLACE FUNCTION public.acc_post_ar_invoice(_invoice_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  inv public.acc_ar_invoices%ROWTYPE;
  cust public.acc_customers%ROWTYPE;
  ar_account uuid;
  vat_account uuid;
  entry_id uuid;
  rec RECORD;
  line_no int := 1;
BEGIN
  SELECT * INTO inv FROM public.acc_ar_invoices WHERE id = _invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), inv.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF inv.status <> 'draft' THEN RAISE EXCEPTION 'Only draft invoices can be posted'; END IF;
  IF inv.total <= 0 THEN RAISE EXCEPTION 'Invoice total must be > 0'; END IF;

  SELECT * INTO cust FROM public.acc_customers WHERE id = inv.customer_id;
  ar_account  := COALESCE(cust.default_ar_account_id, public.acc_account_by_code(inv.org_id,'1100'));
  vat_account := public.acc_account_by_code(inv.org_id,'2100');
  IF ar_account IS NULL THEN RAISE EXCEPTION 'AR account (1100) missing in COA'; END IF;

  -- Create draft entry
  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by)
    VALUES (inv.org_id, inv.invoice_date,
            'AR Invoice '||inv.invoice_number, 'ar_invoice', inv.id, auth.uid())
    RETURNING id INTO entry_id;

  -- Dr AR total
  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, line_no, ar_account, inv.total, 0, 'AR '||inv.invoice_number);
  line_no := line_no + 1;

  -- Cr Revenue per line
  FOR rec IN
    SELECT COALESCE(l.revenue_account_id, cust.default_revenue_account_id,
                    public.acc_account_by_code(inv.org_id,'4000')) AS acct,
           SUM(l.line_subtotal) AS amt
    FROM public.acc_ar_invoice_lines l
    WHERE l.invoice_id = inv.id
    GROUP BY 1
  LOOP
    IF rec.acct IS NULL THEN RAISE EXCEPTION 'Revenue account missing'; END IF;
    IF rec.amt <> 0 THEN
      INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
        VALUES (entry_id, line_no, rec.acct, 0, rec.amt, 'Revenue '||inv.invoice_number);
      line_no := line_no + 1;
    END IF;
  END LOOP;

  -- Cr VAT
  IF inv.tax_total <> 0 THEN
    IF vat_account IS NULL THEN RAISE EXCEPTION 'VAT Payable account (2100) missing'; END IF;
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, line_no, vat_account, 0, inv.tax_total, 'VAT '||inv.invoice_number);
  END IF;

  -- Post
  UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = entry_id;

  UPDATE public.acc_ar_invoices
    SET status='posted', posted_at = now(), journal_entry_id = entry_id
    WHERE id = inv.id;

  RETURN entry_id;
END;$$;

-- =========================================================
-- Void a posted invoice via a reversal entry
-- =========================================================
CREATE OR REPLACE FUNCTION public.acc_void_ar_invoice(_invoice_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  inv public.acc_ar_invoices%ROWTYPE;
  new_entry uuid;
BEGIN
  SELECT * INTO inv FROM public.acc_ar_invoices WHERE id=_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), inv.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF inv.status NOT IN ('posted','paid') THEN RAISE EXCEPTION 'Only posted invoices can be voided'; END IF;
  IF inv.amount_paid > 0 THEN RAISE EXCEPTION 'Cannot void an invoice with payments applied'; END IF;
  IF inv.journal_entry_id IS NULL THEN RAISE EXCEPTION 'Original journal entry missing'; END IF;

  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by, is_reversal, reversed_by_entry_id)
    VALUES (inv.org_id, CURRENT_DATE, 'Reversal of AR Invoice '||inv.invoice_number,
            'ar_invoice_void', inv.id, auth.uid(), true, inv.journal_entry_id)
    RETURNING id INTO new_entry;

  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    SELECT new_entry, line_no, account_id, credit, debit, 'Reversal: '||COALESCE(memo,'')
    FROM public.acc_journal_lines WHERE journal_entry_id = inv.journal_entry_id;

  UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = new_entry;

  UPDATE public.acc_ar_invoices SET status='void', reversal_entry_id = new_entry WHERE id = inv.id;

  RETURN new_entry;
END;$$;

-- =========================================================
-- Post an AR receipt
-- Dr Bank / Cr AR
-- =========================================================
CREATE OR REPLACE FUNCTION public.acc_post_ar_payment(_payment_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  pay public.acc_ar_payments%ROWTYPE;
  inv public.acc_ar_invoices%ROWTYPE;
  cust public.acc_customers%ROWTYPE;
  ar_account uuid;
  entry_id uuid;
  new_paid numeric(19,4);
BEGIN
  SELECT * INTO pay FROM public.acc_ar_payments WHERE id=_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF pay.posted_at IS NOT NULL THEN RAISE EXCEPTION 'Payment already posted'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), pay.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  SELECT * INTO inv FROM public.acc_ar_invoices WHERE id=pay.invoice_id FOR UPDATE;
  IF inv.status NOT IN ('posted','paid') THEN RAISE EXCEPTION 'Invoice must be posted before receiving payment'; END IF;
  IF pay.amount > (inv.total - inv.amount_paid) THEN RAISE EXCEPTION 'Payment exceeds outstanding balance'; END IF;

  SELECT * INTO cust FROM public.acc_customers WHERE id=inv.customer_id;
  ar_account := COALESCE(cust.default_ar_account_id, public.acc_account_by_code(inv.org_id,'1100'));

  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by)
    VALUES (pay.org_id, pay.payment_date, 'Receipt for '||inv.invoice_number, 'ar_payment', pay.id, auth.uid())
    RETURNING id INTO entry_id;

  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, 1, pay.bank_account_id, pay.amount, 0, 'Receipt '||COALESCE(pay.reference,''));
  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, 2, ar_account, 0, pay.amount, 'Applied to '||inv.invoice_number);

  UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = entry_id;

  UPDATE public.acc_ar_payments SET posted_at = now(), journal_entry_id = entry_id WHERE id = pay.id;

  new_paid := inv.amount_paid + pay.amount;
  UPDATE public.acc_ar_invoices
    SET amount_paid = new_paid,
        status = CASE WHEN new_paid >= inv.total THEN 'paid'::acc_ar_invoice_status ELSE inv.status END
    WHERE id = inv.id;

  RETURN entry_id;
END;$$;

-- =========================================================
-- AR Aging view
-- =========================================================
CREATE OR REPLACE VIEW public.acc_ar_aging
WITH (security_invoker = true) AS
SELECT
  i.org_id,
  i.id AS invoice_id,
  i.invoice_number,
  i.customer_id,
  c.name AS customer_name,
  i.invoice_date,
  i.due_date,
  i.total,
  i.amount_paid,
  (i.total - i.amount_paid) AS balance,
  GREATEST(0, (CURRENT_DATE - COALESCE(i.due_date, i.invoice_date))) AS days_overdue,
  CASE
    WHEN COALESCE(i.due_date, i.invoice_date) >= CURRENT_DATE THEN 'current'
    WHEN CURRENT_DATE - COALESCE(i.due_date, i.invoice_date) <= 30 THEN '1-30'
    WHEN CURRENT_DATE - COALESCE(i.due_date, i.invoice_date) <= 60 THEN '31-60'
    WHEN CURRENT_DATE - COALESCE(i.due_date, i.invoice_date) <= 90 THEN '61-90'
    ELSE '90+'
  END AS bucket
FROM public.acc_ar_invoices i
JOIN public.acc_customers c ON c.id = i.customer_id
WHERE i.status IN ('posted','paid') AND (i.total - i.amount_paid) > 0;

GRANT SELECT ON public.acc_ar_aging TO authenticated;
