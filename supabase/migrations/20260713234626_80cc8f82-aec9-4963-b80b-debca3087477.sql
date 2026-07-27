
-- VAT return status
DO $$ BEGIN
  CREATE TYPE public.acc_vat_return_status AS ENUM ('draft','submitted','paid','void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed VAT Control account for existing orgs (idempotent)
INSERT INTO public.acc_chart_of_accounts (org_id, code, name, type, subtype)
SELECT o.id, '2120', 'VAT Control', 'liability', 'current_liability'
FROM public.acc_organizations o
ON CONFLICT (org_id, code) DO NOTHING;

-- Extend seeder so future orgs get 2120
CREATE OR REPLACE FUNCTION public.acc_seed_default_coa(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), _org_id)) THEN
    RAISE EXCEPTION 'Not permitted to seed COA for this org';
  END IF;

  INSERT INTO public.acc_chart_of_accounts (org_id, code, name, type, subtype) VALUES
    (_org_id, '1000', 'Bank - Current Account',        'asset',     'current_asset'),
    (_org_id, '1010', 'Bank - Savings',                'asset',     'current_asset'),
    (_org_id, '1020', 'Petty Cash',                    'asset',     'current_asset'),
    (_org_id, '1100', 'Accounts Receivable',           'asset',     'current_asset'),
    (_org_id, '1200', 'Prepayments',                   'asset',     'current_asset'),
    (_org_id, '1300', 'Inventory',                     'asset',     'current_asset'),
    (_org_id, '1500', 'Fixed Assets - Equipment',      'asset',     'fixed_asset'),
    (_org_id, '1510', 'Accumulated Depreciation',      'asset',     'fixed_asset'),
    (_org_id, '2000', 'Accounts Payable',              'liability', 'current_liability'),
    (_org_id, '2100', 'VAT Payable',                   'liability', 'current_liability'),
    (_org_id, '2110', 'VAT Receivable',                'liability', 'current_liability'),
    (_org_id, '2120', 'VAT Control',                   'liability', 'current_liability'),
    (_org_id, '2200', 'PAYE / NI Payable',             'liability', 'current_liability'),
    (_org_id, '2300', 'Corporation Tax Payable',       'liability', 'current_liability'),
    (_org_id, '2400', 'Accruals',                      'liability', 'current_liability'),
    (_org_id, '2500', 'Loans Payable',                 'liability', 'long_term_liability'),
    (_org_id, '3000', 'Share Capital',                 'equity',    'equity'),
    (_org_id, '3100', 'Retained Earnings',             'equity',    'equity'),
    (_org_id, '3200', 'Owner Drawings',                'equity',    'equity'),
    (_org_id, '4000', 'Sales Revenue',                 'revenue',   'operating_revenue'),
    (_org_id, '4100', 'Service Revenue',               'revenue',   'operating_revenue'),
    (_org_id, '4900', 'Other Income',                  'revenue',   'other_revenue'),
    (_org_id, '5000', 'Cost of Goods Sold',            'expense',   'cogs'),
    (_org_id, '6000', 'Salaries & Wages',              'expense',   'operating_expense'),
    (_org_id, '6100', 'Rent',                          'expense',   'operating_expense'),
    (_org_id, '6110', 'Utilities',                     'expense',   'operating_expense'),
    (_org_id, '6120', 'Office Supplies',               'expense',   'operating_expense'),
    (_org_id, '6130', 'Software & Subscriptions',      'expense',   'operating_expense'),
    (_org_id, '6140', 'Marketing & Advertising',       'expense',   'operating_expense'),
    (_org_id, '6150', 'Professional Fees',             'expense',   'operating_expense'),
    (_org_id, '6160', 'Travel',                        'expense',   'operating_expense'),
    (_org_id, '6170', 'Insurance',                     'expense',   'operating_expense'),
    (_org_id, '6200', 'Depreciation',                  'expense',   'operating_expense'),
    (_org_id, '6300', 'Bank Fees',                     'expense',   'operating_expense'),
    (_org_id, '6900', 'Other Expenses',                'expense',   'operating_expense')
  ON CONFLICT (org_id, code) DO NOTHING;
END;
$function$;

-- VAT returns table
CREATE TABLE public.acc_vat_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  output_vat numeric(19,4) NOT NULL DEFAULT 0,
  input_vat  numeric(19,4) NOT NULL DEFAULT 0,
  net_due    numeric(19,4) NOT NULL DEFAULT 0,
  status public.acc_vat_return_status NOT NULL DEFAULT 'draft',
  reference text,
  notes text,
  submitted_at timestamptz,
  submitted_by uuid,
  submission_entry_id uuid REFERENCES public.acc_journal_entries(id),
  payment_date date,
  payment_amount numeric(19,4),
  payment_entry_id uuid REFERENCES public.acc_journal_entries(id),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT acc_vat_returns_period_valid CHECK (period_end >= period_start),
  CONSTRAINT acc_vat_returns_period_unique UNIQUE (org_id, period_start, period_end)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_vat_returns TO authenticated;
GRANT ALL ON public.acc_vat_returns TO service_role;

ALTER TABLE public.acc_vat_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vat returns viewable by org members"
  ON public.acc_vat_returns FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));

CREATE POLICY "vat returns manageable by org members"
  ON public.acc_vat_returns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));

CREATE TRIGGER trg_acc_vat_returns_updated_at
  BEFORE UPDATE ON public.acc_vat_returns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Calculate VAT movement for a period from the posted ledger
CREATE OR REPLACE FUNCTION public.acc_calculate_vat(_org_id uuid, _start date, _end date)
RETURNS TABLE(output_vat numeric, input_vat numeric, net_due numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  out_acct uuid;
  in_acct  uuid;
  o numeric(19,4); i numeric(19,4);
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), _org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  out_acct := public.acc_account_by_code(_org_id,'2100');
  in_acct  := public.acc_account_by_code(_org_id,'2110');

  SELECT COALESCE(SUM(l.credit - l.debit),0) INTO o
    FROM public.acc_journal_lines l
    JOIN public.acc_journal_entries e ON e.id = l.journal_entry_id
   WHERE e.org_id = _org_id AND e.posted_at IS NOT NULL
     AND e.entry_date BETWEEN _start AND _end
     AND l.account_id = out_acct;

  SELECT COALESCE(SUM(l.debit - l.credit),0) INTO i
    FROM public.acc_journal_lines l
    JOIN public.acc_journal_entries e ON e.id = l.journal_entry_id
   WHERE e.org_id = _org_id AND e.posted_at IS NOT NULL
     AND e.entry_date BETWEEN _start AND _end
     AND l.account_id = in_acct;

  RETURN QUERY SELECT o, i, (o - i);
END; $$;

-- Submit a VAT return: lock snapshot, post ledger entry closing 2100/2110 into 2120
CREATE OR REPLACE FUNCTION public.acc_submit_vat_return(_return_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  ret public.acc_vat_returns%ROWTYPE;
  out_acct uuid; in_acct uuid; ctrl_acct uuid;
  entry_id uuid; line_no int := 1;
  o numeric(19,4); i numeric(19,4); n numeric(19,4);
BEGIN
  SELECT * INTO ret FROM public.acc_vat_returns WHERE id = _return_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'VAT return not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), ret.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF ret.status <> 'draft' THEN RAISE EXCEPTION 'Only draft returns can be submitted'; END IF;

  SELECT output_vat, input_vat, net_due INTO o, i, n
    FROM public.acc_calculate_vat(ret.org_id, ret.period_start, ret.period_end);

  out_acct  := public.acc_account_by_code(ret.org_id,'2100');
  in_acct   := public.acc_account_by_code(ret.org_id,'2110');
  ctrl_acct := public.acc_account_by_code(ret.org_id,'2120');
  IF ctrl_acct IS NULL THEN RAISE EXCEPTION 'VAT Control account (2120) missing in COA'; END IF;

  entry_id := NULL;
  IF o <> 0 OR i <> 0 THEN
    INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by)
      VALUES (ret.org_id, ret.period_end,
              'VAT Return '||to_char(ret.period_start,'YYYY-MM-DD')||' → '||to_char(ret.period_end,'YYYY-MM-DD'),
              'adjustment', ret.id, auth.uid())
      RETURNING id INTO entry_id;

    IF o <> 0 THEN
      INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
        VALUES (entry_id, line_no, out_acct, o, 0, 'Clear Output VAT');
      line_no := line_no + 1;
    END IF;
    IF i <> 0 THEN
      INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
        VALUES (entry_id, line_no, in_acct, 0, i, 'Clear Input VAT');
      line_no := line_no + 1;
    END IF;
    IF n > 0 THEN
      INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
        VALUES (entry_id, line_no, ctrl_acct, 0, n, 'Net VAT payable');
    ELSIF n < 0 THEN
      INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
        VALUES (entry_id, line_no, ctrl_acct, -n, 0, 'Net VAT refund receivable');
    END IF;

    UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = entry_id;
  END IF;

  UPDATE public.acc_vat_returns
    SET output_vat = o, input_vat = i, net_due = n,
        status = 'submitted', submitted_at = now(), submitted_by = auth.uid(),
        submission_entry_id = entry_id
    WHERE id = ret.id;

  RETURN entry_id;
END; $$;

-- Record VAT payment (or refund) against a bank account
CREATE OR REPLACE FUNCTION public.acc_pay_vat_return(_return_id uuid, _bank_account_id uuid, _payment_date date, _amount numeric)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  ret public.acc_vat_returns%ROWTYPE;
  ctrl_acct uuid;
  entry_id uuid;
BEGIN
  SELECT * INTO ret FROM public.acc_vat_returns WHERE id = _return_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'VAT return not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), ret.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF ret.status <> 'submitted' THEN RAISE EXCEPTION 'Only submitted returns can be paid'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Amount must be > 0'; END IF;
  IF _bank_account_id IS NULL THEN RAISE EXCEPTION 'Bank account required'; END IF;

  ctrl_acct := public.acc_account_by_code(ret.org_id,'2120');

  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by)
    VALUES (ret.org_id, _payment_date,
            CASE WHEN ret.net_due >= 0 THEN 'VAT Payment' ELSE 'VAT Refund' END
            ||' for period ending '||to_char(ret.period_end,'YYYY-MM-DD'),
            'bank', ret.id, auth.uid())
    RETURNING id INTO entry_id;

  IF ret.net_due >= 0 THEN
    -- Payment out: Dr VAT Control / Cr Bank
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, 1, ctrl_acct, _amount, 0, 'VAT paid');
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, 2, _bank_account_id, 0, _amount, 'VAT paid');
  ELSE
    -- Refund in: Dr Bank / Cr VAT Control
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, 1, _bank_account_id, _amount, 0, 'VAT refund received');
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, 2, ctrl_acct, 0, _amount, 'VAT refund received');
  END IF;

  UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = entry_id;

  UPDATE public.acc_vat_returns
    SET status = 'paid', payment_date = _payment_date, payment_amount = _amount,
        payment_entry_id = entry_id
    WHERE id = ret.id;

  RETURN entry_id;
END; $$;
