
DO $$ BEGIN
  CREATE TYPE public.acc_depreciation_method AS ENUM ('straight_line','reducing_balance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.acc_fixed_asset_status AS ENUM ('active','fully_depreciated','disposed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.acc_depreciation_run_status AS ENUM ('draft','posted','void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed helper accounts: 4910 Gain on Disposal, 6910 Loss on Disposal
INSERT INTO public.acc_chart_of_accounts (org_id, code, name, type, subtype)
SELECT o.id, '4910', 'Gain on Asset Disposal', 'revenue', 'other_revenue'
FROM public.acc_organizations o
ON CONFLICT (org_id, code) DO NOTHING;

INSERT INTO public.acc_chart_of_accounts (org_id, code, name, type, subtype)
SELECT o.id, '6910', 'Loss on Asset Disposal', 'expense', 'operating_expense'
FROM public.acc_organizations o
ON CONFLICT (org_id, code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.acc_seed_default_coa(_org_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
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
    (_org_id, '4910', 'Gain on Asset Disposal',        'revenue',   'other_revenue'),
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
    (_org_id, '6900', 'Other Expenses',                'expense',   'operating_expense'),
    (_org_id, '6910', 'Loss on Asset Disposal',        'expense',   'operating_expense')
  ON CONFLICT (org_id, code) DO NOTHING;
END; $function$;

-- Fixed assets register
CREATE TABLE public.acc_fixed_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  asset_tag text,
  name text NOT NULL,
  category text,
  purchase_date date NOT NULL,
  purchase_cost numeric(19,4) NOT NULL DEFAULT 0,
  salvage_value numeric(19,4) NOT NULL DEFAULT 0,
  useful_life_months int NOT NULL DEFAULT 60,
  depreciation_method public.acc_depreciation_method NOT NULL DEFAULT 'straight_line',
  reducing_rate_pct numeric(6,3),
  asset_account_id uuid REFERENCES public.acc_chart_of_accounts(id),
  accum_depr_account_id uuid REFERENCES public.acc_chart_of_accounts(id),
  depr_expense_account_id uuid REFERENCES public.acc_chart_of_accounts(id),
  status public.acc_fixed_asset_status NOT NULL DEFAULT 'active',
  disposal_date date,
  disposal_proceeds numeric(19,4),
  disposal_entry_id uuid REFERENCES public.acc_journal_entries(id),
  acquisition_entry_id uuid REFERENCES public.acc_journal_entries(id),
  accumulated_depreciation numeric(19,4) NOT NULL DEFAULT 0,
  last_depreciated_on date,
  notes text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT acc_fa_life_positive CHECK (useful_life_months > 0),
  CONSTRAINT acc_fa_salvage_valid CHECK (salvage_value >= 0 AND salvage_value <= purchase_cost)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_fixed_assets TO authenticated;
GRANT ALL ON public.acc_fixed_assets TO service_role;
ALTER TABLE public.acc_fixed_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fa viewable by org members" ON public.acc_fixed_assets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE POLICY "fa manageable by org members" ON public.acc_fixed_assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_fa_updated BEFORE UPDATE ON public.acc_fixed_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Depreciation runs
CREATE TABLE public.acc_depreciation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  period_end date NOT NULL,
  reference text,
  status public.acc_depreciation_run_status NOT NULL DEFAULT 'draft',
  total_amount numeric(19,4) NOT NULL DEFAULT 0,
  journal_entry_id uuid REFERENCES public.acc_journal_entries(id),
  posted_at timestamptz,
  notes text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_depreciation_runs TO authenticated;
GRANT ALL ON public.acc_depreciation_runs TO service_role;
ALTER TABLE public.acc_depreciation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "depr runs viewable" ON public.acc_depreciation_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE POLICY "depr runs manageable" ON public.acc_depreciation_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_dr_updated BEFORE UPDATE ON public.acc_depreciation_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Depreciation lines
CREATE TABLE public.acc_depreciation_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES public.acc_depreciation_runs(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.acc_fixed_assets(id) ON DELETE RESTRICT,
  amount numeric(19,4) NOT NULL DEFAULT 0,
  book_value_before numeric(19,4) NOT NULL DEFAULT 0,
  book_value_after numeric(19,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, asset_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_depreciation_lines TO authenticated;
GRANT ALL ON public.acc_depreciation_lines TO service_role;
ALTER TABLE public.acc_depreciation_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "depr lines viewable" ON public.acc_depreciation_lines FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE POLICY "depr lines manageable" ON public.acc_depreciation_lines FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));

-- Post asset acquisition (Dr Fixed Asset / Cr Bank)
CREATE OR REPLACE FUNCTION public.acc_post_asset_acquisition(_asset_id uuid, _bank_account_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.acc_fixed_assets%ROWTYPE;
  asset_acct uuid;
  entry_id uuid;
BEGIN
  SELECT * INTO a FROM public.acc_fixed_assets WHERE id = _asset_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Asset not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), a.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF a.acquisition_entry_id IS NOT NULL THEN RAISE EXCEPTION 'Acquisition already posted'; END IF;
  IF a.purchase_cost <= 0 THEN RAISE EXCEPTION 'Purchase cost must be > 0'; END IF;
  IF _bank_account_id IS NULL THEN RAISE EXCEPTION 'Bank account required'; END IF;

  asset_acct := COALESCE(a.asset_account_id, public.acc_account_by_code(a.org_id,'1500'));
  IF asset_acct IS NULL THEN RAISE EXCEPTION 'Fixed asset account (1500) missing'; END IF;

  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by)
    VALUES (a.org_id, a.purchase_date,
            'Acquisition: '||a.name, 'manual', a.id, auth.uid())
    RETURNING id INTO entry_id;

  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, 1, asset_acct, a.purchase_cost, 0, a.name);
  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, 2, _bank_account_id, 0, a.purchase_cost, 'Paid for '||a.name);

  UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = entry_id;

  UPDATE public.acc_fixed_assets SET acquisition_entry_id = entry_id, asset_account_id = asset_acct WHERE id = a.id;
  RETURN entry_id;
END; $$;

-- Compute monthly depreciation amount for an asset for a given month-end (does not persist)
CREATE OR REPLACE FUNCTION public.acc_asset_monthly_depreciation(_asset_id uuid, _period_end date)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.acc_fixed_assets%ROWTYPE;
  depreciable numeric(19,4);
  book_value numeric(19,4);
  amt numeric(19,4);
  remaining_cap numeric(19,4);
BEGIN
  SELECT * INTO a FROM public.acc_fixed_assets WHERE id = _asset_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  IF a.status <> 'active' THEN RETURN 0; END IF;
  IF _period_end < a.purchase_date THEN RETURN 0; END IF;
  IF a.last_depreciated_on IS NOT NULL AND a.last_depreciated_on >= _period_end THEN RETURN 0; END IF;

  depreciable := GREATEST(a.purchase_cost - a.salvage_value, 0);
  book_value  := a.purchase_cost - a.accumulated_depreciation;
  remaining_cap := GREATEST(book_value - a.salvage_value, 0);

  IF a.depreciation_method = 'straight_line' THEN
    amt := depreciable / a.useful_life_months;
  ELSE
    -- Reducing balance: annual rate → monthly
    amt := book_value * (COALESCE(a.reducing_rate_pct, 100.0 / GREATEST(a.useful_life_months/12.0,1)) / 100.0) / 12.0;
  END IF;

  amt := LEAST(amt, remaining_cap);
  IF amt < 0 THEN amt := 0; END IF;
  RETURN round(amt::numeric, 2);
END; $$;

-- Create a draft depreciation run seeded with all active assets
CREATE OR REPLACE FUNCTION public.acc_create_depreciation_run(_org_id uuid, _period_end date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  run_id uuid;
  a RECORD;
  amt numeric(19,4);
  total numeric(19,4) := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), _org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  INSERT INTO public.acc_depreciation_runs (org_id, period_end) VALUES (_org_id, _period_end)
    RETURNING id INTO run_id;

  FOR a IN
    SELECT * FROM public.acc_fixed_assets
      WHERE org_id = _org_id AND status = 'active'
        AND purchase_date <= _period_end
        AND (last_depreciated_on IS NULL OR last_depreciated_on < _period_end)
  LOOP
    amt := public.acc_asset_monthly_depreciation(a.id, _period_end);
    IF amt > 0 THEN
      INSERT INTO public.acc_depreciation_lines (org_id, run_id, asset_id, amount, book_value_before, book_value_after)
        VALUES (_org_id, run_id, a.id, amt,
                a.purchase_cost - a.accumulated_depreciation,
                a.purchase_cost - a.accumulated_depreciation - amt);
      total := total + amt;
    END IF;
  END LOOP;

  UPDATE public.acc_depreciation_runs SET total_amount = total WHERE id = run_id;
  RETURN run_id;
END; $$;

-- Post depreciation run to ledger and update asset accumulated depreciation
CREATE OR REPLACE FUNCTION public.acc_post_depreciation_run(_run_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.acc_depreciation_runs%ROWTYPE;
  expense_acct uuid; accum_acct uuid;
  entry_id uuid; ln int := 1;
  ln_rec RECORD;
BEGIN
  SELECT * INTO r FROM public.acc_depreciation_runs WHERE id = _run_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Run not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), r.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF r.status <> 'draft' THEN RAISE EXCEPTION 'Only draft runs can be posted'; END IF;
  IF r.total_amount <= 0 THEN RAISE EXCEPTION 'Run has no depreciation to post'; END IF;

  expense_acct := public.acc_account_by_code(r.org_id,'6200');
  accum_acct   := public.acc_account_by_code(r.org_id,'1510');
  IF expense_acct IS NULL OR accum_acct IS NULL THEN
    RAISE EXCEPTION 'Depreciation accounts missing (need 6200 & 1510)';
  END IF;

  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by)
    VALUES (r.org_id, r.period_end, 'Depreciation for '||to_char(r.period_end,'YYYY-MM'), 'adjustment', r.id, auth.uid())
    RETURNING id INTO entry_id;

  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, ln, expense_acct, r.total_amount, 0, 'Depreciation expense');
  ln := ln + 1;
  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, ln, accum_acct, 0, r.total_amount, 'Accumulated depreciation');

  UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = entry_id;

  -- Update asset accum + last-depreciated + auto-mark fully depreciated
  FOR ln_rec IN SELECT * FROM public.acc_depreciation_lines WHERE run_id = r.id LOOP
    UPDATE public.acc_fixed_assets
      SET accumulated_depreciation = accumulated_depreciation + ln_rec.amount,
          last_depreciated_on = r.period_end,
          status = CASE
            WHEN (accumulated_depreciation + ln_rec.amount) >= (purchase_cost - salvage_value)
              THEN 'fully_depreciated'::acc_fixed_asset_status
            ELSE status END
      WHERE id = ln_rec.asset_id;
  END LOOP;

  UPDATE public.acc_depreciation_runs
    SET status = 'posted', posted_at = now(), journal_entry_id = entry_id
    WHERE id = r.id;

  RETURN entry_id;
END; $$;

-- Dispose asset (Dr Bank + Accum Depr, Cr Fixed Asset, Cr/Dr Gain/Loss)
CREATE OR REPLACE FUNCTION public.acc_dispose_asset(_asset_id uuid, _disposal_date date, _proceeds numeric, _bank_account_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.acc_fixed_assets%ROWTYPE;
  asset_acct uuid; accum_acct uuid; gain_acct uuid; loss_acct uuid;
  book_value numeric(19,4); gain_loss numeric(19,4);
  entry_id uuid; ln int := 1;
BEGIN
  SELECT * INTO a FROM public.acc_fixed_assets WHERE id = _asset_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Asset not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), a.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF a.status = 'disposed' THEN RAISE EXCEPTION 'Already disposed'; END IF;
  IF _proceeds IS NULL OR _proceeds < 0 THEN RAISE EXCEPTION 'Proceeds must be >= 0'; END IF;

  asset_acct := COALESCE(a.asset_account_id, public.acc_account_by_code(a.org_id,'1500'));
  accum_acct := COALESCE(a.accum_depr_account_id, public.acc_account_by_code(a.org_id,'1510'));
  gain_acct  := public.acc_account_by_code(a.org_id,'4910');
  loss_acct  := public.acc_account_by_code(a.org_id,'6910');
  IF asset_acct IS NULL OR accum_acct IS NULL THEN RAISE EXCEPTION 'Asset accounts missing'; END IF;

  book_value := a.purchase_cost - a.accumulated_depreciation;
  gain_loss  := _proceeds - book_value; -- positive = gain, negative = loss

  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by)
    VALUES (a.org_id, _disposal_date, 'Disposal: '||a.name, 'manual', a.id, auth.uid())
    RETURNING id INTO entry_id;

  IF _proceeds > 0 THEN
    IF _bank_account_id IS NULL THEN RAISE EXCEPTION 'Bank account required for proceeds'; END IF;
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, ln, _bank_account_id, _proceeds, 0, 'Sale proceeds'); ln := ln + 1;
  END IF;

  IF a.accumulated_depreciation > 0 THEN
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, ln, accum_acct, a.accumulated_depreciation, 0, 'Clear accum depr'); ln := ln + 1;
  END IF;

  INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
    VALUES (entry_id, ln, asset_acct, 0, a.purchase_cost, 'Remove asset cost'); ln := ln + 1;

  IF gain_loss > 0 THEN
    IF gain_acct IS NULL THEN RAISE EXCEPTION 'Gain account (4910) missing'; END IF;
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, ln, gain_acct, 0, gain_loss, 'Gain on disposal');
  ELSIF gain_loss < 0 THEN
    IF loss_acct IS NULL THEN RAISE EXCEPTION 'Loss account (6910) missing'; END IF;
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, ln, loss_acct, -gain_loss, 0, 'Loss on disposal');
  END IF;

  UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = entry_id;

  UPDATE public.acc_fixed_assets
    SET status = 'disposed', disposal_date = _disposal_date, disposal_proceeds = _proceeds,
        disposal_entry_id = entry_id
    WHERE id = a.id;

  RETURN entry_id;
END; $$;
