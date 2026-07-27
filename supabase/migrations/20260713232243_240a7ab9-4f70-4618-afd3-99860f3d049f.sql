
-- Seed default UK Chart of Accounts for an org
CREATE OR REPLACE FUNCTION public.acc_seed_default_coa(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permission check
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), _org_id)) THEN
    RAISE EXCEPTION 'Not permitted to seed COA for this org';
  END IF;

  INSERT INTO public.acc_chart_of_accounts (org_id, code, name, type, subtype) VALUES
    -- Assets
    (_org_id, '1000', 'Bank - Current Account',        'asset',     'current_asset'),
    (_org_id, '1010', 'Bank - Savings',                'asset',     'current_asset'),
    (_org_id, '1020', 'Petty Cash',                    'asset',     'current_asset'),
    (_org_id, '1100', 'Accounts Receivable',           'asset',     'current_asset'),
    (_org_id, '1200', 'Prepayments',                   'asset',     'current_asset'),
    (_org_id, '1300', 'Inventory',                     'asset',     'current_asset'),
    (_org_id, '1500', 'Fixed Assets - Equipment',      'asset',     'fixed_asset'),
    (_org_id, '1510', 'Accumulated Depreciation',      'asset',     'fixed_asset'),
    -- Liabilities
    (_org_id, '2000', 'Accounts Payable',              'liability', 'current_liability'),
    (_org_id, '2100', 'VAT Payable',                   'liability', 'current_liability'),
    (_org_id, '2110', 'VAT Receivable',                'liability', 'current_liability'),
    (_org_id, '2200', 'PAYE / NI Payable',             'liability', 'current_liability'),
    (_org_id, '2300', 'Corporation Tax Payable',       'liability', 'current_liability'),
    (_org_id, '2400', 'Accruals',                      'liability', 'current_liability'),
    (_org_id, '2500', 'Loans Payable',                 'liability', 'long_term_liability'),
    -- Equity
    (_org_id, '3000', 'Share Capital',                 'equity',    'equity'),
    (_org_id, '3100', 'Retained Earnings',             'equity',    'equity'),
    (_org_id, '3200', 'Owner Drawings',                'equity',    'equity'),
    -- Revenue
    (_org_id, '4000', 'Sales Revenue',                 'revenue',   'operating_revenue'),
    (_org_id, '4100', 'Service Revenue',               'revenue',   'operating_revenue'),
    (_org_id, '4900', 'Other Income',                  'revenue',   'other_revenue'),
    -- Expenses
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
$$;

GRANT EXECUTE ON FUNCTION public.acc_seed_default_coa(uuid) TO authenticated, service_role;

-- On new org: add owner as member, grant owner role, seed COA, open current-year period
CREATE OR REPLACE FUNCTION public.acc_after_org_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fy_start date;
  fy_end   date;
BEGIN
  INSERT INTO public.acc_org_members (org_id, user_id)
    VALUES (NEW.id, NEW.owner_user_id)
    ON CONFLICT DO NOTHING;

  INSERT INTO public.acc_user_roles (org_id, user_id, role, can_post_journal, can_close_period, can_approve_payment, can_reopen_period)
    VALUES (NEW.id, NEW.owner_user_id, 'owner', true, true, true, true)
    ON CONFLICT DO NOTHING;

  PERFORM public.acc_seed_default_coa(NEW.id);

  fy_start := COALESCE(NEW.fiscal_year_start, date_trunc('year', now())::date);
  fy_end   := (fy_start + INTERVAL '1 year' - INTERVAL '1 day')::date;
  INSERT INTO public.acc_accounting_periods (org_id, start_date, end_date, status)
    VALUES (NEW.id, fy_start, fy_end, 'open')
    ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS acc_org_after_insert ON public.acc_organizations;
CREATE TRIGGER acc_org_after_insert
  AFTER INSERT ON public.acc_organizations
  FOR EACH ROW EXECUTE FUNCTION public.acc_after_org_insert();

ALTER FUNCTION public.acc_after_org_insert() SET search_path = public;
ALTER FUNCTION public.acc_seed_default_coa(uuid) SET search_path = public;
