
-- =========================================================
-- Accounting Phase 4: Accounts Payable (AP)
-- =========================================================

-- ---------- acc_suppliers ----------
CREATE TABLE public.acc_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  billing_address text,
  tax_number text,
  currency text NOT NULL DEFAULT 'GBP',
  default_ap_account_id uuid REFERENCES public.acc_chart_of_accounts(id),
  default_expense_account_id uuid REFERENCES public.acc_chart_of_accounts(id),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_suppliers TO authenticated;
GRANT ALL ON public.acc_suppliers TO service_role;
ALTER TABLE public.acc_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acc_suppliers_admin_all" ON public.acc_suppliers FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "acc_suppliers_org_member" ON public.acc_suppliers FOR ALL
  USING (public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_suppliers_updated BEFORE UPDATE ON public.acc_suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- acc_ap_bills ----------
CREATE TYPE public.acc_ap_bill_status AS ENUM ('draft','posted','paid','void');

CREATE TABLE public.acc_ap_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.acc_suppliers(id) ON DELETE RESTRICT,
  bill_number text NOT NULL,
  supplier_reference text,
  bill_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  currency text NOT NULL DEFAULT 'GBP',
  subtotal numeric(19,4) NOT NULL DEFAULT 0,
  tax_total numeric(19,4) NOT NULL DEFAULT 0,
  total numeric(19,4) NOT NULL DEFAULT 0,
  amount_paid numeric(19,4) NOT NULL DEFAULT 0,
  status public.acc_ap_bill_status NOT NULL DEFAULT 'draft',
  notes text,
  expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  journal_entry_id uuid REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL,
  reversal_entry_id uuid REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL,
  posted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, bill_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_ap_bills TO authenticated;
GRANT ALL ON public.acc_ap_bills TO service_role;
ALTER TABLE public.acc_ap_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acc_ap_bills_admin_all" ON public.acc_ap_bills FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "acc_ap_bills_org_member" ON public.acc_ap_bills FOR ALL
  USING (public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_ap_bills_updated BEFORE UPDATE ON public.acc_ap_bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_acc_ap_bills_org_status ON public.acc_ap_bills(org_id, status);
CREATE INDEX idx_acc_ap_bills_supplier ON public.acc_ap_bills(supplier_id);

-- ---------- acc_ap_bill_lines ----------
CREATE TABLE public.acc_ap_bill_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.acc_ap_bills(id) ON DELETE CASCADE,
  line_no int NOT NULL,
  description text NOT NULL,
  quantity numeric(19,4) NOT NULL DEFAULT 1,
  unit_price numeric(19,4) NOT NULL DEFAULT 0,
  tax_rate numeric(9,4) NOT NULL DEFAULT 0,
  line_subtotal numeric(19,4) NOT NULL DEFAULT 0,
  line_tax numeric(19,4) NOT NULL DEFAULT 0,
  line_total numeric(19,4) NOT NULL DEFAULT 0,
  expense_account_id uuid REFERENCES public.acc_chart_of_accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bill_id, line_no)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_ap_bill_lines TO authenticated;
GRANT ALL ON public.acc_ap_bill_lines TO service_role;
ALTER TABLE public.acc_ap_bill_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acc_ap_bill_lines_admin_all" ON public.acc_ap_bill_lines FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "acc_ap_bill_lines_org_member" ON public.acc_ap_bill_lines FOR ALL
  USING (EXISTS (SELECT 1 FROM public.acc_ap_bills b
                 WHERE b.id = bill_id AND public.acc_is_org_member(auth.uid(), b.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.acc_ap_bills b
                 WHERE b.id = bill_id AND public.acc_is_org_member(auth.uid(), b.org_id)));

-- ---------- acc_ap_payments ----------
CREATE TABLE public.acc_ap_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  bill_id uuid NOT NULL REFERENCES public.acc_ap_bills(id) ON DELETE RESTRICT,
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_ap_payments TO authenticated;
GRANT ALL ON public.acc_ap_payments TO service_role;
ALTER TABLE public.acc_ap_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acc_ap_payments_admin_all" ON public.acc_ap_payments FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "acc_ap_payments_org_member" ON public.acc_ap_payments FOR ALL
  USING (public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_ap_payments_updated BEFORE UPDATE ON public.acc_ap_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Post an AP bill to the ledger
-- Dr Expense (per line)
-- Dr VAT Receivable (2110) for tax
-- Cr Accounts Payable (2000) total
-- =========================================================
CREATE OR REPLACE FUNCTION public.acc_post_ap_bill(_bill_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  bill public.acc_ap_bills%ROWTYPE;
  sup  public.acc_suppliers%ROWTYPE;
  ap_account uuid;
  vat_account uuid;
  entry_id uuid;
  rec RECORD;
  line_no int := 1;
BEGIN
  SELECT * INTO bill FROM public.acc_ap_bills WHERE id = _bill_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bill not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), bill.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF bill.status <> 'draft' THEN RAISE EXCEPTION 'Only draft bills can be posted'; END IF;
  IF bill.total <= 0 THEN RAISE EXCEPTION 'Bill total must be > 0'; END IF;

  SELECT * INTO sup FROM public.acc_suppliers WHERE id = bill.supplier_id;
  ap_account  := COALESCE(sup.default_ap_account_id, public.acc_account_by_code(bill.org_id,'2000'));
  vat_account := public.acc_account_by_code(bill.org_id,'2110');
  IF ap_account IS NULL THEN RAISE EXCEPTION 'AP account (2000) missing in COA'; END IF;

  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by)
    VALUES (bill.org_id, bill.bill_date,
            'AP Bill '||bill.bill_number, 'ap_bill', bill.id, auth.uid())
    RETURNING id INTO entry_id;

  -- Dr Expense per line
  FOR rec IN
    SELECT COALESCE(l.expense_account_id, sup.default_expense_account_id,
                    public.acc_account_by_code(bill.org_id,'6900')) AS acct,
           SUM(l.line_subtotal) AS amt
    FROM public.acc_ap_bill_lines l
    WHERE l.bill_id = bill.id
    GROUP BY 1
  LOOP
    IF rec.acct IS NULL THEN RAISE EXCEPTION 'Expense account missing'; END IF;
    IF rec.amt <> 0 THEN
      INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
        VALUES (entry_id, line_no, rec.acct, rec.amt, 0, 'Expense '||bill.bill_number);
      line_no := line_no + 1;
    END IF;
  END LOOP;

  -- Dr VAT Receivable
  IF bill.tax_total <> 0 THEN
    IF vat_account IS NULL THEN RAISE EXCEPTION 'VAT Receivable account (2110) missing'; END IF;
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, line_no, vat_account, bill.tax_total, 0, 'VAT input '||bill.bill_number);
    line_no := line_no + 1;
  END IF;

  -- Cr AP total
  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, line_no, ap_account, 0, bill.total, 'AP '||bill.bill_number);

  UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = entry_id;
  UPDATE public.acc_ap_bills
    SET status='posted', posted_at = now(), journal_entry_id = entry_id
    WHERE id = bill.id;

  RETURN entry_id;
END;$$;

-- =========================================================
-- Void a posted bill via reversal
-- =========================================================
CREATE OR REPLACE FUNCTION public.acc_void_ap_bill(_bill_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  bill public.acc_ap_bills%ROWTYPE;
  new_entry uuid;
BEGIN
  SELECT * INTO bill FROM public.acc_ap_bills WHERE id=_bill_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bill not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), bill.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF bill.status NOT IN ('posted','paid') THEN RAISE EXCEPTION 'Only posted bills can be voided'; END IF;
  IF bill.amount_paid > 0 THEN RAISE EXCEPTION 'Cannot void a bill with payments applied'; END IF;
  IF bill.journal_entry_id IS NULL THEN RAISE EXCEPTION 'Original journal entry missing'; END IF;

  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by, is_reversal, reversed_by_entry_id)
    VALUES (bill.org_id, CURRENT_DATE, 'Reversal of AP Bill '||bill.bill_number,
            'ap_bill_void', bill.id, auth.uid(), true, bill.journal_entry_id)
    RETURNING id INTO new_entry;

  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    SELECT new_entry, line_no, account_id, credit, debit, 'Reversal: '||COALESCE(memo,'')
    FROM public.acc_journal_lines WHERE journal_entry_id = bill.journal_entry_id;

  UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = new_entry;
  UPDATE public.acc_ap_bills SET status='void', reversal_entry_id = new_entry WHERE id = bill.id;

  RETURN new_entry;
END;$$;

-- =========================================================
-- Post an AP payment: Dr AP / Cr Bank
-- =========================================================
CREATE OR REPLACE FUNCTION public.acc_post_ap_payment(_payment_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  pay public.acc_ap_payments%ROWTYPE;
  bill public.acc_ap_bills%ROWTYPE;
  sup  public.acc_suppliers%ROWTYPE;
  ap_account uuid;
  entry_id uuid;
  new_paid numeric(19,4);
BEGIN
  SELECT * INTO pay FROM public.acc_ap_payments WHERE id=_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF pay.posted_at IS NOT NULL THEN RAISE EXCEPTION 'Payment already posted'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), pay.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  SELECT * INTO bill FROM public.acc_ap_bills WHERE id=pay.bill_id FOR UPDATE;
  IF bill.status NOT IN ('posted','paid') THEN RAISE EXCEPTION 'Bill must be posted before paying'; END IF;
  IF pay.amount > (bill.total - bill.amount_paid) THEN RAISE EXCEPTION 'Payment exceeds outstanding balance'; END IF;

  SELECT * INTO sup FROM public.acc_suppliers WHERE id=bill.supplier_id;
  ap_account := COALESCE(sup.default_ap_account_id, public.acc_account_by_code(bill.org_id,'2000'));

  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by)
    VALUES (pay.org_id, pay.payment_date, 'Payment for '||bill.bill_number, 'ap_payment', pay.id, auth.uid())
    RETURNING id INTO entry_id;

  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, 1, ap_account, pay.amount, 0, 'Applied to '||bill.bill_number);
  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, 2, pay.bank_account_id, 0, pay.amount, 'Payment '||COALESCE(pay.reference,''));

  UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = entry_id;
  UPDATE public.acc_ap_payments SET posted_at = now(), journal_entry_id = entry_id WHERE id = pay.id;

  new_paid := bill.amount_paid + pay.amount;
  UPDATE public.acc_ap_bills
    SET amount_paid = new_paid,
        status = CASE WHEN new_paid >= bill.total THEN 'paid'::acc_ap_bill_status ELSE bill.status END
    WHERE id = bill.id;

  RETURN entry_id;
END;$$;

-- =========================================================
-- AP Aging view
-- =========================================================
CREATE OR REPLACE VIEW public.acc_ap_aging
WITH (security_invoker = true) AS
SELECT
  b.org_id,
  b.id AS bill_id,
  b.bill_number,
  b.supplier_id,
  s.name AS supplier_name,
  b.bill_date,
  b.due_date,
  b.total,
  b.amount_paid,
  (b.total - b.amount_paid) AS balance,
  GREATEST(0, (CURRENT_DATE - COALESCE(b.due_date, b.bill_date))) AS days_overdue,
  CASE
    WHEN COALESCE(b.due_date, b.bill_date) >= CURRENT_DATE THEN 'current'
    WHEN CURRENT_DATE - COALESCE(b.due_date, b.bill_date) <= 30 THEN '1-30'
    WHEN CURRENT_DATE - COALESCE(b.due_date, b.bill_date) <= 60 THEN '31-60'
    WHEN CURRENT_DATE - COALESCE(b.due_date, b.bill_date) <= 90 THEN '61-90'
    ELSE '90+'
  END AS bucket
FROM public.acc_ap_bills b
JOIN public.acc_suppliers s ON s.id = b.supplier_id
WHERE b.status IN ('posted','paid') AND (b.total - b.amount_paid) > 0;

GRANT SELECT ON public.acc_ap_aging TO authenticated;
