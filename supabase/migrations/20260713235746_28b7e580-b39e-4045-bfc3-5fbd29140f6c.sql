
-- Phase 9: Multi-currency & FX

-- FX rates table (per org, per date, per currency vs base)
CREATE TABLE public.acc_fx_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  rate_date DATE NOT NULL,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(18,8) NOT NULL CHECK (rate > 0),
  source TEXT DEFAULT 'manual',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, rate_date, from_currency, to_currency)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_fx_rates TO authenticated;
GRANT ALL ON public.acc_fx_rates TO service_role;
ALTER TABLE public.acc_fx_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fx_rates_org_read" ON public.acc_fx_rates FOR SELECT TO authenticated
USING (org_id IN (SELECT id FROM public.acc_organizations WHERE owner_user_id = auth.uid()
                  UNION SELECT org_id FROM public.acc_org_members WHERE user_id = auth.uid()));
CREATE POLICY "fx_rates_org_write" ON public.acc_fx_rates FOR ALL TO authenticated
USING (org_id IN (SELECT id FROM public.acc_organizations WHERE owner_user_id = auth.uid()
                  UNION SELECT org_id FROM public.acc_org_members WHERE user_id = auth.uid()))
WITH CHECK (org_id IN (SELECT id FROM public.acc_organizations WHERE owner_user_id = auth.uid()
                       UNION SELECT org_id FROM public.acc_org_members WHERE user_id = auth.uid()));

CREATE TRIGGER trg_fx_rates_updated BEFORE UPDATE ON public.acc_fx_rates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add FX Gain / Loss accounts to the default chart of accounts seeder
-- We keep it simple: add 4920 (FX Gains) and 6920 (FX Losses) via helper
CREATE OR REPLACE FUNCTION public.acc_ensure_fx_accounts(_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.acc_chart_of_accounts (org_id, code, name, type, subtype, is_active)
  VALUES
    (_org_id, '4920', 'Foreign Exchange Gains', 'revenue', 'other_income', TRUE),
    (_org_id, '6920', 'Foreign Exchange Losses', 'expense', 'other_expense', TRUE)
  ON CONFLICT (org_id, code) DO NOTHING;
END $$;

-- FX conversion helper: get rate at or before a given date
CREATE OR REPLACE FUNCTION public.acc_get_fx_rate(
  _org_id UUID, _from TEXT, _to TEXT, _date DATE
) RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  IF _from = _to THEN RETURN 1; END IF;

  SELECT rate INTO v_rate FROM public.acc_fx_rates
  WHERE org_id = _org_id AND from_currency = _from AND to_currency = _to
    AND rate_date <= _date
  ORDER BY rate_date DESC LIMIT 1;

  IF v_rate IS NOT NULL THEN RETURN v_rate; END IF;

  -- try inverse
  SELECT 1/rate INTO v_rate FROM public.acc_fx_rates
  WHERE org_id = _org_id AND from_currency = _to AND to_currency = _from
    AND rate_date <= _date
  ORDER BY rate_date DESC LIMIT 1;

  RETURN v_rate; -- null if not found
END $$;

-- FX revaluation: revalue open AR/AP balances in foreign currencies vs base currency
-- Simplified: compute unrealised gain/loss on outstanding invoice/bill balances
-- Posts a single balanced journal entry to 4920/6920 vs 1200/2000
CREATE OR REPLACE FUNCTION public.acc_post_fx_revaluation(
  _org_id UUID, _as_of DATE, _user_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base TEXT;
  v_ar_id UUID; v_ap_id UUID; v_gain_id UUID; v_loss_id UUID;
  v_entry_id UUID;
  v_ar_delta NUMERIC := 0;
  v_ap_delta NUMERIC := 0;
  r RECORD;
  v_rate NUMERIC;
  v_new_base NUMERIC;
  v_current_base NUMERIC;
BEGIN
  SELECT base_currency INTO v_base FROM public.acc_organizations WHERE id = _org_id;
  PERFORM public.acc_ensure_fx_accounts(_org_id);

  SELECT id INTO v_ar_id   FROM public.acc_chart_of_accounts WHERE org_id=_org_id AND code='1200';
  SELECT id INTO v_ap_id   FROM public.acc_chart_of_accounts WHERE org_id=_org_id AND code='2000';
  SELECT id INTO v_gain_id FROM public.acc_chart_of_accounts WHERE org_id=_org_id AND code='4920';
  SELECT id INTO v_loss_id FROM public.acc_chart_of_accounts WHERE org_id=_org_id AND code='6920';

  -- AR: outstanding invoices in foreign currency
  FOR r IN
    SELECT id, currency, total_amount, COALESCE(amount_paid,0) AS paid,
           COALESCE(exchange_rate,1) AS orig_rate, invoice_date
    FROM public.acc_ar_invoices
    WHERE org_id=_org_id AND status NOT IN ('paid','void','draft')
      AND currency IS NOT NULL AND currency <> v_base
  LOOP
    v_rate := public.acc_get_fx_rate(_org_id, r.currency, v_base, _as_of);
    IF v_rate IS NULL THEN CONTINUE; END IF;
    v_current_base := (r.total_amount - r.paid) * r.orig_rate;
    v_new_base     := (r.total_amount - r.paid) * v_rate;
    v_ar_delta := v_ar_delta + (v_new_base - v_current_base);
  END LOOP;

  -- AP: outstanding bills in foreign currency
  FOR r IN
    SELECT id, currency, total_amount, COALESCE(amount_paid,0) AS paid,
           COALESCE(exchange_rate,1) AS orig_rate, bill_date
    FROM public.acc_ap_bills
    WHERE org_id=_org_id AND status NOT IN ('paid','void','draft')
      AND currency IS NOT NULL AND currency <> v_base
  LOOP
    v_rate := public.acc_get_fx_rate(_org_id, r.currency, v_base, _as_of);
    IF v_rate IS NULL THEN CONTINUE; END IF;
    v_current_base := (r.total_amount - r.paid) * r.orig_rate;
    v_new_base     := (r.total_amount - r.paid) * v_rate;
    v_ap_delta := v_ap_delta + (v_new_base - v_current_base);
  END LOOP;

  IF ABS(v_ar_delta) < 0.005 AND ABS(v_ap_delta) < 0.005 THEN
    RAISE EXCEPTION 'No FX revaluation needed for %', _as_of;
  END IF;

  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, created_by, posted_at, posted_by)
  VALUES (_org_id, _as_of, 'FX Revaluation as of ' || _as_of, 'fx_reval', _user_id, now(), _user_id)
  RETURNING id INTO v_entry_id;

  -- AR side: increase in AR (positive delta) = Dr AR, Cr FX Gain
  IF v_ar_delta > 0.005 THEN
    INSERT INTO public.acc_journal_lines (entry_id, account_id, debit, credit, description)
    VALUES (v_entry_id, v_ar_id, v_ar_delta, 0, 'AR unrealised FX gain'),
           (v_entry_id, v_gain_id, 0, v_ar_delta, 'AR unrealised FX gain');
  ELSIF v_ar_delta < -0.005 THEN
    INSERT INTO public.acc_journal_lines (entry_id, account_id, debit, credit, description)
    VALUES (v_entry_id, v_loss_id, -v_ar_delta, 0, 'AR unrealised FX loss'),
           (v_entry_id, v_ar_id, 0, -v_ar_delta, 'AR unrealised FX loss');
  END IF;

  -- AP side: increase in AP (positive delta) = Cr AP, Dr FX Loss
  IF v_ap_delta > 0.005 THEN
    INSERT INTO public.acc_journal_lines (entry_id, account_id, debit, credit, description)
    VALUES (v_entry_id, v_loss_id, v_ap_delta, 0, 'AP unrealised FX loss'),
           (v_entry_id, v_ap_id, 0, v_ap_delta, 'AP unrealised FX loss');
  ELSIF v_ap_delta < -0.005 THEN
    INSERT INTO public.acc_journal_lines (entry_id, account_id, debit, credit, description)
    VALUES (v_entry_id, v_ap_id, -v_ap_delta, 0, 'AP unrealised FX gain'),
           (v_entry_id, v_gain_id, 0, -v_ap_delta, 'AP unrealised FX gain');
  END IF;

  RETURN v_entry_id;
END $$;
