
DO $$ BEGIN
  CREATE TYPE public.acc_pay_type AS ENUM ('salary','hourly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.acc_pay_run_status AS ENUM ('draft','posted','paid','void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed helper accounts (Pension Payable 2210, Net Wages Payable 2220, Employer NI 6010) for existing orgs
INSERT INTO public.acc_chart_of_accounts (org_id, code, name, type, subtype)
SELECT o.id, '2210', 'Pension Payable', 'liability', 'current_liability'
FROM public.acc_organizations o
ON CONFLICT (org_id, code) DO NOTHING;

INSERT INTO public.acc_chart_of_accounts (org_id, code, name, type, subtype)
SELECT o.id, '2220', 'Net Wages Payable', 'liability', 'current_liability'
FROM public.acc_organizations o
ON CONFLICT (org_id, code) DO NOTHING;

INSERT INTO public.acc_chart_of_accounts (org_id, code, name, type, subtype)
SELECT o.id, '6010', 'Employer NI Contributions', 'expense', 'operating_expense'
FROM public.acc_organizations o
ON CONFLICT (org_id, code) DO NOTHING;

-- Extend seeder for future orgs
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
    (_org_id, '2210', 'Pension Payable',               'liability', 'current_liability'),
    (_org_id, '2220', 'Net Wages Payable',             'liability', 'current_liability'),
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
    (_org_id, '6010', 'Employer NI Contributions',     'expense',   'operating_expense'),
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

-- Employees
CREATE TABLE public.acc_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  job_title text,
  tax_code text,
  ni_number text,
  pay_type public.acc_pay_type NOT NULL DEFAULT 'salary',
  pay_rate numeric(19,4) NOT NULL DEFAULT 0,     -- monthly salary OR hourly rate
  default_hours numeric(10,2) NOT NULL DEFAULT 0, -- default hours per pay period (hourly)
  employment_start date,
  employment_end date,
  bank_sort_code text,
  bank_account_number text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_employees TO authenticated;
GRANT ALL ON public.acc_employees TO service_role;
ALTER TABLE public.acc_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees viewable by org members" ON public.acc_employees FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE POLICY "employees manageable by org members" ON public.acc_employees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_employees_updated_at BEFORE UPDATE ON public.acc_employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pay runs
CREATE TABLE public.acc_pay_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  pay_date date NOT NULL,
  reference text,
  status public.acc_pay_run_status NOT NULL DEFAULT 'draft',
  total_gross numeric(19,4) NOT NULL DEFAULT 0,
  total_paye numeric(19,4) NOT NULL DEFAULT 0,
  total_ni_ee numeric(19,4) NOT NULL DEFAULT 0,
  total_ni_er numeric(19,4) NOT NULL DEFAULT 0,
  total_pension numeric(19,4) NOT NULL DEFAULT 0,
  total_other_ded numeric(19,4) NOT NULL DEFAULT 0,
  total_net numeric(19,4) NOT NULL DEFAULT 0,
  posted_at timestamptz,
  journal_entry_id uuid REFERENCES public.acc_journal_entries(id),
  payment_entry_id uuid REFERENCES public.acc_journal_entries(id),
  paid_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT acc_pay_runs_period_valid CHECK (period_end >= period_start)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_pay_runs TO authenticated;
GRANT ALL ON public.acc_pay_runs TO service_role;
ALTER TABLE public.acc_pay_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pay runs viewable by org members" ON public.acc_pay_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE POLICY "pay runs manageable by org members" ON public.acc_pay_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_pay_runs_updated_at BEFORE UPDATE ON public.acc_pay_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payslips
CREATE TABLE public.acc_payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  pay_run_id uuid NOT NULL REFERENCES public.acc_pay_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.acc_employees(id) ON DELETE RESTRICT,
  hours numeric(10,2) NOT NULL DEFAULT 0,
  gross numeric(19,4) NOT NULL DEFAULT 0,
  paye numeric(19,4) NOT NULL DEFAULT 0,
  ni_ee numeric(19,4) NOT NULL DEFAULT 0,
  ni_er numeric(19,4) NOT NULL DEFAULT 0,
  pension numeric(19,4) NOT NULL DEFAULT 0,
  other_ded numeric(19,4) NOT NULL DEFAULT 0,
  net numeric(19,4) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pay_run_id, employee_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_payslips TO authenticated;
GRANT ALL ON public.acc_payslips TO service_role;
ALTER TABLE public.acc_payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payslips viewable by org members" ON public.acc_payslips FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE POLICY "payslips manageable by org members" ON public.acc_payslips FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_payslips_updated_at BEFORE UPDATE ON public.acc_payslips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recalculate pay-run totals from its payslips
CREATE OR REPLACE FUNCTION public.acc_recalc_pay_run(_pay_run_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE org uuid;
BEGIN
  SELECT org_id INTO org FROM public.acc_pay_runs WHERE id = _pay_run_id;
  IF org IS NULL THEN RAISE EXCEPTION 'Pay run not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  UPDATE public.acc_pay_runs pr
    SET total_gross = COALESCE(s.g,0), total_paye = COALESCE(s.p,0),
        total_ni_ee = COALESCE(s.nee,0), total_ni_er = COALESCE(s.ner,0),
        total_pension = COALESCE(s.pen,0), total_other_ded = COALESCE(s.od,0),
        total_net = COALESCE(s.n,0)
  FROM (
    SELECT pay_run_id,
           SUM(gross) g, SUM(paye) p, SUM(ni_ee) nee, SUM(ni_er) ner,
           SUM(pension) pen, SUM(other_ded) od, SUM(net) n
      FROM public.acc_payslips WHERE pay_run_id = _pay_run_id GROUP BY pay_run_id
  ) s
  WHERE pr.id = _pay_run_id;
END; $$;

-- Post pay run to the ledger
CREATE OR REPLACE FUNCTION public.acc_post_pay_run(_pay_run_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pr public.acc_pay_runs%ROWTYPE;
  wages_acct uuid; er_ni_acct uuid; paye_acct uuid; pension_acct uuid; net_acct uuid;
  entry_id uuid; line_no int := 1;
  slip_count int;
BEGIN
  SELECT * INTO pr FROM public.acc_pay_runs WHERE id = _pay_run_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pay run not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), pr.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF pr.status <> 'draft' THEN RAISE EXCEPTION 'Only draft pay runs can be posted'; END IF;

  SELECT COUNT(*) INTO slip_count FROM public.acc_payslips WHERE pay_run_id = pr.id;
  IF slip_count = 0 THEN RAISE EXCEPTION 'Pay run has no payslips'; END IF;

  PERFORM public.acc_recalc_pay_run(pr.id);
  SELECT * INTO pr FROM public.acc_pay_runs WHERE id = pr.id;

  IF pr.total_gross <= 0 THEN RAISE EXCEPTION 'Gross pay total must be > 0'; END IF;

  wages_acct   := public.acc_account_by_code(pr.org_id,'6000');
  er_ni_acct   := public.acc_account_by_code(pr.org_id,'6010');
  paye_acct    := public.acc_account_by_code(pr.org_id,'2200');
  pension_acct := public.acc_account_by_code(pr.org_id,'2210');
  net_acct     := public.acc_account_by_code(pr.org_id,'2220');
  IF wages_acct IS NULL OR paye_acct IS NULL OR net_acct IS NULL THEN
    RAISE EXCEPTION 'Payroll accounts missing (need 6000, 2200, 2220)';
  END IF;

  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by)
    VALUES (pr.org_id, pr.pay_date,
            'Payroll '||to_char(pr.period_start,'YYYY-MM-DD')||' → '||to_char(pr.period_end,'YYYY-MM-DD'),
            'payroll', pr.id, auth.uid())
    RETURNING id INTO entry_id;

  -- Dr Gross wages (expense)
  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, line_no, wages_acct, pr.total_gross, 0, 'Gross wages');
  line_no := line_no + 1;

  -- Dr Employer NI expense
  IF pr.total_ni_er <> 0 THEN
    IF er_ni_acct IS NULL THEN RAISE EXCEPTION 'Employer NI account (6010) missing'; END IF;
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, line_no, er_ni_acct, pr.total_ni_er, 0, 'Employer NI');
    line_no := line_no + 1;
  END IF;

  -- Cr PAYE + NI (both employee and employer NI go into 2200)
  IF (pr.total_paye + pr.total_ni_ee + pr.total_ni_er) <> 0 THEN
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, line_no, paye_acct, 0, pr.total_paye + pr.total_ni_ee + pr.total_ni_er, 'PAYE + NI due');
    line_no := line_no + 1;
  END IF;

  -- Cr Pension
  IF pr.total_pension <> 0 THEN
    IF pension_acct IS NULL THEN RAISE EXCEPTION 'Pension Payable (2210) missing'; END IF;
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, line_no, pension_acct, 0, pr.total_pension, 'Pension contributions');
    line_no := line_no + 1;
  END IF;

  -- Cr Net wages payable
  IF pr.total_net <> 0 THEN
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, line_no, net_acct, 0, pr.total_net, 'Net wages payable');
  END IF;

  UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = entry_id;

  UPDATE public.acc_pay_runs
    SET status = 'posted', posted_at = now(), journal_entry_id = entry_id
    WHERE id = pr.id;

  RETURN entry_id;
END; $$;

-- Record net wages payment from a bank account
CREATE OR REPLACE FUNCTION public.acc_pay_pay_run(_pay_run_id uuid, _bank_account_id uuid, _payment_date date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pr public.acc_pay_runs%ROWTYPE;
  net_acct uuid; entry_id uuid;
BEGIN
  SELECT * INTO pr FROM public.acc_pay_runs WHERE id = _pay_run_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pay run not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), pr.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF pr.status <> 'posted' THEN RAISE EXCEPTION 'Only posted pay runs can be paid'; END IF;
  IF pr.total_net <= 0 THEN RAISE EXCEPTION 'Nothing to pay'; END IF;
  IF _bank_account_id IS NULL THEN RAISE EXCEPTION 'Bank account required'; END IF;

  net_acct := public.acc_account_by_code(pr.org_id,'2220');

  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by)
    VALUES (pr.org_id, _payment_date,
            'Payroll net-wages payment '||to_char(pr.period_end,'YYYY-MM-DD'),
            'bank', pr.id, auth.uid())
    RETURNING id INTO entry_id;

  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, 1, net_acct, pr.total_net, 0, 'Clear net wages payable');
  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, 2, _bank_account_id, 0, pr.total_net, 'Net wages paid');

  UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = entry_id;

  UPDATE public.acc_pay_runs
    SET status = 'paid', paid_at = now(), payment_entry_id = entry_id
    WHERE id = pr.id;

  RETURN entry_id;
END; $$;
