SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;
CREATE SCHEMA IF NOT EXISTS public;
--
-- Name: acc_account_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_account_type AS ENUM (
    'asset',
    'liability',
    'equity',
    'revenue',
    'expense'
);
--
-- Name: acc_ap_bill_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_ap_bill_status AS ENUM (
    'draft',
    'posted',
    'paid',
    'void'
);
--
-- Name: acc_ar_invoice_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_ar_invoice_status AS ENUM (
    'draft',
    'posted',
    'paid',
    'void'
);
--
-- Name: acc_bank_txn_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_bank_txn_status AS ENUM (
    'unmatched',
    'matched',
    'reconciled',
    'ignored'
);
--
-- Name: acc_depreciation_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_depreciation_method AS ENUM (
    'straight_line',
    'reducing_balance'
);
--
-- Name: acc_depreciation_run_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_depreciation_run_status AS ENUM (
    'draft',
    'posted',
    'void'
);
--
-- Name: acc_fixed_asset_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_fixed_asset_status AS ENUM (
    'active',
    'fully_depreciated',
    'disposed'
);
--
-- Name: acc_pay_run_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_pay_run_status AS ENUM (
    'draft',
    'posted',
    'paid',
    'void'
);
--
-- Name: acc_pay_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_pay_type AS ENUM (
    'salary',
    'hourly'
);
--
-- Name: acc_period_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_period_status AS ENUM (
    'open',
    'closed',
    'locked'
);
--
-- Name: acc_reconciliation_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_reconciliation_status AS ENUM (
    'open',
    'completed'
);
--
-- Name: acc_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_role AS ENUM (
    'owner',
    'accountant',
    'bookkeeper',
    'approver',
    'client_view_only'
);
--
-- Name: acc_source_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_source_type AS ENUM (
    'invoice',
    'bill',
    'bank',
    'manual',
    'payroll',
    'adjustment',
    'reversal',
    'automation'
);
--
-- Name: acc_vat_return_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.acc_vat_return_status AS ENUM (
    'draft',
    'submitted',
    'paid',
    'void'
);
--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user',
    'financial',
    'team_member',
    'executive'
);
--
-- Name: crm_comm_direction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.crm_comm_direction AS ENUM (
    'inbound',
    'outbound',
    'internal'
);
--
-- Name: crm_comm_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.crm_comm_kind AS ENUM (
    'email',
    'call',
    'meeting',
    'note',
    'sms',
    'chat',
    'task',
    'file',
    'system'
);
--
-- Name: crm_entity_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.crm_entity_status AS ENUM (
    'active',
    'inactive',
    'archived'
);
--
-- Name: crm_lifecycle_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.crm_lifecycle_category AS ENUM (
    'lead',
    'prospect',
    'customer',
    'churned',
    'other'
);
--
-- Name: crm_relationship_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.crm_relationship_type AS ENUM (
    'customer',
    'supplier',
    'partner',
    'prospect',
    'lead',
    'investor',
    'other'
);
--
-- Name: lead_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_source AS ENUM (
    'google_maps',
    'manual',
    'csv_import',
    'html_import',
    'json_import'
);
--
-- Name: lead_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_status AS ENUM (
    'new',
    'contacted',
    'engaged',
    'live_preview_wanted',
    'converted',
    'lost',
    'do_not_contact'
);
--
-- Name: acc_account_by_code(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_account_by_code(_org_id uuid, _code text) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT id FROM public.acc_chart_of_accounts WHERE org_id=_org_id AND code=_code LIMIT 1;
$$;
--
-- Name: acc_after_org_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_after_org_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
--
-- Name: acc_asset_monthly_depreciation(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_asset_monthly_depreciation(_asset_id uuid, _period_end date) RETURNS numeric
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: acc_block_posted_entry_mutation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_block_posted_entry_mutation() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.posted_at IS NOT NULL THEN
      IF NEW.entry_date IS DISTINCT FROM OLD.entry_date
      OR NEW.org_id IS DISTINCT FROM OLD.org_id
      OR NEW.source_type IS DISTINCT FROM OLD.source_type
      OR NEW.source_id IS DISTINCT FROM OLD.source_id
      OR NEW.created_by IS DISTINCT FROM OLD.created_by
      OR NEW.posted_at IS DISTINCT FROM OLD.posted_at
      OR NEW.period_id IS DISTINCT FROM OLD.period_id
      OR NEW.is_reversal IS DISTINCT FROM OLD.is_reversal THEN
        RAISE EXCEPTION 'Posted journal entries are immutable. Use a reversal entry to correct.';
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.posted_at IS NOT NULL THEN
      RAISE EXCEPTION 'Posted journal entries cannot be deleted. Use a reversal entry.';
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
--
-- Name: acc_block_posted_line_mutation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_block_posted_line_mutation() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE entry_posted timestamptz;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT posted_at INTO entry_posted FROM public.acc_journal_entries WHERE id = OLD.journal_entry_id;
    IF entry_posted IS NOT NULL THEN RAISE EXCEPTION 'Cannot delete lines of a posted journal entry. Use a reversal entry.'; END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT posted_at INTO entry_posted FROM public.acc_journal_entries WHERE id = OLD.journal_entry_id;
    IF entry_posted IS NOT NULL THEN RAISE EXCEPTION 'Cannot modify lines of a posted journal entry. Use a reversal entry.'; END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;
--
-- Name: acc_calculate_vat(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_calculate_vat(_org_id uuid, _start date, _end date) RETURNS TABLE(output_vat numeric, input_vat numeric, net_due numeric)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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
--
-- Name: acc_check_entry_balanced(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_check_entry_balanced() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE total_debit numeric(19,4); total_credit numeric(19,4); line_count int;
BEGIN
  IF NEW.posted_at IS NULL THEN RETURN NEW; END IF;
  SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0), COUNT(*)
    INTO total_debit, total_credit, line_count
    FROM public.acc_journal_lines WHERE journal_entry_id = NEW.id;
  IF line_count < 2 THEN RAISE EXCEPTION 'A posted journal entry must have at least two lines'; END IF;
  IF total_debit <> total_credit THEN RAISE EXCEPTION 'Journal entry not balanced: debits=% credits=%', total_debit, total_credit; END IF;
  IF total_debit = 0 THEN RAISE EXCEPTION 'Journal entry totals cannot be zero'; END IF;
  RETURN NEW;
END;
$$;
--
-- Name: acc_complete_bank_reconciliation(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_complete_bank_reconciliation(_recon_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  rec public.acc_bank_reconciliations%ROWTYPE;
  matched_sum numeric(19,4);
BEGIN
  SELECT * INTO rec FROM public.acc_bank_reconciliations WHERE id=_recon_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reconciliation not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), rec.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF rec.status = 'completed' THEN RAISE EXCEPTION 'Reconciliation already completed'; END IF;

  SELECT COALESCE(SUM(amount),0) INTO matched_sum
    FROM public.acc_bank_transactions
    WHERE bank_account_id = rec.bank_account_id
      AND status = 'matched'
      AND txn_date <= rec.statement_date;

  IF round((rec.opening_balance + matched_sum)::numeric, 2) <> round(rec.closing_balance::numeric, 2) THEN
    RAISE EXCEPTION 'Reconciliation out of balance: opening % + matched % <> closing %',
      rec.opening_balance, matched_sum, rec.closing_balance;
  END IF;

  UPDATE public.acc_bank_transactions
    SET status = 'reconciled', reconciliation_id = rec.id
    WHERE bank_account_id = rec.bank_account_id
      AND status = 'matched'
      AND txn_date <= rec.statement_date;

  UPDATE public.acc_bank_reconciliations
    SET status = 'completed', completed_at = now(), completed_by = auth.uid()
    WHERE id = rec.id;
END;$$;
--
-- Name: acc_create_depreciation_run(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_create_depreciation_run(_org_id uuid, _period_end date) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: acc_create_journal_from_bank_transaction(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_create_journal_from_bank_transaction(_txn_id uuid, _contra_account_id uuid, _memo text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  txn public.acc_bank_transactions%ROWTYPE;
  bank public.acc_bank_accounts%ROWTYPE;
  entry_id uuid;
  amt numeric(19,4);
BEGIN
  SELECT * INTO txn FROM public.acc_bank_transactions WHERE id=_txn_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), txn.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF txn.status IN ('matched','reconciled') THEN RAISE EXCEPTION 'Transaction already matched'; END IF;
  IF _contra_account_id IS NULL THEN RAISE EXCEPTION 'Contra account required'; END IF;

  SELECT * INTO bank FROM public.acc_bank_accounts WHERE id = txn.bank_account_id;
  amt := abs(txn.amount);

  INSERT INTO public.acc_journal_entries (org_id, entry_date, description, source_type, source_id, created_by)
    VALUES (txn.org_id, txn.txn_date, COALESCE(_memo, txn.description), 'bank_txn', txn.id, auth.uid())
    RETURNING id INTO entry_id;

  IF txn.amount >= 0 THEN
    -- money in: Dr Bank / Cr contra
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, 1, bank.coa_account_id, amt, 0, txn.description);
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, 2, _contra_account_id, 0, amt, COALESCE(_memo, txn.description));
  ELSE
    -- money out: Dr contra / Cr Bank
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, 1, _contra_account_id, amt, 0, COALESCE(_memo, txn.description));
    INSERT INTO public.acc_journal_lines (journal_entry_id, line_no, account_id, debit, credit, memo)
      VALUES (entry_id, 2, bank.coa_account_id, 0, amt, txn.description);
  END IF;

  UPDATE public.acc_journal_entries SET posted_at = now() WHERE id = entry_id;

  UPDATE public.acc_bank_transactions
    SET status = 'matched', journal_entry_id = entry_id
    WHERE id = txn.id;

  RETURN entry_id;
END;$$;
--
-- Name: acc_dispose_asset(uuid, date, numeric, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_dispose_asset(_asset_id uuid, _disposal_date date, _proceeds numeric, _bank_account_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: acc_enforce_period_lock(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_enforce_period_lock() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE p_status public.acc_period_status;
BEGIN
  IF NEW.posted_at IS NULL THEN RETURN NEW; END IF;
  IF NEW.period_id IS NOT NULL THEN
    SELECT status INTO p_status FROM public.acc_accounting_periods WHERE id = NEW.period_id;
  ELSE
    SELECT status INTO p_status FROM public.acc_accounting_periods
      WHERE org_id = NEW.org_id AND NEW.entry_date BETWEEN start_date AND end_date
      ORDER BY start_date DESC LIMIT 1;
  END IF;
  IF p_status IN ('closed','locked') THEN
    RAISE EXCEPTION 'Cannot post into a % period', p_status;
  END IF;
  RETURN NEW;
END;
$$;
--
-- Name: acc_ensure_fx_accounts(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_ensure_fx_accounts(_org_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.acc_chart_of_accounts (org_id, code, name, type, subtype, is_active)
  VALUES
    (_org_id, '4920', 'Foreign Exchange Gains', 'revenue', 'other_income', TRUE),
    (_org_id, '6920', 'Foreign Exchange Losses', 'expense', 'other_expense', TRUE)
  ON CONFLICT (org_id, code) DO NOTHING;
END $$;
--
-- Name: acc_get_fx_rate(uuid, text, text, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_get_fx_rate(_org_id uuid, _from text, _to text, _date date) RETURNS numeric
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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
--
-- Name: acc_is_org_member(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_is_org_member(_user_id uuid, _org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.acc_organizations o WHERE o.id = _org_id AND o.owner_user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.acc_org_members m WHERE m.org_id = _org_id AND m.user_id = _user_id);
$$;
--
-- Name: acc_log_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_log_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_org uuid;
  v_before jsonb;
  v_after jsonb;
  v_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_org := (to_jsonb(OLD)->>'org_id')::uuid;
    v_id  := (to_jsonb(OLD)->>'id')::uuid;
    v_before := to_jsonb(OLD);
    v_after := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_org := (to_jsonb(NEW)->>'org_id')::uuid;
    v_id  := (to_jsonb(NEW)->>'id')::uuid;
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSE -- UPDATE
    v_org := (to_jsonb(NEW)->>'org_id')::uuid;
    v_id  := (to_jsonb(NEW)->>'id')::uuid;
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    IF v_before = v_after THEN RETURN NEW; END IF;
  END IF;

  IF v_org IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.acc_audit_log
    (org_id, actor_id, action, entity_type, entity_id, before_state, after_state)
  VALUES
    (v_org, auth.uid(), TG_OP, TG_TABLE_NAME, v_id, v_before, v_after);

  RETURN COALESCE(NEW, OLD);
END $$;
--
-- Name: acc_match_bank_transaction(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_match_bank_transaction(_txn_id uuid, _entry_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  txn public.acc_bank_transactions%ROWTYPE;
  bank public.acc_bank_accounts%ROWTYPE;
  bank_debit numeric(19,4);
  bank_credit numeric(19,4);
  net numeric(19,4);
  entry_org uuid;
  entry_posted timestamptz;
BEGIN
  SELECT * INTO txn FROM public.acc_bank_transactions WHERE id=_txn_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), txn.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF txn.status IN ('matched','reconciled') THEN RAISE EXCEPTION 'Transaction already matched'; END IF;

  SELECT * INTO bank FROM public.acc_bank_accounts WHERE id = txn.bank_account_id;

  SELECT org_id, posted_at INTO entry_org, entry_posted
    FROM public.acc_journal_entries WHERE id = _entry_id;
  IF entry_org IS NULL THEN RAISE EXCEPTION 'Journal entry not found'; END IF;
  IF entry_org <> txn.org_id THEN RAISE EXCEPTION 'Entry belongs to a different organization'; END IF;
  IF entry_posted IS NULL THEN RAISE EXCEPTION 'Journal entry must be posted first'; END IF;

  SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0)
    INTO bank_debit, bank_credit
    FROM public.acc_journal_lines
    WHERE journal_entry_id = _entry_id AND account_id = bank.coa_account_id;

  net := bank_debit - bank_credit;
  IF net = 0 THEN RAISE EXCEPTION 'Entry does not touch this bank account'; END IF;
  IF round(net::numeric, 2) <> round(txn.amount::numeric, 2) THEN
    RAISE EXCEPTION 'Amount mismatch: entry bank net %, transaction %', net, txn.amount;
  END IF;

  UPDATE public.acc_bank_transactions
    SET status = 'matched', journal_entry_id = _entry_id
    WHERE id = txn.id;
END;$$;
--
-- Name: acc_pay_pay_run(uuid, uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_pay_pay_run(_pay_run_id uuid, _bank_account_id uuid, _payment_date date) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: acc_pay_vat_return(uuid, uuid, date, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_pay_vat_return(_return_id uuid, _bank_account_id uuid, _payment_date date, _amount numeric) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
--
-- Name: acc_post_ap_bill(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_post_ap_bill(_bill_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: acc_post_ap_payment(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_post_ap_payment(_payment_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: acc_post_ar_invoice(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_post_ar_invoice(_invoice_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: acc_post_ar_payment(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_post_ar_payment(_payment_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: acc_post_asset_acquisition(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_post_asset_acquisition(_asset_id uuid, _bank_account_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: acc_post_depreciation_run(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_post_depreciation_run(_run_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: acc_post_fx_revaluation(uuid, date, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_post_fx_revaluation(_org_id uuid, _as_of date, _user_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
--
-- Name: acc_post_pay_run(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_post_pay_run(_pay_run_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: acc_recalc_pay_run(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_recalc_pay_run(_pay_run_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: acc_seed_default_coa(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_seed_default_coa(_org_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
END; $$;
--
-- Name: acc_submit_vat_return(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_submit_vat_return(_return_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
--
-- Name: acc_unmatch_bank_transaction(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_unmatch_bank_transaction(_txn_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE txn public.acc_bank_transactions%ROWTYPE;
BEGIN
  SELECT * INTO txn FROM public.acc_bank_transactions WHERE id=_txn_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), txn.org_id)) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF txn.status = 'reconciled' THEN RAISE EXCEPTION 'Cannot unmatch a reconciled transaction'; END IF;
  UPDATE public.acc_bank_transactions
    SET status='unmatched', journal_entry_id=NULL
    WHERE id=txn.id;
END;$$;
--
-- Name: acc_void_ap_bill(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_void_ap_bill(_bill_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: acc_void_ar_invoice(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acc_void_ar_invoice(_invoice_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
--
-- Name: can_view_rbac_role(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_rbac_role(_user_id uuid, _role_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rbac_roles WHERE id = _role_id AND (is_system = true OR created_by = _user_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.rbac_user_roles WHERE user_id = _user_id AND role_id = _role_id
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  );
$$;
--
-- Name: check_ip_blocked(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_ip_blocked(p_ip_address text) RETURNS TABLE(blocked boolean, reason text, expires_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  stored_ip text;
  decrypted_ip text;
  block_record RECORD;
BEGIN
  -- Loop through blocked IPs and compare
  FOR block_record IN SELECT * FROM public.blocked_ips
  LOOP
    stored_ip := block_record.ip_address;
    
    -- Check if stored IP is encrypted
    IF stored_ip LIKE 'ENC:%' THEN
      decrypted_ip := public.decrypt_pii(stored_ip);
    ELSE
      decrypted_ip := stored_ip;
    END IF;
    
    -- Compare with incoming IP
    IF decrypted_ip = p_ip_address THEN
      -- Check if block has expired
      IF block_record.expires_at IS NOT NULL AND block_record.expires_at < now() THEN
        -- Block expired, remove it
        DELETE FROM public.blocked_ips WHERE id = block_record.id;
        CONTINUE;
      END IF;
      
      RETURN QUERY SELECT true, block_record.reason, block_record.expires_at;
      RETURN;
    END IF;
  END LOOP;
  
  -- Not blocked
  RETURN QUERY SELECT false::boolean, NULL::text, NULL::timestamptz;
  RETURN;
END;
$$;
--
-- Name: check_ip_whitelisted(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_ip_whitelisted(p_ip_address text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  stored_ip text;
  decrypted_ip text;
  whitelist_record RECORD;
BEGIN
  FOR whitelist_record IN SELECT * FROM public.whitelisted_ips
  LOOP
    stored_ip := whitelist_record.ip_address;
    
    IF stored_ip LIKE 'ENC:%' THEN
      decrypted_ip := public.decrypt_pii(stored_ip);
    ELSE
      decrypted_ip := stored_ip;
    END IF;
    
    IF decrypted_ip = p_ip_address THEN
      RETURN true;
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$;
--
-- Name: check_verification_resend_limit(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_verification_resend_limit(p_user_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  profile_record public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('allowed', false, 'error', 'User not found');
  END IF;
  
  -- Reset counter if 24 hours have passed
  IF profile_record.verification_resend_reset_at IS NULL OR 
     profile_record.verification_resend_reset_at < now() - interval '24 hours' THEN
    UPDATE public.profiles
    SET 
      verification_resend_count = 0,
      verification_resend_reset_at = now()
    WHERE user_id = p_user_id;
    
    RETURN json_build_object('allowed', true, 'remaining', 3);
  END IF;
  
  -- Check if limit reached
  IF profile_record.verification_resend_count >= 3 THEN
    RETURN json_build_object(
      'allowed', false, 
      'error', 'Maximum resend limit reached. Try again in 24 hours.',
      'reset_at', profile_record.verification_resend_reset_at + interval '24 hours'
    );
  END IF;
  
  RETURN json_build_object(
    'allowed', true, 
    'remaining', 3 - profile_record.verification_resend_count
  );
END;
$$;
--
-- Name: cleanup_rate_limits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_rate_limits() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '24 hours';
END;
$$;
--
-- Name: crm_dispatch_lifecycle_workflows(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crm_dispatch_lifecycle_workflows() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  wf record;
  from_slug text;
  to_slug text;
  target_stage text;
BEGIN
  SELECT slug INTO from_slug FROM public.crm_lifecycle_stages WHERE id = NEW.from_stage_id;
  SELECT slug INTO to_slug FROM public.crm_lifecycle_stages WHERE id = NEW.to_stage_id;

  FOR wf IN
    SELECT * FROM public.crm_workflows
    WHERE org_id = NEW.org_id
      AND is_active = true
      AND trigger_event = 'lifecycle_change'
      AND (trigger_config->>'entity_type' IS NULL OR trigger_config->>'entity_type' = NEW.entity_type)
    ORDER BY priority ASC
  LOOP
    target_stage := wf.trigger_config->>'to_stage';
    IF target_stage IS NULL OR target_stage = to_slug THEN
      IF wf.trigger_config->>'from_stage' IS NULL OR wf.trigger_config->>'from_stage' = from_slug THEN
        PERFORM public.crm_execute_workflow_actions(
          wf.id,
          NEW.entity_type,
          NEW.entity_id,
          jsonb_build_object('from_stage', from_slug, 'to_stage', to_slug, 'note', NEW.note)
        );
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;
--
-- Name: crm_entity_financials(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crm_entity_financials(_entity_type text, _entity_id uuid) RETURNS TABLE(finance_type text, finance_id uuid, reference text, amount numeric, currency text, status text, occurred_at timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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
--
-- Name: crm_entity_lifetime_value(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crm_entity_lifetime_value(_entity_type text, _entity_id uuid) RETURNS TABLE(invoiced numeric, paid numeric, outstanding numeric, currency text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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
--
-- Name: crm_execute_workflow_actions(uuid, text, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crm_execute_workflow_actions(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  wf record;
  action jsonb;
  executed jsonb := '[]'::jsonb;
  action_result jsonb;
  company_row public.crm_companies%ROWTYPE;
  contact_row public.crm_contacts%ROWTYPE;
  opp_row public.crm_opportunities%ROWTYPE;
  admin_id uuid := public.get_primary_admin_id();
BEGIN
  SELECT * INTO wf FROM public.crm_workflows WHERE id = _workflow_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','workflow not found'); END IF;

  IF _entity_type = 'company' THEN
    SELECT * INTO company_row FROM public.crm_companies WHERE id = _entity_id;
  ELSIF _entity_type = 'contact' THEN
    SELECT * INTO contact_row FROM public.crm_contacts WHERE id = _entity_id;
  ELSIF _entity_type = 'opportunity' THEN
    SELECT * INTO opp_row FROM public.crm_opportunities WHERE id = _entity_id;
  END IF;

  FOR action IN SELECT * FROM jsonb_array_elements(wf.actions) LOOP
    action_result := jsonb_build_object('type', action->>'type', 'ok', true);
    BEGIN
      CASE action->>'type'
        WHEN 'create_onboarding' THEN
          IF _entity_type = 'company' AND company_row.id IS NOT NULL THEN
            INSERT INTO public.client_onboarding (
              user_id, client_name, company_name, status, account_created, account_created_at
            ) VALUES (
              admin_id,
              COALESCE(company_row.name,'New Client'),
              company_row.name,
              'pending',
              false,
              now()
            )
            ON CONFLICT DO NOTHING;
          END IF;

        WHEN 'log_communication' THEN
          INSERT INTO public.crm_communications (
            org_id, kind, direction, subject, body, occurred_at,
            company_id, contact_id, opportunity_id, status, metadata
          ) VALUES (
            admin_id,
            'system',
            'internal',
            COALESCE(action->>'subject','Workflow event'),
            COALESCE(action->>'body', wf.name),
            now(),
            CASE WHEN _entity_type='company' THEN _entity_id END,
            CASE WHEN _entity_type='contact' THEN _entity_id END,
            CASE WHEN _entity_type='opportunity' THEN _entity_id END,
            'completed',
            jsonb_build_object('workflow_id', wf.id, 'workflow_name', wf.name)
          );

        WHEN 'add_tag' THEN
          IF _entity_type = 'company' THEN
            UPDATE public.crm_companies
              SET tags = COALESCE(tags,'{}') || ARRAY[action->>'tag']
            WHERE id = _entity_id AND NOT (COALESCE(tags,'{}') @> ARRAY[action->>'tag']);
          ELSIF _entity_type = 'contact' THEN
            UPDATE public.crm_contacts
              SET tags = COALESCE(tags,'{}') || ARRAY[action->>'tag']
            WHERE id = _entity_id AND NOT (COALESCE(tags,'{}') @> ARRAY[action->>'tag']);
          END IF;

        WHEN 'create_project' THEN
          IF _entity_type IN ('company','opportunity') THEN
            INSERT INTO public.app_projects (
              user_id, project_name, project_type, status, priority, description
            ) VALUES (
              admin_id,
              COALESCE(action->>'project_name',
                CASE WHEN _entity_type='company' THEN company_row.name ELSE opp_row.title END,
                'New Delivery'),
              COALESCE(action->>'project_type','website'),
              'planning',
              COALESCE(action->>'priority','medium'),
              'Auto-created by workflow: '||wf.name
            );
          END IF;

        WHEN 'notify_owner' THEN
          -- Insert a notification for the entity owner if we have one
          DECLARE owner uuid;
          BEGIN
            owner := CASE _entity_type
              WHEN 'company' THEN company_row.owner_id
              WHEN 'contact' THEN contact_row.owner_id
              WHEN 'opportunity' THEN opp_row.owner_id
            END;
            IF owner IS NOT NULL THEN
              INSERT INTO public.notifications (user_id, type, title, message, metadata)
              VALUES (owner, 'crm_workflow',
                COALESCE(action->>'title', wf.name),
                COALESCE(action->>'message','A CRM workflow was triggered.'),
                jsonb_build_object('workflow_id', wf.id, 'entity_type', _entity_type, 'entity_id', _entity_id));
            END IF;
          END;

        ELSE
          action_result := jsonb_set(action_result, '{ok}', 'false'::jsonb);
          action_result := jsonb_set(action_result, '{error}', to_jsonb('unknown action type'::text));
      END CASE;
    EXCEPTION WHEN OTHERS THEN
      action_result := jsonb_set(action_result, '{ok}', 'false'::jsonb);
      action_result := jsonb_set(action_result, '{error}', to_jsonb(SQLERRM));
    END;
    executed := executed || action_result;
  END LOOP;

  INSERT INTO public.crm_workflow_runs (
    org_id, workflow_id, entity_type, entity_id, trigger_payload, actions_executed,
    status
  ) VALUES (
    admin_id, wf.id, _entity_type, _entity_id, _payload, executed,
    CASE WHEN executed @> '[{"ok":false}]'::jsonb THEN 'partial' ELSE 'success' END
  );

  RETURN jsonb_build_object('workflow_id', wf.id, 'executed', executed);
END;
$$;
--
-- Name: crm_log_communication(text, text, text, text, uuid, uuid, uuid, timestamp with time zone, text, text[], jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crm_log_communication(_kind text, _direction text DEFAULT 'outbound'::text, _subject text DEFAULT NULL::text, _body text DEFAULT NULL::text, _company_id uuid DEFAULT NULL::uuid, _contact_id uuid DEFAULT NULL::uuid, _opportunity_id uuid DEFAULT NULL::uuid, _occurred_at timestamp with time zone DEFAULT now(), _from_address text DEFAULT NULL::text, _to_addresses text[] DEFAULT '{}'::text[], _metadata jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_org uuid := public.get_primary_admin_id();
  v_id uuid;
BEGIN
  IF _company_id IS NULL AND _contact_id IS NULL AND _opportunity_id IS NULL THEN
    RAISE EXCEPTION 'At least one of company/contact/opportunity is required';
  END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR v_org IS NOT NULL) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  INSERT INTO public.crm_communications
    (org_id, owner_id, company_id, contact_id, opportunity_id,
     kind, direction, subject, body, occurred_at,
     from_address, to_addresses, metadata)
  VALUES
    (v_org, auth.uid(), _company_id, _contact_id, _opportunity_id,
     _kind::public.crm_comm_kind, _direction::public.crm_comm_direction,
     _subject, _body, _occurred_at,
     _from_address, _to_addresses, _metadata)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
--
-- Name: crm_run_workflow(uuid, text, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crm_run_workflow(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.crm_execute_workflow_actions(_workflow_id, _entity_type, _entity_id, _payload);
$$;
--
-- Name: crm_timeline(text, uuid, integer, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crm_timeline(_entity_type text, _entity_id uuid, _limit integer DEFAULT 50, _before timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE(event_id uuid, event_type text, kind text, direction text, subject text, body text, occurred_at timestamp with time zone, actor_id uuid, metadata jsonb)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_org uuid;
BEGIN
  -- Resolve org & authorize
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
  ORDER BY 7 DESC
  LIMIT _limit;
END;
$$;
--
-- Name: decrypt_pii(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrypt_pii(p_encrypted_value text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  encryption_key text;
  encrypted_data text;
BEGIN
  -- Check if value is encrypted
  IF p_encrypted_value IS NULL OR NOT p_encrypted_value LIKE 'ENC:%' THEN
    RETURN p_encrypted_value;
  END IF;
  
  -- Extract the encrypted portion (after 'ENC:')
  encrypted_data := substring(p_encrypted_value from 5);
  
  -- Use the same key as encryption
  encryption_key := encode(extensions.digest(current_database() || 'quooro_pii_key_2024', 'sha256'), 'hex');
  
  -- Decrypt and return
  RETURN extensions.pgp_sym_decrypt(
    decode(encrypted_data, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails, return the original value
    RETURN p_encrypted_value;
END;
$$;
--
-- Name: ecommerce_orders_touch(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ecommerce_orders_touch() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
--
-- Name: ecommerce_settings_touch(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ecommerce_settings_touch() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
--
-- Name: encrypt_blocked_ip(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.encrypt_blocked_ip() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.ip_address IS NOT NULL AND NEW.ip_address != '' AND NOT NEW.ip_address LIKE 'ENC:%' THEN
    NEW.ip_address := public.encrypt_pii(NEW.ip_address);
  END IF;
  RETURN NEW;
END;
$$;
--
-- Name: encrypt_enquiry_pii(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.encrypt_enquiry_pii() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NOT NEW.phone LIKE 'ENC:%' THEN
    NEW.phone := public.encrypt_pii(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;
--
-- Name: encrypt_lead_pii(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.encrypt_lead_pii() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NOT NEW.phone LIKE 'ENC:%' THEN
    NEW.phone := public.encrypt_pii(NEW.phone);
  END IF;
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NOT NEW.email LIKE 'ENC:%' THEN
    NEW.email := public.encrypt_pii(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;
--
-- Name: encrypt_pii(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.encrypt_pii(p_value text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Use a consistent key derived from the database name
  encryption_key := encode(extensions.digest(current_database() || 'quooro_pii_key_2024', 'sha256'), 'hex');
  
  -- Return encrypted value with prefix for identification
  RETURN 'ENC:' || encode(
    extensions.pgp_sym_encrypt(p_value, encryption_key),
    'base64'
  );
END;
$$;
--
-- Name: encrypt_profile_pii(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.encrypt_profile_pii() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NOT NEW.phone LIKE 'ENC:%' THEN
    NEW.phone := public.encrypt_pii(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;
--
-- Name: encrypt_security_log_ip(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.encrypt_security_log_ip() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.ip_address IS NOT NULL AND NEW.ip_address != '' AND NOT NEW.ip_address LIKE 'ENC:%' THEN
    NEW.ip_address := public.encrypt_pii(NEW.ip_address);
  END IF;
  RETURN NEW;
END;
$$;
--
-- Name: encrypt_whitelisted_ip(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.encrypt_whitelisted_ip() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.ip_address IS NOT NULL AND NEW.ip_address != '' AND NOT NEW.ip_address LIKE 'ENC:%' THEN
    NEW.ip_address := public.encrypt_pii(NEW.ip_address);
  END IF;
  RETURN NEW;
END;
$$;
--
-- Name: generate_customer_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_customer_id() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    new_id := 'QUO-' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 5));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE customer_id = new_id) INTO id_exists;
    EXIT WHEN NOT id_exists;
  END LOOP;
  RETURN new_id;
END;
$$;
--
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invoice_number() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  year_part text;
  sequence_num integer;
  invoice_num text;
BEGIN
  year_part := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-\d{4}-(\d+)') AS integer)), 0) + 1
  INTO sequence_num
  FROM public.client_invoices
  WHERE invoice_number LIKE 'INV-' || year_part || '-%';
  
  invoice_num := 'INV-' || year_part || '-' || LPAD(sequence_num::text, 5, '0');
  RETURN invoice_num;
END;
$$;
--
-- Name: generate_join_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_join_code() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$;
--
-- Name: generate_order_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_order_number() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  year_part TEXT;
  seq INT;
  order_num TEXT;
BEGIN
  year_part := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'ORD-\d{4}-(\d+)') AS integer)), 0) + 1
  INTO seq FROM public.site_orders WHERE order_number LIKE 'ORD-' || year_part || '-%';
  order_num := 'ORD-' || year_part || '-' || LPAD(seq::text, 5, '0');
  RETURN order_num;
END;
$$;
--
-- Name: generate_proposal_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_proposal_number() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  year_part TEXT;
  seq INT;
  prop_num TEXT;
BEGIN
  year_part := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(proposal_number FROM 'PROP-\d{4}-(\d+)') AS integer)), 0) + 1
  INTO seq FROM public.proposals WHERE proposal_number LIKE 'PROP-' || year_part || '-%';
  prop_num := 'PROP-' || year_part || '-' || LPAD(seq::text, 5, '0');
  RETURN prop_num;
END;
$$;
--
-- Name: generate_team_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_team_code() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$;
--
-- Name: generate_ticket_reference(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_ticket_reference() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_ref TEXT;
  ref_exists BOOLEAN;
BEGIN
  LOOP
    new_ref := 'REQ-' || LPAD(floor(random() * 100000)::text, 5, '0');
    SELECT EXISTS(SELECT 1 FROM public.support_tickets WHERE reference_id = new_ref) INTO ref_exists;
    EXIT WHEN NOT ref_exists;
  END LOOP;
  RETURN new_ref;
END;
$$;
--
-- Name: generate_verification_token(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_verification_token(p_user_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_token uuid;
BEGIN
  new_token := gen_random_uuid();
  
  UPDATE public.profiles
  SET 
    verification_token = new_token,
    verification_sent_at = now(),
    verification_expires_at = now() + interval '24 hours'
  WHERE user_id = p_user_id;
  
  RETURN new_token;
END;
$$;
--
-- Name: get_available_admin_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_available_admin_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    -- First try to get primary available admin
    (SELECT admin_id FROM public.team_inbox_settings 
     WHERE is_available = true AND is_primary = true 
     LIMIT 1),
    -- Then any available admin
    (SELECT admin_id FROM public.team_inbox_settings 
     WHERE is_available = true 
     ORDER BY last_active_at DESC NULLS LAST 
     LIMIT 1),
    -- Fallback to first admin in user_roles
    (SELECT user_id FROM public.user_roles 
     WHERE role = 'admin' 
     ORDER BY created_at ASC 
     LIMIT 1)
  );
$$;
--
-- Name: get_blocked_ips_decrypted(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_blocked_ips_decrypted() RETURNS TABLE(id uuid, ip_address text, blocked_by uuid, reason text, is_auto_blocked boolean, failed_attempts integer, blocked_at timestamp with time zone, expires_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    CASE 
      WHEN b.ip_address LIKE 'ENC:%' THEN public.decrypt_pii(b.ip_address)
      ELSE b.ip_address
    END as ip_address,
    b.blocked_by,
    b.reason,
    b.is_auto_blocked,
    b.failed_attempts,
    b.blocked_at,
    b.expires_at
  FROM public.blocked_ips b
  ORDER BY b.blocked_at DESC;
END;
$$;
--
-- Name: get_primary_admin_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_primary_admin_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT user_id
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;
$$;
--
-- Name: get_security_logs_decrypted(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_security_logs_decrypted(p_limit integer DEFAULT 100) RETURNS TABLE(id uuid, user_id uuid, event_type text, portal_attempted text, actual_role text, ip_address text, user_agent text, details jsonb, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.event_type,
    s.portal_attempted,
    s.actual_role,
    CASE 
      WHEN s.ip_address LIKE 'ENC:%' THEN public.decrypt_pii(s.ip_address)
      ELSE s.ip_address
    END as ip_address,
    s.user_agent,
    s.details::jsonb,
    s.created_at
  FROM public.security_logs s
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$$;
--
-- Name: get_user_accessible_modules(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_accessible_modules(_user_id uuid) RETURNS text[]
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT CASE
    -- Admins get all modules
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
    THEN ARRAY(SELECT DISTINCT module FROM public.rbac_permissions)
    ELSE ARRAY(
      SELECT DISTINCT p.module
      FROM public.rbac_user_roles ur
      JOIN public.rbac_roles r ON r.id = ur.role_id
      JOIN public.rbac_permissions p ON p.role_id = r.id
      WHERE ur.user_id = _user_id
        AND r.is_active = true
        AND p.action = 'view'
        AND p.granted = true
    )
  END
$$;
--
-- Name: get_whitelisted_ips_decrypted(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_whitelisted_ips_decrypted() RETURNS TABLE(id uuid, ip_address text, added_by uuid, notes text, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    CASE 
      WHEN w.ip_address LIKE 'ENC:%' THEN public.decrypt_pii(w.ip_address)
      ELSE w.ip_address
    END as ip_address,
    w.added_by,
    w.notes,
    w.created_at
  FROM public.whitelisted_ips w
  ORDER BY w.created_at DESC;
END;
$$;
--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  is_oauth_signup boolean;
BEGIN
  -- Detect OAuth signup using raw_app_meta_data (the actual column name)
  is_oauth_signup := NEW.raw_app_meta_data->>'provider' IS NOT NULL 
                     AND NEW.raw_app_meta_data->>'provider' != 'email';
  
  -- Insert profile with email_verified set based on OAuth status
  INSERT INTO public.profiles (user_id, email, full_name, email_verified)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    is_oauth_signup
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;
--
-- Name: has_rbac_permission(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_rbac_permission(_user_id uuid, _module text, _action text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    -- Super Admins and platform admins bypass all checks
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    -- Check RBAC role-based permission
    SELECT 1
    FROM public.rbac_user_roles ur
    JOIN public.rbac_roles r ON r.id = ur.role_id
    JOIN public.rbac_permissions p ON p.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.is_active = true
      AND p.module = _module
      AND p.action = _action
      AND p.granted = true
  )
$$;
--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
--
-- Name: increment_verification_resend(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_verification_resend(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.profiles
  SET 
    verification_resend_count = COALESCE(verification_resend_count, 0) + 1,
    verification_resend_reset_at = COALESCE(verification_resend_reset_at, now())
  WHERE user_id = p_user_id;
END;
$$;
--
-- Name: is_channel_member(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_channel_member(p_channel_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.comm_channel_members
    WHERE channel_id = p_channel_id AND user_id = auth.uid()
  );
$$;
--
-- Name: is_owner(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_owner(row_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN auth.uid() = row_user_id;
END;
$$;
--
-- Name: is_team_member(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_team_member(p_team_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE team_id = p_team_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.client_teams
    WHERE id = p_team_id AND primary_account_id = auth.uid()
  );
$$;
--
-- Name: is_team_owner(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_team_owner(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_teams
    WHERE primary_account_id = _user_id
  )
$$;
--
-- Name: set_channel_join_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_channel_join_code() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := public.generate_join_code();
  END IF;
  RETURN NEW;
END;
$$;
--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
--
-- Name: track_storage_quota(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_storage_quota() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.storage_quotas (user_id, used_bytes)
    VALUES (NEW.user_id, NEW.file_size)
    ON CONFLICT (user_id) DO UPDATE SET used_bytes = storage_quotas.used_bytes + NEW.file_size, updated_at = now();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.storage_quotas SET used_bytes = GREATEST(0, used_bytes - OLD.file_size), updated_at = now() WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
--
-- Name: update_ai_conversation_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_ai_conversation_timestamp() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.ai_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
--
-- Name: update_profile_last_updated(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profile_last_updated() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$;
--
-- Name: update_thread_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_thread_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.comm_messages SET thread_count = thread_count + 1 WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.comm_messages SET thread_count = GREATEST(0, thread_count - 1) WHERE id = OLD.parent_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
--
-- Name: verify_email_token(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_email_token(p_token uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  profile_record public.profiles%ROWTYPE;
  result json;
BEGIN
  -- Find profile with matching token
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE verification_token = p_token;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid verification token');
  END IF;
  
  -- Check if token expired
  IF profile_record.verification_expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Verification token has expired');
  END IF;
  
  -- Mark email as verified and clear token
  UPDATE public.profiles
  SET 
    email_verified = true,
    verification_token = NULL,
    verification_sent_at = NULL,
    verification_expires_at = NULL,
    verification_resend_count = 0
  WHERE user_id = profile_record.user_id;
  
  RETURN json_build_object(
    'success', true, 
    'user_id', profile_record.user_id,
    'email', profile_record.email
  );
END;
$$;
SET default_tablespace = '';
SET default_table_access_method = heap;
--
-- Name: acc_accountant_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_accountant_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    invited_by uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    accepted_user_id uuid,
    expires_at timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_accounting_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_accounting_periods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status public.acc_period_status DEFAULT 'open'::public.acc_period_status NOT NULL,
    closed_by uuid,
    closed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT acc_accounting_periods_check CHECK ((end_date >= start_date))
);
ALTER TABLE ONLY public.acc_accounting_periods REPLICA IDENTITY FULL;
--
-- Name: acc_ap_bills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_ap_bills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    bill_number text NOT NULL,
    supplier_reference text,
    bill_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date,
    currency text DEFAULT 'GBP'::text NOT NULL,
    subtotal numeric(19,4) DEFAULT 0 NOT NULL,
    tax_total numeric(19,4) DEFAULT 0 NOT NULL,
    total numeric(19,4) DEFAULT 0 NOT NULL,
    amount_paid numeric(19,4) DEFAULT 0 NOT NULL,
    status public.acc_ap_bill_status DEFAULT 'draft'::public.acc_ap_bill_status NOT NULL,
    notes text,
    expense_id uuid,
    journal_entry_id uuid,
    reversal_entry_id uuid,
    posted_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.acc_ap_bills REPLICA IDENTITY FULL;
--
-- Name: acc_suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    billing_address text,
    tax_number text,
    currency text DEFAULT 'GBP'::text NOT NULL,
    default_ap_account_id uuid,
    default_expense_account_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_ap_aging; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.acc_ap_aging WITH (security_invoker='true') AS
 SELECT b.org_id,
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
            WHEN (COALESCE(b.due_date, b.bill_date) >= CURRENT_DATE) THEN 'current'::text
            WHEN ((CURRENT_DATE - COALESCE(b.due_date, b.bill_date)) <= 30) THEN '1-30'::text
            WHEN ((CURRENT_DATE - COALESCE(b.due_date, b.bill_date)) <= 60) THEN '31-60'::text
            WHEN ((CURRENT_DATE - COALESCE(b.due_date, b.bill_date)) <= 90) THEN '61-90'::text
            ELSE '90+'::text
        END AS bucket
   FROM (public.acc_ap_bills b
     JOIN public.acc_suppliers s ON ((s.id = b.supplier_id)))
  WHERE ((b.status = ANY (ARRAY['posted'::public.acc_ap_bill_status, 'paid'::public.acc_ap_bill_status])) AND ((b.total - b.amount_paid) > (0)::numeric));
--
-- Name: acc_ap_bill_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_ap_bill_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bill_id uuid NOT NULL,
    line_no integer NOT NULL,
    description text NOT NULL,
    quantity numeric(19,4) DEFAULT 1 NOT NULL,
    unit_price numeric(19,4) DEFAULT 0 NOT NULL,
    tax_rate numeric(9,4) DEFAULT 0 NOT NULL,
    line_subtotal numeric(19,4) DEFAULT 0 NOT NULL,
    line_tax numeric(19,4) DEFAULT 0 NOT NULL,
    line_total numeric(19,4) DEFAULT 0 NOT NULL,
    expense_account_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_ap_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_ap_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    bill_id uuid NOT NULL,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    amount numeric(19,4) NOT NULL,
    bank_account_id uuid NOT NULL,
    reference text,
    method text,
    journal_entry_id uuid,
    posted_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT acc_ap_payments_amount_check CHECK ((amount > (0)::numeric))
);
ALTER TABLE ONLY public.acc_ap_payments REPLICA IDENTITY FULL;
--
-- Name: acc_ar_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_ar_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    invoice_number text NOT NULL,
    invoice_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date,
    currency text DEFAULT 'GBP'::text NOT NULL,
    subtotal numeric(19,4) DEFAULT 0 NOT NULL,
    tax_total numeric(19,4) DEFAULT 0 NOT NULL,
    total numeric(19,4) DEFAULT 0 NOT NULL,
    amount_paid numeric(19,4) DEFAULT 0 NOT NULL,
    status public.acc_ar_invoice_status DEFAULT 'draft'::public.acc_ar_invoice_status NOT NULL,
    notes text,
    client_invoice_id uuid,
    journal_entry_id uuid,
    reversal_entry_id uuid,
    posted_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    subscription_site_id uuid,
    crm_company_id uuid,
    crm_contact_id uuid,
    crm_opportunity_id uuid
);
ALTER TABLE ONLY public.acc_ar_invoices REPLICA IDENTITY FULL;
--
-- Name: acc_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    billing_address text,
    tax_number text,
    currency text DEFAULT 'GBP'::text NOT NULL,
    default_ar_account_id uuid,
    default_revenue_account_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    crm_company_id uuid,
    crm_contact_id uuid
);
--
-- Name: acc_ar_aging; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.acc_ar_aging WITH (security_invoker='true') AS
 SELECT i.org_id,
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
            WHEN (COALESCE(i.due_date, i.invoice_date) >= CURRENT_DATE) THEN 'current'::text
            WHEN ((CURRENT_DATE - COALESCE(i.due_date, i.invoice_date)) <= 30) THEN '1-30'::text
            WHEN ((CURRENT_DATE - COALESCE(i.due_date, i.invoice_date)) <= 60) THEN '31-60'::text
            WHEN ((CURRENT_DATE - COALESCE(i.due_date, i.invoice_date)) <= 90) THEN '61-90'::text
            ELSE '90+'::text
        END AS bucket
   FROM (public.acc_ar_invoices i
     JOIN public.acc_customers c ON ((c.id = i.customer_id)))
  WHERE ((i.status = ANY (ARRAY['posted'::public.acc_ar_invoice_status, 'paid'::public.acc_ar_invoice_status])) AND ((i.total - i.amount_paid) > (0)::numeric));
--
-- Name: acc_ar_invoice_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_ar_invoice_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    line_no integer NOT NULL,
    description text NOT NULL,
    quantity numeric(19,4) DEFAULT 1 NOT NULL,
    unit_price numeric(19,4) DEFAULT 0 NOT NULL,
    tax_rate numeric(9,4) DEFAULT 0 NOT NULL,
    line_subtotal numeric(19,4) DEFAULT 0 NOT NULL,
    line_tax numeric(19,4) DEFAULT 0 NOT NULL,
    line_total numeric(19,4) DEFAULT 0 NOT NULL,
    revenue_account_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_ar_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_ar_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    amount numeric(19,4) NOT NULL,
    bank_account_id uuid NOT NULL,
    reference text,
    method text,
    journal_entry_id uuid,
    posted_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    crm_company_id uuid,
    CONSTRAINT acc_ar_payments_amount_check CHECK ((amount > (0)::numeric))
);
ALTER TABLE ONLY public.acc_ar_payments REPLICA IDENTITY FULL;
--
-- Name: acc_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    actor_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    before_state jsonb,
    after_state jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_bank_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    coa_account_id uuid NOT NULL,
    name text NOT NULL,
    institution text,
    account_number_last4 text,
    currency text DEFAULT 'GBP'::text NOT NULL,
    opening_balance numeric(19,4) DEFAULT 0 NOT NULL,
    opening_balance_date date DEFAULT CURRENT_DATE NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_bank_reconciliations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_bank_reconciliations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    bank_account_id uuid NOT NULL,
    statement_date date NOT NULL,
    opening_balance numeric(19,4) NOT NULL,
    closing_balance numeric(19,4) NOT NULL,
    status public.acc_reconciliation_status DEFAULT 'open'::public.acc_reconciliation_status NOT NULL,
    completed_at timestamp with time zone,
    completed_by uuid,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_bank_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_bank_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    bank_account_id uuid NOT NULL,
    txn_date date NOT NULL,
    description text NOT NULL,
    reference text,
    amount numeric(19,4) NOT NULL,
    running_balance numeric(19,4),
    status public.acc_bank_txn_status DEFAULT 'unmatched'::public.acc_bank_txn_status NOT NULL,
    journal_entry_id uuid,
    reconciliation_id uuid,
    source text DEFAULT 'manual'::text NOT NULL,
    external_id text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.acc_bank_transactions REPLICA IDENTITY FULL;
--
-- Name: acc_chart_of_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_chart_of_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type public.acc_account_type NOT NULL,
    subtype text,
    parent_account_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_depreciation_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_depreciation_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    run_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    amount numeric(19,4) DEFAULT 0 NOT NULL,
    book_value_before numeric(19,4) DEFAULT 0 NOT NULL,
    book_value_after numeric(19,4) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_depreciation_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_depreciation_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    period_end date NOT NULL,
    reference text,
    status public.acc_depreciation_run_status DEFAULT 'draft'::public.acc_depreciation_run_status NOT NULL,
    total_amount numeric(19,4) DEFAULT 0 NOT NULL,
    journal_entry_id uuid,
    posted_at timestamp with time zone,
    notes text,
    created_by uuid DEFAULT auth.uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    full_name text NOT NULL,
    email text,
    job_title text,
    tax_code text,
    ni_number text,
    pay_type public.acc_pay_type DEFAULT 'salary'::public.acc_pay_type NOT NULL,
    pay_rate numeric(19,4) DEFAULT 0 NOT NULL,
    default_hours numeric(10,2) DEFAULT 0 NOT NULL,
    employment_start date,
    employment_end date,
    bank_sort_code text,
    bank_account_number text,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid DEFAULT auth.uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_fixed_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_fixed_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    asset_tag text,
    name text NOT NULL,
    category text,
    purchase_date date NOT NULL,
    purchase_cost numeric(19,4) DEFAULT 0 NOT NULL,
    salvage_value numeric(19,4) DEFAULT 0 NOT NULL,
    useful_life_months integer DEFAULT 60 NOT NULL,
    depreciation_method public.acc_depreciation_method DEFAULT 'straight_line'::public.acc_depreciation_method NOT NULL,
    reducing_rate_pct numeric(6,3),
    asset_account_id uuid,
    accum_depr_account_id uuid,
    depr_expense_account_id uuid,
    status public.acc_fixed_asset_status DEFAULT 'active'::public.acc_fixed_asset_status NOT NULL,
    disposal_date date,
    disposal_proceeds numeric(19,4),
    disposal_entry_id uuid,
    acquisition_entry_id uuid,
    accumulated_depreciation numeric(19,4) DEFAULT 0 NOT NULL,
    last_depreciated_on date,
    notes text,
    created_by uuid DEFAULT auth.uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT acc_fa_life_positive CHECK ((useful_life_months > 0)),
    CONSTRAINT acc_fa_salvage_valid CHECK (((salvage_value >= (0)::numeric) AND (salvage_value <= purchase_cost)))
);
ALTER TABLE ONLY public.acc_fixed_assets REPLICA IDENTITY FULL;
--
-- Name: acc_fx_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_fx_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    rate_date date NOT NULL,
    from_currency text NOT NULL,
    to_currency text NOT NULL,
    rate numeric(18,8) NOT NULL,
    source text DEFAULT 'manual'::text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT acc_fx_rates_rate_check CHECK ((rate > (0)::numeric))
);
--
-- Name: acc_journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    entry_date date NOT NULL,
    description text,
    source_type public.acc_source_type DEFAULT 'manual'::public.acc_source_type NOT NULL,
    source_id uuid,
    source_ref text,
    created_by uuid NOT NULL,
    posted_at timestamp with time zone,
    period_id uuid,
    reversed_by_entry_id uuid,
    is_reversal boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.acc_journal_entries REPLICA IDENTITY FULL;
--
-- Name: acc_journal_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_journal_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    journal_entry_id uuid NOT NULL,
    account_id uuid NOT NULL,
    debit numeric(19,4) DEFAULT 0 NOT NULL,
    credit numeric(19,4) DEFAULT 0 NOT NULL,
    client_id uuid,
    memo text,
    tax_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT acc_journal_lines_check CHECK ((NOT ((debit > (0)::numeric) AND (credit > (0)::numeric)))),
    CONSTRAINT acc_journal_lines_credit_check CHECK ((credit >= (0)::numeric)),
    CONSTRAINT acc_journal_lines_debit_check CHECK ((debit >= (0)::numeric))
);
ALTER TABLE ONLY public.acc_journal_lines REPLICA IDENTITY FULL;
--
-- Name: acc_org_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_org_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_user_id uuid NOT NULL,
    client_team_id uuid,
    name text NOT NULL,
    base_currency text DEFAULT 'GBP'::text NOT NULL,
    fiscal_year_start date DEFAULT (date_trunc('year'::text, now()))::date NOT NULL,
    vat_scheme text DEFAULT 'standard'::text NOT NULL,
    tax_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_pay_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_pay_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    pay_date date NOT NULL,
    reference text,
    status public.acc_pay_run_status DEFAULT 'draft'::public.acc_pay_run_status NOT NULL,
    total_gross numeric(19,4) DEFAULT 0 NOT NULL,
    total_paye numeric(19,4) DEFAULT 0 NOT NULL,
    total_ni_ee numeric(19,4) DEFAULT 0 NOT NULL,
    total_ni_er numeric(19,4) DEFAULT 0 NOT NULL,
    total_pension numeric(19,4) DEFAULT 0 NOT NULL,
    total_other_ded numeric(19,4) DEFAULT 0 NOT NULL,
    total_net numeric(19,4) DEFAULT 0 NOT NULL,
    posted_at timestamp with time zone,
    journal_entry_id uuid,
    payment_entry_id uuid,
    paid_at timestamp with time zone,
    created_by uuid DEFAULT auth.uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT acc_pay_runs_period_valid CHECK ((period_end >= period_start))
);
--
-- Name: acc_payslips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_payslips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    pay_run_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    hours numeric(10,2) DEFAULT 0 NOT NULL,
    gross numeric(19,4) DEFAULT 0 NOT NULL,
    paye numeric(19,4) DEFAULT 0 NOT NULL,
    ni_ee numeric(19,4) DEFAULT 0 NOT NULL,
    ni_er numeric(19,4) DEFAULT 0 NOT NULL,
    pension numeric(19,4) DEFAULT 0 NOT NULL,
    other_ded numeric(19,4) DEFAULT 0 NOT NULL,
    net numeric(19,4) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_report_recalcs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_report_recalcs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    report_name text NOT NULL,
    params jsonb,
    row_count integer,
    duration_ms integer,
    computed_by uuid,
    computed_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_trial_balance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.acc_trial_balance WITH (security_invoker='true') AS
 SELECT a.org_id,
    a.id AS account_id,
    a.code AS account_code,
    a.name AS account_name,
    a.type AS account_type,
    a.subtype AS account_subtype,
    COALESCE(sum(jl.debit), (0)::numeric) AS total_debit,
    COALESCE(sum(jl.credit), (0)::numeric) AS total_credit,
    (COALESCE(sum(jl.debit), (0)::numeric) - COALESCE(sum(jl.credit), (0)::numeric)) AS balance
   FROM ((public.acc_chart_of_accounts a
     LEFT JOIN public.acc_journal_lines jl ON ((jl.account_id = a.id)))
     LEFT JOIN public.acc_journal_entries je ON (((je.id = jl.journal_entry_id) AND (je.posted_at IS NOT NULL))))
  GROUP BY a.org_id, a.id, a.code, a.name, a.type, a.subtype;
--
-- Name: acc_user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.acc_role NOT NULL,
    can_post_journal boolean DEFAULT false NOT NULL,
    can_close_period boolean DEFAULT false NOT NULL,
    can_approve_payment boolean DEFAULT false NOT NULL,
    can_reopen_period boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: acc_vat_returns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acc_vat_returns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    output_vat numeric(19,4) DEFAULT 0 NOT NULL,
    input_vat numeric(19,4) DEFAULT 0 NOT NULL,
    net_due numeric(19,4) DEFAULT 0 NOT NULL,
    status public.acc_vat_return_status DEFAULT 'draft'::public.acc_vat_return_status NOT NULL,
    reference text,
    notes text,
    submitted_at timestamp with time zone,
    submitted_by uuid,
    submission_entry_id uuid,
    payment_date date,
    payment_amount numeric(19,4),
    payment_entry_id uuid,
    created_by uuid DEFAULT auth.uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT acc_vat_returns_period_valid CHECK ((period_end >= period_start))
);
ALTER TABLE ONLY public.acc_vat_returns REPLICA IDENTITY FULL;
--
-- Name: account_type_presets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_type_presets (
    account_type text NOT NULL,
    visible_features jsonb DEFAULT '[]'::jsonb NOT NULL,
    hidden_features jsonb DEFAULT '[]'::jsonb NOT NULL,
    suppress_prompts boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT account_type_presets_account_type_check CHECK ((account_type = ANY (ARRAY['paid_client'::text, 'live_preview'::text, 'viewer_only'::text, 'business_management'::text, 'admin'::text])))
);
