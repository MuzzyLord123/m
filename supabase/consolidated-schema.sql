--
-- PostgreSQL database dump
--


-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

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


--
-- Name: ad_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    platform text NOT NULL,
    campaign_name text NOT NULL,
    creative_url text,
    creative_type text DEFAULT 'image'::text,
    status text DEFAULT 'running'::text NOT NULL,
    objective text,
    start_date date,
    monthly_budget numeric(10,2),
    notes text,
    last_updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ad_campaigns_creative_type_check CHECK ((creative_type = ANY (ARRAY['image'::text, 'video'::text]))),
    CONSTRAINT ad_campaigns_objective_check CHECK ((objective = ANY (ARRAY['leads'::text, 'traffic'::text, 'sales'::text, 'awareness'::text, 'engagement'::text]))),
    CONSTRAINT ad_campaigns_platform_check CHECK ((platform = ANY (ARRAY['meta'::text, 'tiktok'::text, 'google'::text, 'linkedin'::text, 'twitter'::text]))),
    CONSTRAINT ad_campaigns_status_check CHECK ((status = ANY (ARRAY['running'::text, 'paused'::text, 'completed'::text, 'scheduled'::text])))
);


--
-- Name: ai_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text DEFAULT 'New conversation'::text NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    key_name text NOT NULL,
    key_prefix text NOT NULL,
    key_hash text NOT NULL,
    permissions jsonb DEFAULT '["read"]'::jsonb,
    rate_limit integer DEFAULT 100,
    last_used_at timestamp with time zone,
    usage_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: app_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_name text NOT NULL,
    project_type text DEFAULT 'dashboard'::text NOT NULL,
    description text,
    status text DEFAULT 'planning'::text NOT NULL,
    priority text DEFAULT 'normal'::text,
    estimated_hours integer,
    actual_hours integer DEFAULT 0,
    start_date date,
    target_completion_date date,
    completed_at timestamp with time zone,
    features jsonb DEFAULT '[]'::jsonb,
    tech_stack jsonb DEFAULT '[]'::jsonb,
    milestones jsonb DEFAULT '[]'::jsonb,
    notes text,
    admin_notes text,
    preview_url text,
    production_url text,
    repository_url text,
    assigned_to text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: asset_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    parent_id uuid,
    color text DEFAULT '#00b8d4'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: asset_tag_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_tag_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: asset_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#00b8d4'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: automation_rule_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_rule_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rule_id uuid NOT NULL,
    trigger_data jsonb DEFAULT '{}'::jsonb,
    action_result jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'success'::text NOT NULL,
    error_message text,
    executed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: automation_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    trigger_event text NOT NULL,
    trigger_config jsonb DEFAULT '{}'::jsonb,
    conditions jsonb DEFAULT '[]'::jsonb,
    action_type text NOT NULL,
    action_config jsonb DEFAULT '{}'::jsonb,
    last_triggered_at timestamp with time zone,
    trigger_count integer DEFAULT 0 NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: automation_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    workflow_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    duration_ms integer,
    node_results jsonb,
    error_message text,
    trigger_type text,
    trigger_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: automation_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    workflow_id uuid,
    schedule_name text NOT NULL,
    cron_expression text DEFAULT '0 9 * * 1'::text NOT NULL,
    is_active boolean DEFAULT true,
    last_run_at timestamp with time zone,
    next_run_at timestamp with time zone,
    run_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: billing_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_value jsonb,
    new_value jsonb,
    performed_by uuid,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blocked_ips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocked_ips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_address text NOT NULL,
    blocked_by uuid,
    reason text,
    is_auto_blocked boolean DEFAULT false,
    failed_attempts integer DEFAULT 0,
    blocked_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: booking_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    staff_id uuid,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: booking_blocked_dates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_blocked_dates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    staff_id uuid,
    blocked_date date NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: booking_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    site_id uuid,
    name text NOT NULL,
    description text,
    duration_minutes integer DEFAULT 60 NOT NULL,
    buffer_minutes integer DEFAULT 0 NOT NULL,
    price numeric(10,2) DEFAULT 0,
    currency text DEFAULT 'GBP'::text,
    max_bookings_per_slot integer DEFAULT 1,
    is_active boolean DEFAULT true,
    color text DEFAULT '#3b82f6'::text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: booking_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_name text,
    business_slug text,
    timezone text DEFAULT 'Europe/London'::text,
    booking_page_enabled boolean DEFAULT true,
    embed_enabled boolean DEFAULT true,
    require_payment boolean DEFAULT false,
    auto_confirm boolean DEFAULT true,
    allow_cancellation boolean DEFAULT true,
    cancellation_hours integer DEFAULT 24,
    allow_reschedule boolean DEFAULT true,
    reschedule_hours integer DEFAULT 24,
    booking_notice_hours integer DEFAULT 1,
    max_advance_days integer DEFAULT 90,
    confirmation_message text DEFAULT 'Your booking has been confirmed!'::text,
    branding_color text DEFAULT '#3b82f6'::text,
    branding_logo text,
    notification_email boolean DEFAULT true,
    notification_sms boolean DEFAULT false,
    stripe_account_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: booking_staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_staff (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    avatar_url text,
    bio text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: booking_staff_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_staff_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id uuid NOT NULL,
    service_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    service_id uuid,
    staff_id uuid,
    site_id uuid,
    booking_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    duration_minutes integer DEFAULT 60 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    source text DEFAULT 'direct'::text NOT NULL,
    customer_name text,
    customer_email text,
    customer_phone text,
    notes text,
    price numeric(10,2) DEFAULT 0,
    currency text DEFAULT 'GBP'::text,
    payment_status text DEFAULT 'unpaid'::text,
    payment_intent_id text,
    reminder_sent boolean DEFAULT false,
    confirmation_sent boolean DEFAULT false,
    cancellation_reason text,
    cancelled_at timestamp with time zone,
    rescheduled_from uuid,
    external_calendar_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: brand_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brand_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    team_id uuid,
    logo_url text,
    primary_color text DEFAULT '#3b82f6'::text,
    secondary_color text DEFAULT '#6366f1'::text,
    accent_color text DEFAULT '#8b5cf6'::text,
    company_name text,
    custom_domain text,
    email_header_url text,
    login_background_url text,
    report_template text DEFAULT 'executive_summary'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: business_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    report_type text DEFAULT 'weekly_summary'::text NOT NULL,
    title text NOT NULL,
    content text,
    ai_analysis jsonb,
    charts_data jsonb,
    period_start timestamp with time zone,
    period_end timestamp with time zone,
    status text DEFAULT 'generated'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cad_autosaves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cad_autosaves (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid,
    drawing_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cad_project_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cad_project_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    version_number integer NOT NULL,
    version_name text,
    drawing_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    entity_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cad_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cad_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'Untitled Drawing'::text NOT NULL,
    description text,
    tags text[] DEFAULT '{}'::text[],
    folder text DEFAULT ''::text,
    units text DEFAULT 'mm'::text NOT NULL,
    thumbnail_url text,
    drawing_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    is_template boolean DEFAULT false NOT NULL,
    template_category text,
    shared_mode text DEFAULT 'private'::text,
    share_token uuid,
    entity_count integer DEFAULT 0 NOT NULL,
    layer_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: calculator_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calculator_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    expression text NOT NULL,
    result text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: calendar_event_exceptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_event_exceptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    exception_date date NOT NULL,
    modified_event_data jsonb,
    is_cancelled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    is_all_day boolean DEFAULT false NOT NULL,
    location text,
    color text DEFAULT '#3b82f6'::text NOT NULL,
    is_recurring boolean DEFAULT false NOT NULL,
    recurrence_rule jsonb,
    reminders jsonb DEFAULT '[]'::jsonb,
    attendees jsonb DEFAULT '[]'::jsonb,
    meeting_link text,
    attachments jsonb DEFAULT '[]'::jsonb,
    calendar_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: call_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.call_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    caller_id uuid NOT NULL,
    callee_id uuid NOT NULL,
    channel_id uuid,
    call_type text DEFAULT 'audio'::text NOT NULL,
    status text DEFAULT 'ringing'::text NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT call_sessions_call_type_check CHECK ((call_type = ANY (ARRAY['audio'::text, 'video'::text]))),
    CONSTRAINT call_sessions_status_check CHECK ((status = ANY (ARRAY['ringing'::text, 'accepted'::text, 'declined'::text, 'ended'::text, 'missed'::text, 'busy'::text])))
);


--
-- Name: client_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    folder_id uuid,
    file_name text NOT NULL,
    original_name text NOT NULL,
    file_path text NOT NULL,
    file_type text NOT NULL,
    mime_type text NOT NULL,
    file_size bigint DEFAULT 0 NOT NULL,
    description text,
    is_starred boolean DEFAULT false,
    download_count integer DEFAULT 0,
    last_accessed_at timestamp with time zone,
    is_encrypted boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_billing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_billing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_name text DEFAULT 'Starter'::text NOT NULL,
    plan_price numeric DEFAULT 0 NOT NULL,
    billing_cycle text DEFAULT 'monthly'::text NOT NULL,
    services jsonb DEFAULT '[]'::jsonb,
    add_ons jsonb DEFAULT '[]'::jsonb,
    one_off_charges jsonb DEFAULT '[]'::jsonb,
    next_billing_date date,
    payment_status text DEFAULT 'pending'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    title text NOT NULL,
    document_url text,
    document_type text DEFAULT 'contract'::text,
    signed_at timestamp with time zone,
    expires_at timestamp with time zone,
    status text DEFAULT 'draft'::text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    crm_company_id uuid,
    crm_opportunity_id uuid,
    CONSTRAINT client_contracts_document_type_check CHECK ((document_type = ANY (ARRAY['contract'::text, 'proposal'::text, 'agreement'::text, 'sow'::text]))),
    CONSTRAINT client_contracts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'signed'::text, 'expired'::text, 'cancelled'::text])))
);


--
-- Name: client_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    invoice_number text NOT NULL,
    amount numeric NOT NULL,
    tax_amount numeric DEFAULT 0,
    total_amount numeric NOT NULL,
    currency text DEFAULT 'GBP'::text,
    status text DEFAULT 'draft'::text,
    due_date date,
    paid_at timestamp with time zone,
    payment_method text,
    items jsonb DEFAULT '[]'::jsonb,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    crm_company_id uuid,
    CONSTRAINT client_invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'sent'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])))
);


--
-- Name: client_onboarding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_onboarding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    deal_id uuid,
    client_name text NOT NULL,
    client_email text,
    company_name text,
    status text DEFAULT 'pending'::text NOT NULL,
    account_created boolean DEFAULT false NOT NULL,
    account_created_at timestamp with time zone,
    portal_configured boolean DEFAULT false NOT NULL,
    portal_configured_at timestamp with time zone,
    welcome_sent boolean DEFAULT false NOT NULL,
    welcome_sent_at timestamp with time zone,
    info_checklist_sent boolean DEFAULT false NOT NULL,
    info_checklist_sent_at timestamp with time zone,
    assets_requested boolean DEFAULT false NOT NULL,
    assets_requested_at timestamp with time zone,
    timeline_generated boolean DEFAULT false NOT NULL,
    timeline_generated_at timestamp with time zone,
    checklist_items jsonb DEFAULT '[]'::jsonb,
    timeline_data jsonb DEFAULT '{}'::jsonb,
    onboarding_notes text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_pricing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_pricing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    service_type text NOT NULL,
    service_name text NOT NULL,
    description text,
    negotiated_price numeric NOT NULL,
    is_recurring boolean DEFAULT false,
    billing_frequency text,
    is_visible boolean DEFAULT true,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_pricing_billing_frequency_check CHECK ((billing_frequency = ANY (ARRAY['one-time'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text])))
);


--
-- Name: client_teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    primary_account_id uuid NOT NULL,
    team_code text NOT NULL,
    team_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cms_collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_collections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    icon text DEFAULT 'file-text'::text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cms_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    collection_id uuid NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: comm_channel_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_channel_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    is_muted boolean DEFAULT false NOT NULL,
    last_read_at timestamp with time zone DEFAULT now(),
    notification_preference text DEFAULT 'all'::text,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT comm_channel_members_notification_preference_check CHECK ((notification_preference = ANY (ARRAY['all'::text, 'mentions'::text, 'none'::text]))),
    CONSTRAINT comm_channel_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text, 'member'::text])))
);


--
-- Name: comm_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    channel_type text DEFAULT 'public'::text NOT NULL,
    icon text DEFAULT '#'::text,
    color text,
    created_by uuid NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    pinned_message_ids uuid[] DEFAULT '{}'::uuid[],
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    join_code text,
    CONSTRAINT comm_channels_channel_type_check CHECK ((channel_type = ANY (ARRAY['public'::text, 'private'::text, 'direct'::text, 'announcement'::text])))
);


--
-- Name: comm_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    message_type text DEFAULT 'text'::text NOT NULL,
    parent_id uuid,
    thread_count integer DEFAULT 0 NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_edited boolean DEFAULT false NOT NULL,
    edited_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_pinned boolean DEFAULT false NOT NULL,
    mentions uuid[] DEFAULT '{}'::uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT comm_messages_message_type_check CHECK ((message_type = ANY (ARRAY['text'::text, 'file'::text, 'image'::text, 'voice'::text, 'system'::text, 'code'::text, 'poll'::text])))
);


--
-- Name: comm_presence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_presence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'offline'::text NOT NULL,
    custom_status text,
    custom_emoji text,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT comm_presence_status_check CHECK ((status = ANY (ARRAY['online'::text, 'away'::text, 'busy'::text, 'dnd'::text, 'offline'::text, 'invisible'::text])))
);


--
-- Name: comm_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_reactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id uuid NOT NULL,
    user_id uuid NOT NULL,
    emoji text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: comm_read_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_read_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel_id uuid NOT NULL,
    user_id uuid NOT NULL,
    last_read_message_id uuid,
    last_read_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: comm_user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_user_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    show_read_receipts boolean DEFAULT true,
    show_typing_indicator boolean DEFAULT true,
    show_last_seen boolean DEFAULT true,
    notification_sound boolean DEFAULT true,
    quiet_hours_start time without time zone,
    quiet_hours_end time without time zone,
    email_digest text DEFAULT 'none'::text,
    theme_preference text DEFAULT 'system'::text,
    compact_mode boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT comm_user_settings_email_digest_check CHECK ((email_digest = ANY (ARRAY['none'::text, 'hourly'::text, 'daily'::text, 'weekly'::text])))
);


--
-- Name: content_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    request_type text NOT NULL,
    title text NOT NULL,
    description text,
    reference_urls text[],
    reference_files text[],
    status text DEFAULT 'pending'::text NOT NULL,
    assigned_to text,
    admin_notes text,
    delivered_content text,
    delivered_files text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    scheduled_date date,
    priority text DEFAULT 'normal'::text,
    CONSTRAINT content_requests_request_type_check CHECK ((request_type = ANY (ARRAY['blog'::text, 'social_post'::text, 'ad_copy'::text, 'website_section'::text]))),
    CONSTRAINT content_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'delivered'::text])))
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    assigned_admin_id uuid,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    CONSTRAINT conversations_status_check CHECK ((status = ANY (ARRAY['open'::text, 'waiting'::text, 'closed'::text])))
);


--
-- Name: crm_activity_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_activity_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    communication_id uuid NOT NULL,
    contact_id uuid,
    user_id uuid,
    role text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crm_communication_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_communication_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    communication_id uuid NOT NULL,
    platform_file_id uuid,
    filename text,
    file_url text,
    content_type text,
    size_bytes bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crm_communications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_communications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    owner_id uuid,
    company_id uuid,
    contact_id uuid,
    opportunity_id uuid,
    kind public.crm_comm_kind NOT NULL,
    direction public.crm_comm_direction DEFAULT 'outbound'::public.crm_comm_direction NOT NULL,
    subject text,
    body text,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    duration_seconds integer,
    from_address text,
    to_addresses text[] DEFAULT '{}'::text[],
    cc_addresses text[] DEFAULT '{}'::text[],
    status text,
    external_id text,
    external_source text,
    tags text[] DEFAULT '{}'::text[],
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_communications_check CHECK (((company_id IS NOT NULL) OR (contact_id IS NOT NULL) OR (opportunity_id IS NOT NULL)))
);


--
-- Name: crm_companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    owner_id uuid,
    name text NOT NULL,
    legal_name text,
    domain text,
    website text,
    industry text,
    size text,
    phone text,
    email text,
    address_line1 text,
    address_line2 text,
    city text,
    region text,
    postal_code text,
    country text,
    notes text,
    tags text[] DEFAULT '{}'::text[],
    source text,
    relationship_type public.crm_relationship_type[] DEFAULT '{prospect}'::public.crm_relationship_type[] NOT NULL,
    status public.crm_entity_status DEFAULT 'active'::public.crm_entity_status NOT NULL,
    lifecycle_stage_id uuid,
    linked_lead_id uuid,
    linked_client_team_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crm_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    owner_id uuid,
    company_id uuid,
    first_name text,
    last_name text,
    full_name text,
    email text,
    phone text,
    mobile text,
    job_title text,
    notes text,
    tags text[] DEFAULT '{}'::text[],
    relationship_type public.crm_relationship_type[] DEFAULT '{prospect}'::public.crm_relationship_type[] NOT NULL,
    status public.crm_entity_status DEFAULT 'active'::public.crm_entity_status NOT NULL,
    lifecycle_stage_id uuid,
    is_primary boolean DEFAULT false NOT NULL,
    linked_lead_id uuid,
    source text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crm_deal_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_deal_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deal_id uuid NOT NULL,
    user_id uuid NOT NULL,
    activity_type text NOT NULL,
    old_value text,
    new_value text,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crm_deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_deals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lead_id uuid,
    deal_name text NOT NULL,
    stage text DEFAULT 'qualification'::text NOT NULL,
    probability integer DEFAULT 20 NOT NULL,
    deal_value numeric(12,2) DEFAULT 0 NOT NULL,
    currency text DEFAULT 'GBP'::text NOT NULL,
    expected_close_date date,
    actual_close_date date,
    won boolean,
    contact_name text,
    company_name text,
    description text,
    tags text[],
    notes text,
    lost_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_deals_probability_check CHECK (((probability >= 0) AND (probability <= 100)))
);


--
-- Name: crm_opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_opportunities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    owner_id uuid,
    company_id uuid,
    contact_id uuid,
    title text NOT NULL,
    description text,
    value numeric(19,2) DEFAULT 0,
    currency text DEFAULT 'GBP'::text,
    stage text DEFAULT 'lead'::text NOT NULL,
    probability integer DEFAULT 0,
    expected_close_date date,
    actual_close_date date,
    source text,
    tags text[] DEFAULT '{}'::text[],
    notes text,
    lifecycle_stage_id uuid,
    status public.crm_entity_status DEFAULT 'active'::public.crm_entity_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crm_deals_compat; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.crm_deals_compat AS
 SELECT id,
    org_id,
    owner_id AS assigned_to,
    title,
    description,
    value AS amount,
    currency,
    stage,
    probability,
    expected_close_date,
    actual_close_date,
    company_id,
    contact_id,
    source,
    tags,
    notes,
    (status)::text AS deal_status,
    created_at,
    updated_at
   FROM public.crm_opportunities o;


--
-- Name: crm_financial_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_financial_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    finance_type text NOT NULL,
    finance_id uuid NOT NULL,
    amount numeric(18,2),
    currency text DEFAULT 'GBP'::text,
    status text,
    occurred_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_financial_links_entity_type_check CHECK ((entity_type = ANY (ARRAY['company'::text, 'contact'::text, 'opportunity'::text]))),
    CONSTRAINT crm_financial_links_finance_type_check CHECK ((finance_type = ANY (ARRAY['acc_customer'::text, 'ar_invoice'::text, 'ar_payment'::text, 'ap_bill'::text, 'ap_payment'::text, 'proposal'::text, 'contract'::text, 'client_invoice'::text])))
);


--
-- Name: crm_lifecycle_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_lifecycle_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    from_stage_id uuid,
    to_stage_id uuid,
    changed_by uuid,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crm_lifecycle_stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_lifecycle_stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    category public.crm_lifecycle_category DEFAULT 'other'::public.crm_lifecycle_category NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    color text,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crm_workflow_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_workflow_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    workflow_id uuid,
    entity_type text,
    entity_id uuid,
    trigger_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    actions_executed jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text DEFAULT 'success'::text NOT NULL,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_workflow_runs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'partial'::text, 'failed'::text, 'skipped'::text])))
);


--
-- Name: crm_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    trigger_event text NOT NULL,
    trigger_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    actions jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 100 NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_workflows_trigger_event_check CHECK ((trigger_event = ANY (ARRAY['lifecycle_change'::text, 'entity_created'::text, 'tag_added'::text, 'renewal_due'::text, 'no_activity'::text, 'manual'::text])))
);


--
-- Name: customer_uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    notes text,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'pending'::text
);


--
-- Name: dashboard_metrics_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_metrics_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    metric_key text NOT NULL,
    metric_value jsonb DEFAULT '{}'::jsonb NOT NULL,
    period text DEFAULT 'weekly'::text NOT NULL,
    computed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: designer_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designer_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    site_id uuid,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text,
    file_size integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: designer_components; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designer_components (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'Custom'::text,
    elements jsonb DEFAULT '[]'::jsonb NOT NULL,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: designer_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designer_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    page_name text DEFAULT 'Untitled Page'::text NOT NULL,
    slug text DEFAULT '/'::text NOT NULL,
    elements jsonb DEFAULT '[]'::jsonb,
    page_settings jsonb DEFAULT '{}'::jsonb,
    seo_title text,
    seo_description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_homepage boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: designer_sites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designer_sites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    site_name text NOT NULL,
    description text,
    template_id text,
    status text DEFAULT 'draft'::text NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    global_styles jsonb DEFAULT '{}'::jsonb,
    published_url text,
    published_at timestamp with time zone
);


--
-- Name: document_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    selection_from integer,
    selection_to integer,
    selected_text text,
    is_resolved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content jsonb,
    title text,
    word_count integer DEFAULT 0,
    version_number integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ecommerce_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecommerce_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    order_number text DEFAULT concat('ORD-', to_char(now(), 'YYMMDD'::text), '-', substr((gen_random_uuid())::text, 1, 6)) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    customer_email text,
    customer_name text,
    customer_phone text,
    shipping_address jsonb,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    currency text DEFAULT 'GBP'::text NOT NULL,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    shipping_cost numeric(10,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    payment_provider text DEFAULT 'none'::text NOT NULL,
    payment_status text DEFAULT 'unpaid'::text NOT NULL,
    payment_intent_id text,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ecommerce_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text, 'refunded'::text])))
);


--
-- Name: ecommerce_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecommerce_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_name text DEFAULT 'My Store'::text NOT NULL,
    contact_email text,
    support_url text,
    currency text DEFAULT 'GBP'::text NOT NULL,
    timezone text DEFAULT 'Europe/London'::text NOT NULL,
    brand_color text DEFAULT '#111111'::text NOT NULL,
    checkout_accent text DEFAULT '#111111'::text NOT NULL,
    logo_url text,
    shipping_enabled boolean DEFAULT true NOT NULL,
    shipping_flat_rate numeric(10,2) DEFAULT 0 NOT NULL,
    shipping_free_over numeric(10,2),
    tax_enabled boolean DEFAULT false NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0 NOT NULL,
    tax_inclusive boolean DEFAULT false NOT NULL,
    payments_provider text DEFAULT 'none'::text NOT NULL,
    payments_configured boolean DEFAULT false NOT NULL,
    payments_test_mode boolean DEFAULT true NOT NULL,
    checkout_success_url text,
    checkout_cancel_url text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ecommerce_settings_payments_provider_check CHECK ((payments_provider = ANY (ARRAY['none'::text, 'stripe'::text, 'paddle'::text, 'manual'::text])))
);


--
-- Name: email_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider text NOT NULL,
    email_address text NOT NULL,
    display_name text,
    color text DEFAULT '#6366f1'::text,
    access_token text,
    refresh_token text,
    token_expires_at timestamp with time zone,
    imap_host text,
    imap_port integer,
    smtp_host text,
    smtp_port integer,
    imap_username text,
    imap_password text,
    use_ssl boolean DEFAULT true,
    is_active boolean DEFAULT true,
    last_sync_at timestamp with time zone,
    sync_cursor text,
    status text DEFAULT 'pending'::text,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT email_accounts_provider_check CHECK ((provider = ANY (ARRAY['gmail'::text, 'outlook'::text, 'yahoo'::text, 'icloud'::text, 'custom'::text]))),
    CONSTRAINT email_accounts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'error'::text, 'disconnected'::text])))
);


--
-- Name: email_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    account_id uuid,
    to_addresses jsonb DEFAULT '[]'::jsonb,
    cc_addresses jsonb DEFAULT '[]'::jsonb,
    bcc_addresses jsonb DEFAULT '[]'::jsonb,
    subject text DEFAULT ''::text,
    body_html text DEFAULT ''::text,
    body_text text DEFAULT ''::text,
    attachments jsonb DEFAULT '[]'::jsonb,
    in_reply_to text,
    is_scheduled boolean DEFAULT false,
    scheduled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    user_id uuid NOT NULL,
    provider_message_id text NOT NULL,
    thread_id text,
    from_name text,
    from_email text,
    to_addresses jsonb DEFAULT '[]'::jsonb,
    cc_addresses jsonb DEFAULT '[]'::jsonb,
    bcc_addresses jsonb DEFAULT '[]'::jsonb,
    subject text,
    snippet text,
    body_html text,
    body_text text,
    date timestamp with time zone NOT NULL,
    is_read boolean DEFAULT false,
    is_starred boolean DEFAULT false,
    is_draft boolean DEFAULT false,
    has_attachments boolean DEFAULT false,
    attachments jsonb DEFAULT '[]'::jsonb,
    labels text[] DEFAULT '{}'::text[],
    folder text DEFAULT 'inbox'::text,
    category text DEFAULT 'primary'::text,
    raw_headers jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: enquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    company text,
    phone text,
    interest text,
    project_details text,
    page_count text,
    budget text,
    status text DEFAULT 'new'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    first_name text,
    last_name text,
    business_type text,
    business_address text,
    website text,
    employee_count text,
    years_in_business text,
    selected_package text,
    timeline text,
    has_existing_site text,
    primary_goal text,
    must_have_features text[],
    competitors text,
    brand_colors text,
    inspiration_sites text,
    how_did_you_hear text,
    social_media text,
    additional_notes text,
    resume_token uuid DEFAULT gen_random_uuid(),
    form_step integer DEFAULT 1,
    is_draft boolean DEFAULT false
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    currency text DEFAULT 'GBP'::text,
    category text DEFAULT 'Other'::text NOT NULL,
    category_color text DEFAULT '#64748b'::text,
    vendor text DEFAULT ''::text,
    expense_date date DEFAULT CURRENT_DATE NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    has_receipt boolean DEFAULT false,
    receipt_url text DEFAULT ''::text,
    project text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: greeting_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.greeting_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    message text DEFAULT ''::text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_candidates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_candidates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    department text DEFAULT 'engineering'::text NOT NULL,
    stage text DEFAULT 'applied'::text NOT NULL,
    applied_date date DEFAULT CURRENT_DATE NOT NULL,
    email text DEFAULT ''::text,
    rating numeric DEFAULT 0,
    notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hr_employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    employee_id text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    department text DEFAULT 'engineering'::text NOT NULL,
    email text NOT NULL,
    phone text DEFAULT ''::text,
    location text DEFAULT ''::text,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    status text DEFAULT 'probation'::text NOT NULL,
    avatar text DEFAULT ''::text,
    salary numeric DEFAULT 0,
    manager text DEFAULT 'TBD'::text,
    skills text[] DEFAULT '{}'::text[],
    performance numeric DEFAULT 0,
    leave_vacation integer DEFAULT 25,
    leave_sick integer DEFAULT 10,
    leave_personal integer DEFAULT 3,
    emergency_contact text DEFAULT 'Not set'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: hr_performance_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_performance_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    employee_id uuid,
    employee_name text NOT NULL,
    period text NOT NULL,
    rating numeric DEFAULT 0,
    goals jsonb DEFAULT '[]'::jsonb,
    feedback text DEFAULT ''::text,
    reviewer text NOT NULL,
    review_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hr_time_off_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_time_off_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    employee_id uuid,
    employee_name text NOT NULL,
    type text DEFAULT 'vacation'::text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    days integer DEFAULT 1 NOT NULL,
    reason text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: inv_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inv_companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    address text,
    status text DEFAULT 'active'::text NOT NULL,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inv_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    address text,
    manager_name text,
    manager_contact text,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inv_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    sku text NOT NULL,
    barcode text,
    description text,
    category_id uuid,
    unit text DEFAULT 'pieces'::text NOT NULL,
    reorder_level integer DEFAULT 0 NOT NULL,
    reorder_qty integer DEFAULT 0 NOT NULL,
    cost_price numeric(12,2) DEFAULT 0 NOT NULL,
    selling_price numeric(12,2) DEFAULT 0 NOT NULL,
    supplier_name text,
    supplier_contact text,
    lead_time_days integer,
    image_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid
);


--
-- Name: inv_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    multi_location_enabled boolean DEFAULT false NOT NULL,
    low_stock_notifications boolean DEFAULT true NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inv_stock_count_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_stock_count_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    count_id uuid NOT NULL,
    product_id uuid NOT NULL,
    expected_qty integer DEFAULT 0 NOT NULL,
    counted_qty integer,
    discrepancy integer GENERATED ALWAYS AS ((COALESCE(counted_qty, 0) - expected_qty)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inv_stock_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_stock_counts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    location_id uuid,
    status text DEFAULT 'draft'::text NOT NULL,
    name text,
    notes text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finalized_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inv_stock_counts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'in_progress'::text, 'finalized'::text])))
);


--
-- Name: inv_stock_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_stock_levels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    location_id uuid NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    last_counted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inv_stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_stock_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    location_id uuid,
    to_location_id uuid,
    movement_type text NOT NULL,
    quantity integer NOT NULL,
    reason text,
    reference text,
    notes text,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inv_stock_movements_movement_type_check CHECK ((movement_type = ANY (ARRAY['in'::text, 'out'::text, 'transfer'::text, 'adjustment'::text])))
);


--
-- Name: knowledge_base; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_base (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    status text DEFAULT 'draft'::text NOT NULL,
    author_id uuid NOT NULL,
    last_edited_by uuid,
    pinned boolean DEFAULT false NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kpi_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    metric_name text NOT NULL,
    target_value numeric NOT NULL,
    current_value numeric DEFAULT 0,
    unit text DEFAULT ''::text,
    period text DEFAULT 'monthly'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lead_imports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_imports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    imported_by uuid NOT NULL,
    source_type public.lead_source NOT NULL,
    total_count integer DEFAULT 0,
    added_count integer DEFAULT 0,
    skipped_count integer DEFAULT 0,
    duplicate_count integer DEFAULT 0,
    import_log jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lead_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lead_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    changed_by uuid NOT NULL,
    old_status public.lead_status,
    new_status public.lead_status NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_name text,
    personal_name text,
    contact_name text,
    is_personal boolean DEFAULT false,
    phone text,
    email text,
    website_url text,
    location_city text,
    location_postcode text,
    google_rating numeric(2,1),
    review_count integer DEFAULT 0,
    category text,
    source public.lead_source DEFAULT 'manual'::public.lead_source,
    status public.lead_status DEFAULT 'new'::public.lead_status,
    assigned_to uuid,
    last_contacted_at timestamp with time zone,
    tags jsonb DEFAULT '[]'::jsonb,
    converted_client_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    enquiry_id uuid,
    enquiry_data jsonb
);


--
-- Name: marketing_page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketing_page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    path text NOT NULL,
    referrer text,
    user_agent text,
    country text,
    session_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_project_updates boolean DEFAULT true NOT NULL,
    email_payments boolean DEFAULT true NOT NULL,
    email_file_uploads boolean DEFAULT false NOT NULL,
    email_approvals boolean DEFAULT true NOT NULL,
    email_deadlines boolean DEFAULT true NOT NULL,
    in_app_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    icon text DEFAULT 'bell'::text,
    link text,
    is_read boolean DEFAULT false NOT NULL,
    is_email_sent boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone
);


--
-- Name: office_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text DEFAULT 'Untitled Document'::text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb,
    document_type text DEFAULT 'word'::text NOT NULL,
    page_size text DEFAULT 'a4'::text,
    page_orientation text DEFAULT 'portrait'::text,
    margins jsonb DEFAULT '{"top": 72, "left": 72, "right": 72, "bottom": 72}'::jsonb,
    is_template boolean DEFAULT false,
    is_starred boolean DEFAULT false,
    word_count integer DEFAULT 0,
    last_edited_by uuid,
    shared_with jsonb DEFAULT '[]'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT office_documents_document_type_check CHECK ((document_type = ANY (ARRAY['word'::text, 'sheet'::text, 'presentation'::text])))
);


--
-- Name: office_poll_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_poll_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    poll_id uuid NOT NULL,
    text text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: office_poll_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_poll_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    poll_id uuid NOT NULL,
    option_id uuid NOT NULL,
    voter_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: office_polls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_polls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    question text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: password_vault_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_vault_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    vault_name text DEFAULT 'Password Vault'::text NOT NULL,
    password_hash text NOT NULL,
    totp_secret_encrypted text NOT NULL,
    security_questions jsonb NOT NULL,
    master_key_hash text NOT NULL,
    master_key_encrypted text NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    failed_attempts integer DEFAULT 0 NOT NULL,
    last_failed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: password_vault_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_vault_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    vault_id uuid NOT NULL,
    title_encrypted text NOT NULL,
    username_encrypted text,
    password_encrypted text,
    url_encrypted text,
    notes_encrypted text,
    category text DEFAULT 'logins'::text NOT NULL,
    has_2fa boolean DEFAULT false NOT NULL,
    starred boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: planner_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    team_id uuid,
    title text NOT NULL,
    description text DEFAULT ''::text,
    status text DEFAULT 'todo'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    category text DEFAULT 'general'::text,
    due_date timestamp with time zone,
    start_date timestamp with time zone,
    completed_at timestamp with time zone,
    assigned_to uuid,
    tags text[] DEFAULT '{}'::text[],
    progress integer DEFAULT 0,
    estimated_hours numeric(6,1),
    actual_hours numeric(6,1),
    parent_task_id uuid,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT planner_tasks_priority_check CHECK ((priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text]))),
    CONSTRAINT planner_tasks_progress_check CHECK (((progress >= 0) AND (progress <= 100))),
    CONSTRAINT planner_tasks_status_check CHECK ((status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'paused'::text, 'in_review'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: platform_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_type text NOT NULL,
    app_source text NOT NULL,
    source_id text,
    source_route text,
    folder_path text DEFAULT '/'::text NOT NULL,
    description text,
    thumbnail_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    file_size_bytes bigint DEFAULT 0,
    is_starred boolean DEFAULT false NOT NULL,
    is_trashed boolean DEFAULT false NOT NULL,
    trashed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: platform_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    folder_name text NOT NULL,
    parent_path text DEFAULT '/'::text NOT NULL,
    full_path text NOT NULL,
    color text,
    icon text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: poll_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.poll_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    poll_id text NOT NULL,
    option_index integer NOT NULL,
    user_id uuid NOT NULL,
    channel_id uuid,
    message_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pomodoro_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pomodoro_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_type text DEFAULT 'focus'::text NOT NULL,
    duration_minutes integer DEFAULT 25 NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    site_id uuid,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    name text NOT NULL,
    sku text,
    price numeric(10,2),
    compare_at_price numeric(10,2),
    inventory_count integer DEFAULT 0,
    options jsonb DEFAULT '{}'::jsonb,
    image_url text,
    is_default boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    site_id uuid,
    category_id uuid,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    short_description text,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    compare_at_price numeric(10,2),
    cost_price numeric(10,2),
    currency text DEFAULT 'GBP'::text NOT NULL,
    sku text,
    barcode text,
    track_inventory boolean DEFAULT false,
    inventory_count integer DEFAULT 0,
    weight numeric(8,2),
    weight_unit text DEFAULT 'kg'::text,
    status text DEFAULT 'draft'::text NOT NULL,
    is_featured boolean DEFAULT false,
    is_digital boolean DEFAULT false,
    images jsonb DEFAULT '[]'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    seo_title text,
    seo_description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'archived'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_id text,
    plan text,
    page_count text,
    status text DEFAULT 'active'::text,
    company text,
    phone text,
    notes text,
    website_status text DEFAULT 'design'::text,
    preview_url text,
    site_published_at timestamp with time zone,
    avatar_url text,
    domain_name text,
    ssl_status text DEFAULT 'pending'::text,
    hosting_provider text DEFAULT 'Lovable Cloud'::text,
    last_updated_at timestamp with time zone DEFAULT now(),
    site_files_url text,
    version_history jsonb DEFAULT '[]'::jsonb,
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret text,
    backup_codes jsonb DEFAULT '[]'::jsonb,
    two_factor_verified_at timestamp with time zone,
    known_ips text[] DEFAULT '{}'::text[],
    email_verified boolean DEFAULT false,
    verification_token uuid,
    verification_sent_at timestamp with time zone,
    verification_expires_at timestamp with time zone,
    verification_resend_count integer DEFAULT 0,
    verification_resend_reset_at timestamp with time zone,
    industry text,
    enquiry_id uuid,
    enquiry_data jsonb,
    is_owner boolean DEFAULT false NOT NULL,
    account_type text DEFAULT 'paid_client'::text NOT NULL,
    CONSTRAINT profiles_account_type_check CHECK ((account_type = ANY (ARRAY['paid_client'::text, 'live_preview'::text, 'viewer_only'::text, 'business_management'::text, 'admin'::text]))),
    CONSTRAINT valid_website_status CHECK ((website_status = ANY (ARRAY['pending'::text, 'design'::text, 'development'::text, 'review'::text, 'live'::text, 'not_published'::text])))
);


--
-- Name: proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lead_id uuid,
    deal_id uuid,
    proposal_number text NOT NULL,
    template_type text DEFAULT 'website_design'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    client_name text,
    client_email text,
    client_company text,
    client_phone text,
    title text DEFAULT 'Proposal'::text NOT NULL,
    introduction text,
    scope_items jsonb DEFAULT '[]'::jsonb,
    pricing_items jsonb DEFAULT '[]'::jsonb,
    total_amount numeric DEFAULT 0,
    currency text DEFAULT 'GBP'::text,
    valid_until date,
    terms text,
    notes text,
    accepted_at timestamp with time zone,
    accepted_by_name text,
    accepted_by_email text,
    accepted_ip text,
    acceptance_token uuid DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_at timestamp with time zone,
    crm_company_id uuid,
    crm_contact_id uuid,
    crm_opportunity_id uuid
);


--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    ip_address text,
    user_id uuid,
    endpoint text NOT NULL,
    attempts integer DEFAULT 1 NOT NULL,
    window_start timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rbac_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rbac_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    performed_by uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_value jsonb,
    new_value jsonb,
    details text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rbac_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rbac_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    module text NOT NULL,
    action text NOT NULL,
    granted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rbac_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rbac_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    color text DEFAULT '#99AAB5'::text,
    "position" integer DEFAULT 0,
    hoist boolean DEFAULT false,
    icon text
);


--
-- Name: rbac_user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rbac_user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: resource_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    deal_id uuid,
    user_id uuid NOT NULL,
    assigned_to text NOT NULL,
    hours_allocated numeric DEFAULT 0 NOT NULL,
    hours_spent numeric DEFAULT 0 NOT NULL,
    week_start date NOT NULL,
    task_description text,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'planned'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: security_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event_type text NOT NULL,
    portal_attempted text,
    actual_role text,
    ip_address text,
    user_agent text,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: site_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    visitor_id uuid,
    user_id uuid NOT NULL,
    service_name text NOT NULL,
    booking_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone,
    duration_minutes integer DEFAULT 60,
    price numeric(10,2),
    currency text DEFAULT 'GBP'::text,
    status text DEFAULT 'pending'::text,
    customer_name text,
    customer_email text,
    customer_phone text,
    notes text,
    payment_intent_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT site_bookings_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'no_show'::text])))
);


--
-- Name: site_carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    session_id text NOT NULL,
    visitor_email text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    subtotal numeric(10,2) DEFAULT 0,
    currency text DEFAULT 'GBP'::text,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT site_carts_status_check CHECK ((status = ANY (ARRAY['active'::text, 'abandoned'::text, 'converted'::text])))
);


--
-- Name: site_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_key text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: site_deployments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_deployments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    version_number integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    subdomain text,
    custom_domain text,
    live_url text,
    storage_path text,
    file_count integer DEFAULT 0,
    total_size_bytes bigint DEFAULT 0,
    build_log jsonb DEFAULT '[]'::jsonb,
    page_count integer DEFAULT 0,
    deployed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: site_domains; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_domains (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    domain_type text DEFAULT 'subdomain'::text NOT NULL,
    domain_name text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    dns_verified boolean DEFAULT false,
    ssl_active boolean DEFAULT false,
    dns_instructions jsonb,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: site_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    order_number text NOT NULL,
    customer_email text NOT NULL,
    customer_name text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0,
    shipping_amount numeric(10,2) DEFAULT 0,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    currency text DEFAULT 'GBP'::text,
    status text DEFAULT 'pending'::text,
    payment_intent_id text,
    shipping_address jsonb,
    billing_address jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT site_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text, 'refunded'::text])))
);


--
-- Name: site_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    inv_product_id uuid,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric DEFAULT 0 NOT NULL,
    compare_at_price numeric,
    currency text DEFAULT 'GBP'::text NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    category text,
    tags text[] DEFAULT '{}'::text[],
    sort_order integer DEFAULT 0,
    track_inventory boolean DEFAULT true,
    inventory_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: site_visitors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_visitors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    phone text,
    password_hash text,
    is_verified boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: social_media_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_media_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    platform text NOT NULL,
    account_handle text NOT NULL,
    account_name text,
    profile_url text,
    managed_by text DEFAULT 'Echelon Team'::text,
    posting_frequency text DEFAULT 'Weekly'::text,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT social_media_accounts_platform_check CHECK ((platform = ANY (ARRAY['instagram'::text, 'facebook'::text, 'tiktok'::text, 'linkedin'::text, 'twitter'::text, 'youtube'::text]))),
    CONSTRAINT social_media_accounts_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'disconnected'::text])))
);


--
-- Name: social_media_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_media_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text,
    media_url text,
    media_type text DEFAULT 'image'::text,
    scheduled_at timestamp with time zone,
    posted_at timestamp with time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT social_media_posts_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text, 'carousel'::text, 'story'::text, 'reel'::text]))),
    CONSTRAINT social_media_posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'posted'::text, 'failed'::text])))
);


--
-- Name: sticky_walls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sticky_walls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'Untitled Wall'::text NOT NULL,
    is_starred boolean DEFAULT false NOT NULL,
    notes jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: storage_quotas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.storage_quotas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    quota_bytes bigint DEFAULT '5368709120'::bigint NOT NULL,
    used_bytes bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subscription_site_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_site_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_site_id uuid NOT NULL,
    event_type text NOT NULL,
    detail jsonb,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    actor_user_id uuid,
    actor text,
    CONSTRAINT subscription_site_events_event_type_check CHECK ((event_type = ANY (ARRAY['created'::text, 'paused'::text, 'resumed'::text, 'cancelled'::text, 'payment_failed'::text, 'renewed'::text, 'hero_image_updated'::text, 'hosting_status_changed'::text, 'notes_updated'::text, 'edited'::text])))
);


--
-- Name: subscription_sites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_sites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_user_id uuid NOT NULL,
    client_company_id uuid,
    client_name text,
    site_name text NOT NULL,
    site_url text,
    hero_image_url text,
    template_used text,
    status text DEFAULT 'trial'::text NOT NULL,
    billing_amount numeric(12,2) DEFAULT 0,
    billing_currency text DEFAULT 'GBP'::text,
    billing_cycle text DEFAULT 'monthly'::text,
    subscription_start_date date,
    next_billing_date date,
    next_renewal_date date,
    hosting_provider text DEFAULT 'vercel'::text,
    hosting_status text DEFAULT 'not_deployed'::text NOT NULL,
    is_hosted_only boolean DEFAULT false NOT NULL,
    account_manager_user_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    acc_org_id uuid,
    acc_customer_id uuid,
    acc_revenue_account_id uuid,
    auto_invoice boolean DEFAULT false NOT NULL,
    last_invoiced_on date,
    CONSTRAINT subscription_sites_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'annual'::text]))),
    CONSTRAINT subscription_sites_hosting_provider_check CHECK ((hosting_provider = ANY (ARRAY['vercel'::text, 'netlify'::text, 'cloudflare'::text, 'other'::text]))),
    CONSTRAINT subscription_sites_hosting_status_check CHECK ((hosting_status = ANY (ARRAY['live'::text, 'building'::text, 'error'::text, 'not_deployed'::text]))),
    CONSTRAINT subscription_sites_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'cancelled'::text, 'trial'::text])))
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reference_id text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    priority text DEFAULT 'standard'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    ai_conversation_id uuid,
    message_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: team_branding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_branding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    manager_id uuid NOT NULL,
    default_logo_url text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: team_inbox_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_inbox_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    last_active_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: team_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    member_role text DEFAULT 'member'::text NOT NULL,
    display_name text,
    invited_by uuid,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT team_memberships_member_role_check CHECK ((member_role = ANY (ARRAY['owner'::text, 'financial'::text, 'project'::text])))
);


--
-- Name: time_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    task text DEFAULT ''::text NOT NULL,
    project text DEFAULT ''::text NOT NULL,
    project_color text DEFAULT '#3b82f6'::text,
    client text DEFAULT ''::text,
    tags text[] DEFAULT '{}'::text[],
    start_time timestamp with time zone DEFAULT now() NOT NULL,
    duration_minutes integer DEFAULT 0 NOT NULL,
    billable boolean DEFAULT true,
    rate numeric DEFAULT 0,
    notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: two_factor_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.two_factor_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    ip_address text,
    attempt_type text DEFAULT 'verify'::text NOT NULL,
    success boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    feature_name text NOT NULL,
    visited_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_branding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_branding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    logo_url text,
    hide_platform_badge boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_calendars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_calendars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'My Calendar'::text NOT NULL,
    color text DEFAULT '#3b82f6'::text NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider text NOT NULL,
    credentials jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_connected boolean DEFAULT false NOT NULL,
    connected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_onboarding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_onboarding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    completed_profile boolean DEFAULT false NOT NULL,
    explored_website boolean DEFAULT false NOT NULL,
    sent_message boolean DEFAULT false NOT NULL,
    uploaded_file boolean DEFAULT false NOT NULL,
    checked_calendar boolean DEFAULT false NOT NULL,
    dismissed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_sidebar_layout; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sidebar_layout (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    layout_data jsonb DEFAULT '{"folders": [], "itemOrder": []}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vault_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vault_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    password_hash text NOT NULL,
    totp_secret_encrypted text NOT NULL,
    security_questions jsonb DEFAULT '[]'::jsonb NOT NULL,
    master_key_hash text NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    failed_attempts integer DEFAULT 0 NOT NULL,
    last_failed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vault_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vault_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    item_type text DEFAULT 'file'::text NOT NULL,
    name_encrypted text NOT NULL,
    description_encrypted text,
    content_encrypted text,
    file_path text,
    file_size bigint DEFAULT 0,
    mime_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: whitelisted_ips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whitelisted_ips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_address text NOT NULL,
    added_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wiki_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wiki_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text DEFAULT ''::text,
    category text DEFAULT 'Processes'::text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    is_starred boolean DEFAULT false,
    last_edited_by text DEFAULT ''::text,
    status text DEFAULT 'published'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: workflow_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'running'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    trigger_data jsonb DEFAULT '{}'::jsonb,
    node_results jsonb DEFAULT '[]'::jsonb,
    error text,
    duration_ms integer
);


--
-- Name: workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'Untitled Workflow'::text NOT NULL,
    description text,
    nodes jsonb DEFAULT '[]'::jsonb NOT NULL,
    connections jsonb DEFAULT '[]'::jsonb NOT NULL,
    viewport jsonb DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    workflow_type text DEFAULT 'execute'::text NOT NULL,
    template_id text,
    last_run_at timestamp with time zone,
    run_count integer DEFAULT 0 NOT NULL
);


--
-- Name: acc_accountant_invites acc_accountant_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_accountant_invites
    ADD CONSTRAINT acc_accountant_invites_pkey PRIMARY KEY (id);


--
-- Name: acc_accountant_invites acc_accountant_invites_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_accountant_invites
    ADD CONSTRAINT acc_accountant_invites_token_key UNIQUE (token);


--
-- Name: acc_accounting_periods acc_accounting_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_accounting_periods
    ADD CONSTRAINT acc_accounting_periods_pkey PRIMARY KEY (id);


--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_bill_id_line_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bill_lines
    ADD CONSTRAINT acc_ap_bill_lines_bill_id_line_no_key UNIQUE (bill_id, line_no);


--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bill_lines
    ADD CONSTRAINT acc_ap_bill_lines_pkey PRIMARY KEY (id);


--
-- Name: acc_ap_bills acc_ap_bills_org_id_bill_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_org_id_bill_number_key UNIQUE (org_id, bill_number);


--
-- Name: acc_ap_bills acc_ap_bills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_pkey PRIMARY KEY (id);


--
-- Name: acc_ap_payments acc_ap_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_payments
    ADD CONSTRAINT acc_ap_payments_pkey PRIMARY KEY (id);


--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_invoice_id_line_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoice_lines
    ADD CONSTRAINT acc_ar_invoice_lines_invoice_id_line_no_key UNIQUE (invoice_id, line_no);


--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoice_lines
    ADD CONSTRAINT acc_ar_invoice_lines_pkey PRIMARY KEY (id);


--
-- Name: acc_ar_invoices acc_ar_invoices_org_id_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_org_id_invoice_number_key UNIQUE (org_id, invoice_number);


--
-- Name: acc_ar_invoices acc_ar_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_pkey PRIMARY KEY (id);


--
-- Name: acc_ar_payments acc_ar_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_payments
    ADD CONSTRAINT acc_ar_payments_pkey PRIMARY KEY (id);


--
-- Name: acc_audit_log acc_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_audit_log
    ADD CONSTRAINT acc_audit_log_pkey PRIMARY KEY (id);


--
-- Name: acc_bank_accounts acc_bank_accounts_org_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_accounts
    ADD CONSTRAINT acc_bank_accounts_org_id_name_key UNIQUE (org_id, name);


--
-- Name: acc_bank_accounts acc_bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_accounts
    ADD CONSTRAINT acc_bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: acc_bank_reconciliations acc_bank_reconciliations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_reconciliations
    ADD CONSTRAINT acc_bank_reconciliations_pkey PRIMARY KEY (id);


--
-- Name: acc_bank_transactions acc_bank_transactions_bank_account_id_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_transactions
    ADD CONSTRAINT acc_bank_transactions_bank_account_id_external_id_key UNIQUE (bank_account_id, external_id);


--
-- Name: acc_bank_transactions acc_bank_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_transactions
    ADD CONSTRAINT acc_bank_transactions_pkey PRIMARY KEY (id);


--
-- Name: acc_chart_of_accounts acc_chart_of_accounts_org_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_chart_of_accounts
    ADD CONSTRAINT acc_chart_of_accounts_org_id_code_key UNIQUE (org_id, code);


--
-- Name: acc_chart_of_accounts acc_chart_of_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_chart_of_accounts
    ADD CONSTRAINT acc_chart_of_accounts_pkey PRIMARY KEY (id);


--
-- Name: acc_customers acc_customers_org_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_org_id_name_key UNIQUE (org_id, name);


--
-- Name: acc_customers acc_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_pkey PRIMARY KEY (id);


--
-- Name: acc_depreciation_lines acc_depreciation_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_lines
    ADD CONSTRAINT acc_depreciation_lines_pkey PRIMARY KEY (id);


--
-- Name: acc_depreciation_lines acc_depreciation_lines_run_id_asset_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_lines
    ADD CONSTRAINT acc_depreciation_lines_run_id_asset_id_key UNIQUE (run_id, asset_id);


--
-- Name: acc_depreciation_runs acc_depreciation_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_runs
    ADD CONSTRAINT acc_depreciation_runs_pkey PRIMARY KEY (id);


--
-- Name: acc_employees acc_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_employees
    ADD CONSTRAINT acc_employees_pkey PRIMARY KEY (id);


--
-- Name: acc_fixed_assets acc_fixed_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_pkey PRIMARY KEY (id);


--
-- Name: acc_fx_rates acc_fx_rates_org_id_rate_date_from_currency_to_currency_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fx_rates
    ADD CONSTRAINT acc_fx_rates_org_id_rate_date_from_currency_to_currency_key UNIQUE (org_id, rate_date, from_currency, to_currency);


--
-- Name: acc_fx_rates acc_fx_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fx_rates
    ADD CONSTRAINT acc_fx_rates_pkey PRIMARY KEY (id);


--
-- Name: acc_journal_entries acc_journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_entries
    ADD CONSTRAINT acc_journal_entries_pkey PRIMARY KEY (id);


--
-- Name: acc_journal_lines acc_journal_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_lines
    ADD CONSTRAINT acc_journal_lines_pkey PRIMARY KEY (id);


--
-- Name: acc_org_members acc_org_members_org_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_org_members
    ADD CONSTRAINT acc_org_members_org_id_user_id_key UNIQUE (org_id, user_id);


--
-- Name: acc_org_members acc_org_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_org_members
    ADD CONSTRAINT acc_org_members_pkey PRIMARY KEY (id);


--
-- Name: acc_organizations acc_organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_organizations
    ADD CONSTRAINT acc_organizations_pkey PRIMARY KEY (id);


--
-- Name: acc_pay_runs acc_pay_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_pay_runs
    ADD CONSTRAINT acc_pay_runs_pkey PRIMARY KEY (id);


--
-- Name: acc_payslips acc_payslips_pay_run_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_payslips
    ADD CONSTRAINT acc_payslips_pay_run_id_employee_id_key UNIQUE (pay_run_id, employee_id);


--
-- Name: acc_payslips acc_payslips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_payslips
    ADD CONSTRAINT acc_payslips_pkey PRIMARY KEY (id);


--
-- Name: acc_report_recalcs acc_report_recalcs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_report_recalcs
    ADD CONSTRAINT acc_report_recalcs_pkey PRIMARY KEY (id);


--
-- Name: acc_suppliers acc_suppliers_org_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_suppliers
    ADD CONSTRAINT acc_suppliers_org_id_name_key UNIQUE (org_id, name);


--
-- Name: acc_suppliers acc_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_suppliers
    ADD CONSTRAINT acc_suppliers_pkey PRIMARY KEY (id);


--
-- Name: acc_user_roles acc_user_roles_org_id_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_user_roles
    ADD CONSTRAINT acc_user_roles_org_id_user_id_role_key UNIQUE (org_id, user_id, role);


--
-- Name: acc_user_roles acc_user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_user_roles
    ADD CONSTRAINT acc_user_roles_pkey PRIMARY KEY (id);


--
-- Name: acc_vat_returns acc_vat_returns_period_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_vat_returns
    ADD CONSTRAINT acc_vat_returns_period_unique UNIQUE (org_id, period_start, period_end);


--
-- Name: acc_vat_returns acc_vat_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_vat_returns
    ADD CONSTRAINT acc_vat_returns_pkey PRIMARY KEY (id);


--
-- Name: account_type_presets account_type_presets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_type_presets
    ADD CONSTRAINT account_type_presets_pkey PRIMARY KEY (account_type);


--
-- Name: ad_campaigns ad_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_pkey PRIMARY KEY (id);


--
-- Name: ai_conversations ai_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_pkey PRIMARY KEY (id);


--
-- Name: ai_messages ai_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: app_projects app_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_projects
    ADD CONSTRAINT app_projects_pkey PRIMARY KEY (id);


--
-- Name: asset_folders asset_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_folders
    ADD CONSTRAINT asset_folders_pkey PRIMARY KEY (id);


--
-- Name: asset_tag_assignments asset_tag_assignments_asset_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_tag_assignments
    ADD CONSTRAINT asset_tag_assignments_asset_id_tag_id_key UNIQUE (asset_id, tag_id);


--
-- Name: asset_tag_assignments asset_tag_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_tag_assignments
    ADD CONSTRAINT asset_tag_assignments_pkey PRIMARY KEY (id);


--
-- Name: asset_tags asset_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_tags
    ADD CONSTRAINT asset_tags_pkey PRIMARY KEY (id);


--
-- Name: automation_rule_logs automation_rule_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rule_logs
    ADD CONSTRAINT automation_rule_logs_pkey PRIMARY KEY (id);


--
-- Name: automation_rules automation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_pkey PRIMARY KEY (id);


--
-- Name: automation_runs automation_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_runs
    ADD CONSTRAINT automation_runs_pkey PRIMARY KEY (id);


--
-- Name: automation_schedules automation_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_schedules
    ADD CONSTRAINT automation_schedules_pkey PRIMARY KEY (id);


--
-- Name: billing_audit_log billing_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_audit_log
    ADD CONSTRAINT billing_audit_log_pkey PRIMARY KEY (id);


--
-- Name: blocked_ips blocked_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_ips
    ADD CONSTRAINT blocked_ips_pkey PRIMARY KEY (id);


--
-- Name: booking_availability booking_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_availability
    ADD CONSTRAINT booking_availability_pkey PRIMARY KEY (id);


--
-- Name: booking_blocked_dates booking_blocked_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_blocked_dates
    ADD CONSTRAINT booking_blocked_dates_pkey PRIMARY KEY (id);


--
-- Name: booking_services booking_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT booking_services_pkey PRIMARY KEY (id);


--
-- Name: booking_settings booking_settings_business_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_settings
    ADD CONSTRAINT booking_settings_business_slug_key UNIQUE (business_slug);


--
-- Name: booking_settings booking_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_settings
    ADD CONSTRAINT booking_settings_pkey PRIMARY KEY (id);


--
-- Name: booking_settings booking_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_settings
    ADD CONSTRAINT booking_settings_user_id_key UNIQUE (user_id);


--
-- Name: booking_staff booking_staff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_staff
    ADD CONSTRAINT booking_staff_pkey PRIMARY KEY (id);


--
-- Name: booking_staff_services booking_staff_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_staff_services
    ADD CONSTRAINT booking_staff_services_pkey PRIMARY KEY (id);


--
-- Name: booking_staff_services booking_staff_services_staff_id_service_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_staff_services
    ADD CONSTRAINT booking_staff_services_staff_id_service_id_key UNIQUE (staff_id, service_id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: brand_settings brand_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_settings
    ADD CONSTRAINT brand_settings_pkey PRIMARY KEY (id);


--
-- Name: brand_settings brand_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_settings
    ADD CONSTRAINT brand_settings_user_id_key UNIQUE (user_id);


--
-- Name: business_reports business_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_reports
    ADD CONSTRAINT business_reports_pkey PRIMARY KEY (id);


--
-- Name: cad_autosaves cad_autosaves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_autosaves
    ADD CONSTRAINT cad_autosaves_pkey PRIMARY KEY (id);


--
-- Name: cad_project_versions cad_project_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_project_versions
    ADD CONSTRAINT cad_project_versions_pkey PRIMARY KEY (id);


--
-- Name: cad_projects cad_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_projects
    ADD CONSTRAINT cad_projects_pkey PRIMARY KEY (id);


--
-- Name: calculator_history calculator_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculator_history
    ADD CONSTRAINT calculator_history_pkey PRIMARY KEY (id);


--
-- Name: calendar_event_exceptions calendar_event_exceptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_event_exceptions
    ADD CONSTRAINT calendar_event_exceptions_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: call_sessions call_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_sessions
    ADD CONSTRAINT call_sessions_pkey PRIMARY KEY (id);


--
-- Name: client_assets client_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_assets
    ADD CONSTRAINT client_assets_pkey PRIMARY KEY (id);


--
-- Name: client_billing client_billing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_billing
    ADD CONSTRAINT client_billing_pkey PRIMARY KEY (id);


--
-- Name: client_contracts client_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_pkey PRIMARY KEY (id);


--
-- Name: client_invoices client_invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_invoices
    ADD CONSTRAINT client_invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: client_invoices client_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_invoices
    ADD CONSTRAINT client_invoices_pkey PRIMARY KEY (id);


--
-- Name: client_onboarding client_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_onboarding
    ADD CONSTRAINT client_onboarding_pkey PRIMARY KEY (id);


--
-- Name: client_pricing client_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_pricing
    ADD CONSTRAINT client_pricing_pkey PRIMARY KEY (id);


--
-- Name: client_teams client_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_teams
    ADD CONSTRAINT client_teams_pkey PRIMARY KEY (id);


--
-- Name: client_teams client_teams_team_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_teams
    ADD CONSTRAINT client_teams_team_code_key UNIQUE (team_code);


--
-- Name: cms_collections cms_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_collections
    ADD CONSTRAINT cms_collections_pkey PRIMARY KEY (id);


--
-- Name: cms_collections cms_collections_site_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_collections
    ADD CONSTRAINT cms_collections_site_id_slug_key UNIQUE (site_id, slug);


--
-- Name: cms_entries cms_entries_collection_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_entries
    ADD CONSTRAINT cms_entries_collection_id_slug_key UNIQUE (collection_id, slug);


--
-- Name: cms_entries cms_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_entries
    ADD CONSTRAINT cms_entries_pkey PRIMARY KEY (id);


--
-- Name: comm_channel_members comm_channel_members_channel_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channel_members
    ADD CONSTRAINT comm_channel_members_channel_id_user_id_key UNIQUE (channel_id, user_id);


--
-- Name: comm_channel_members comm_channel_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channel_members
    ADD CONSTRAINT comm_channel_members_pkey PRIMARY KEY (id);


--
-- Name: comm_channels comm_channels_join_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channels
    ADD CONSTRAINT comm_channels_join_code_key UNIQUE (join_code);


--
-- Name: comm_channels comm_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channels
    ADD CONSTRAINT comm_channels_pkey PRIMARY KEY (id);


--
-- Name: comm_channels comm_channels_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channels
    ADD CONSTRAINT comm_channels_slug_key UNIQUE (slug);


--
-- Name: comm_messages comm_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_messages
    ADD CONSTRAINT comm_messages_pkey PRIMARY KEY (id);


--
-- Name: comm_presence comm_presence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_presence
    ADD CONSTRAINT comm_presence_pkey PRIMARY KEY (id);


--
-- Name: comm_presence comm_presence_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_presence
    ADD CONSTRAINT comm_presence_user_id_key UNIQUE (user_id);


--
-- Name: comm_reactions comm_reactions_message_id_user_id_emoji_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_reactions
    ADD CONSTRAINT comm_reactions_message_id_user_id_emoji_key UNIQUE (message_id, user_id, emoji);


--
-- Name: comm_reactions comm_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_reactions
    ADD CONSTRAINT comm_reactions_pkey PRIMARY KEY (id);


--
-- Name: comm_read_receipts comm_read_receipts_channel_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_read_receipts
    ADD CONSTRAINT comm_read_receipts_channel_id_user_id_key UNIQUE (channel_id, user_id);


--
-- Name: comm_read_receipts comm_read_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_read_receipts
    ADD CONSTRAINT comm_read_receipts_pkey PRIMARY KEY (id);


--
-- Name: comm_user_settings comm_user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_user_settings
    ADD CONSTRAINT comm_user_settings_pkey PRIMARY KEY (id);


--
-- Name: comm_user_settings comm_user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_user_settings
    ADD CONSTRAINT comm_user_settings_user_id_key UNIQUE (user_id);


--
-- Name: content_requests content_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_requests
    ADD CONSTRAINT content_requests_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_customer_id_key UNIQUE (customer_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: crm_activity_participants crm_activity_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_activity_participants
    ADD CONSTRAINT crm_activity_participants_pkey PRIMARY KEY (id);


--
-- Name: crm_communication_attachments crm_communication_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_communication_attachments
    ADD CONSTRAINT crm_communication_attachments_pkey PRIMARY KEY (id);


--
-- Name: crm_communications crm_communications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_communications
    ADD CONSTRAINT crm_communications_pkey PRIMARY KEY (id);


--
-- Name: crm_companies crm_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_companies
    ADD CONSTRAINT crm_companies_pkey PRIMARY KEY (id);


--
-- Name: crm_contacts crm_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contacts
    ADD CONSTRAINT crm_contacts_pkey PRIMARY KEY (id);


--
-- Name: crm_deal_activities crm_deal_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_deal_activities
    ADD CONSTRAINT crm_deal_activities_pkey PRIMARY KEY (id);


--
-- Name: crm_deals crm_deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_deals
    ADD CONSTRAINT crm_deals_pkey PRIMARY KEY (id);


--
-- Name: crm_financial_links crm_financial_links_entity_type_entity_id_finance_type_fina_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_financial_links
    ADD CONSTRAINT crm_financial_links_entity_type_entity_id_finance_type_fina_key UNIQUE (entity_type, entity_id, finance_type, finance_id);


--
-- Name: crm_financial_links crm_financial_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_financial_links
    ADD CONSTRAINT crm_financial_links_pkey PRIMARY KEY (id);


--
-- Name: crm_lifecycle_history crm_lifecycle_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_lifecycle_history
    ADD CONSTRAINT crm_lifecycle_history_pkey PRIMARY KEY (id);


--
-- Name: crm_lifecycle_stages crm_lifecycle_stages_org_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_lifecycle_stages
    ADD CONSTRAINT crm_lifecycle_stages_org_id_slug_key UNIQUE (org_id, slug);


--
-- Name: crm_lifecycle_stages crm_lifecycle_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_lifecycle_stages
    ADD CONSTRAINT crm_lifecycle_stages_pkey PRIMARY KEY (id);


--
-- Name: crm_opportunities crm_opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_opportunities
    ADD CONSTRAINT crm_opportunities_pkey PRIMARY KEY (id);


--
-- Name: crm_workflow_runs crm_workflow_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_workflow_runs
    ADD CONSTRAINT crm_workflow_runs_pkey PRIMARY KEY (id);


--
-- Name: crm_workflows crm_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_workflows
    ADD CONSTRAINT crm_workflows_pkey PRIMARY KEY (id);


--
-- Name: customer_uploads customer_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_uploads
    ADD CONSTRAINT customer_uploads_pkey PRIMARY KEY (id);


--
-- Name: dashboard_metrics_cache dashboard_metrics_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_metrics_cache
    ADD CONSTRAINT dashboard_metrics_cache_pkey PRIMARY KEY (id);


--
-- Name: dashboard_metrics_cache dashboard_metrics_cache_user_id_metric_key_period_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_metrics_cache
    ADD CONSTRAINT dashboard_metrics_cache_user_id_metric_key_period_key UNIQUE (user_id, metric_key, period);


--
-- Name: designer_assets designer_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designer_assets
    ADD CONSTRAINT designer_assets_pkey PRIMARY KEY (id);


--
-- Name: designer_components designer_components_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designer_components
    ADD CONSTRAINT designer_components_pkey PRIMARY KEY (id);


--
-- Name: designer_pages designer_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designer_pages
    ADD CONSTRAINT designer_pages_pkey PRIMARY KEY (id);


--
-- Name: designer_sites designer_sites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designer_sites
    ADD CONSTRAINT designer_sites_pkey PRIMARY KEY (id);


--
-- Name: document_comments document_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT document_comments_pkey PRIMARY KEY (id);


--
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);


--
-- Name: ecommerce_orders ecommerce_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecommerce_orders
    ADD CONSTRAINT ecommerce_orders_pkey PRIMARY KEY (id);


--
-- Name: ecommerce_settings ecommerce_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecommerce_settings
    ADD CONSTRAINT ecommerce_settings_pkey PRIMARY KEY (id);


--
-- Name: ecommerce_settings ecommerce_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecommerce_settings
    ADD CONSTRAINT ecommerce_settings_user_id_key UNIQUE (user_id);


--
-- Name: email_accounts email_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_accounts
    ADD CONSTRAINT email_accounts_pkey PRIMARY KEY (id);


--
-- Name: email_drafts email_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_drafts
    ADD CONSTRAINT email_drafts_pkey PRIMARY KEY (id);


--
-- Name: email_messages email_messages_account_id_provider_message_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_account_id_provider_message_id_key UNIQUE (account_id, provider_message_id);


--
-- Name: email_messages email_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_pkey PRIMARY KEY (id);


--
-- Name: enquiries enquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: greeting_messages greeting_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.greeting_messages
    ADD CONSTRAINT greeting_messages_pkey PRIMARY KEY (id);


--
-- Name: greeting_messages greeting_messages_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.greeting_messages
    ADD CONSTRAINT greeting_messages_user_id_key UNIQUE (user_id);


--
-- Name: hr_candidates hr_candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_candidates
    ADD CONSTRAINT hr_candidates_pkey PRIMARY KEY (id);


--
-- Name: hr_employees hr_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_employees
    ADD CONSTRAINT hr_employees_pkey PRIMARY KEY (id);


--
-- Name: hr_performance_reviews hr_performance_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_performance_reviews
    ADD CONSTRAINT hr_performance_reviews_pkey PRIMARY KEY (id);


--
-- Name: hr_time_off_requests hr_time_off_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_time_off_requests
    ADD CONSTRAINT hr_time_off_requests_pkey PRIMARY KEY (id);


--
-- Name: inv_categories inv_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_categories
    ADD CONSTRAINT inv_categories_pkey PRIMARY KEY (id);


--
-- Name: inv_companies inv_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_companies
    ADD CONSTRAINT inv_companies_pkey PRIMARY KEY (id);


--
-- Name: inv_locations inv_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_locations
    ADD CONSTRAINT inv_locations_pkey PRIMARY KEY (id);


--
-- Name: inv_products inv_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_products
    ADD CONSTRAINT inv_products_pkey PRIMARY KEY (id);


--
-- Name: inv_products inv_products_user_id_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_products
    ADD CONSTRAINT inv_products_user_id_sku_key UNIQUE (user_id, sku);


--
-- Name: inv_settings inv_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_settings
    ADD CONSTRAINT inv_settings_pkey PRIMARY KEY (id);


--
-- Name: inv_settings inv_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_settings
    ADD CONSTRAINT inv_settings_user_id_key UNIQUE (user_id);


--
-- Name: inv_stock_count_items inv_stock_count_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_count_items
    ADD CONSTRAINT inv_stock_count_items_pkey PRIMARY KEY (id);


--
-- Name: inv_stock_counts inv_stock_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_counts
    ADD CONSTRAINT inv_stock_counts_pkey PRIMARY KEY (id);


--
-- Name: inv_stock_levels inv_stock_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_levels
    ADD CONSTRAINT inv_stock_levels_pkey PRIMARY KEY (id);


--
-- Name: inv_stock_levels inv_stock_levels_product_id_location_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_levels
    ADD CONSTRAINT inv_stock_levels_product_id_location_id_key UNIQUE (product_id, location_id);


--
-- Name: inv_stock_movements inv_stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_movements
    ADD CONSTRAINT inv_stock_movements_pkey PRIMARY KEY (id);


--
-- Name: knowledge_base knowledge_base_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_pkey PRIMARY KEY (id);


--
-- Name: kpi_goals kpi_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_goals
    ADD CONSTRAINT kpi_goals_pkey PRIMARY KEY (id);


--
-- Name: lead_imports lead_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_imports
    ADD CONSTRAINT lead_imports_pkey PRIMARY KEY (id);


--
-- Name: lead_notes lead_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_pkey PRIMARY KEY (id);


--
-- Name: lead_status_history lead_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: marketing_page_views marketing_page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_page_views
    ADD CONSTRAINT marketing_page_views_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: office_documents office_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_documents
    ADD CONSTRAINT office_documents_pkey PRIMARY KEY (id);


--
-- Name: office_poll_options office_poll_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_options
    ADD CONSTRAINT office_poll_options_pkey PRIMARY KEY (id);


--
-- Name: office_poll_votes office_poll_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_votes
    ADD CONSTRAINT office_poll_votes_pkey PRIMARY KEY (id);


--
-- Name: office_poll_votes office_poll_votes_poll_id_voter_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_votes
    ADD CONSTRAINT office_poll_votes_poll_id_voter_id_key UNIQUE (poll_id, voter_id);


--
-- Name: office_polls office_polls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_polls
    ADD CONSTRAINT office_polls_pkey PRIMARY KEY (id);


--
-- Name: password_vault_configs password_vault_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_vault_configs
    ADD CONSTRAINT password_vault_configs_pkey PRIMARY KEY (id);


--
-- Name: password_vault_items password_vault_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_vault_items
    ADD CONSTRAINT password_vault_items_pkey PRIMARY KEY (id);


--
-- Name: planner_tasks planner_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_tasks
    ADD CONSTRAINT planner_tasks_pkey PRIMARY KEY (id);


--
-- Name: platform_files platform_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_files
    ADD CONSTRAINT platform_files_pkey PRIMARY KEY (id);


--
-- Name: platform_folders platform_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_folders
    ADD CONSTRAINT platform_folders_pkey PRIMARY KEY (id);


--
-- Name: platform_folders platform_folders_user_id_full_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_folders
    ADD CONSTRAINT platform_folders_user_id_full_path_key UNIQUE (user_id, full_path);


--
-- Name: poll_votes poll_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_pkey PRIMARY KEY (id);


--
-- Name: poll_votes poll_votes_poll_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_poll_id_user_id_key UNIQUE (poll_id, user_id);


--
-- Name: pomodoro_sessions pomodoro_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_customer_id_key UNIQUE (customer_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: profiles profiles_verification_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_verification_token_key UNIQUE (verification_token);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: rate_limits rate_limits_key_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_key_endpoint_key UNIQUE (key, endpoint);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);


--
-- Name: rbac_audit_log rbac_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_audit_log
    ADD CONSTRAINT rbac_audit_log_pkey PRIMARY KEY (id);


--
-- Name: rbac_permissions rbac_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_permissions
    ADD CONSTRAINT rbac_permissions_pkey PRIMARY KEY (id);


--
-- Name: rbac_permissions rbac_permissions_role_id_module_action_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_permissions
    ADD CONSTRAINT rbac_permissions_role_id_module_action_key UNIQUE (role_id, module, action);


--
-- Name: rbac_roles rbac_roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_roles
    ADD CONSTRAINT rbac_roles_name_key UNIQUE (name);


--
-- Name: rbac_roles rbac_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_roles
    ADD CONSTRAINT rbac_roles_pkey PRIMARY KEY (id);


--
-- Name: rbac_user_roles rbac_user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_pkey PRIMARY KEY (id);


--
-- Name: rbac_user_roles rbac_user_roles_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_user_id_role_id_key UNIQUE (user_id, role_id);


--
-- Name: resource_allocations resource_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_allocations
    ADD CONSTRAINT resource_allocations_pkey PRIMARY KEY (id);


--
-- Name: security_logs security_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_pkey PRIMARY KEY (id);


--
-- Name: site_bookings site_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_bookings
    ADD CONSTRAINT site_bookings_pkey PRIMARY KEY (id);


--
-- Name: site_carts site_carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_carts
    ADD CONSTRAINT site_carts_pkey PRIMARY KEY (id);


--
-- Name: site_content site_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_content
    ADD CONSTRAINT site_content_pkey PRIMARY KEY (id);


--
-- Name: site_content site_content_section_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_content
    ADD CONSTRAINT site_content_section_key_key UNIQUE (section_key);


--
-- Name: site_deployments site_deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_deployments
    ADD CONSTRAINT site_deployments_pkey PRIMARY KEY (id);


--
-- Name: site_domains site_domains_domain_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_domains
    ADD CONSTRAINT site_domains_domain_name_key UNIQUE (domain_name);


--
-- Name: site_domains site_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_domains
    ADD CONSTRAINT site_domains_pkey PRIMARY KEY (id);


--
-- Name: site_orders site_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_orders
    ADD CONSTRAINT site_orders_pkey PRIMARY KEY (id);


--
-- Name: site_products site_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_products
    ADD CONSTRAINT site_products_pkey PRIMARY KEY (id);


--
-- Name: site_products site_products_site_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_products
    ADD CONSTRAINT site_products_site_id_slug_key UNIQUE (site_id, slug);


--
-- Name: site_visitors site_visitors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_visitors
    ADD CONSTRAINT site_visitors_pkey PRIMARY KEY (id);


--
-- Name: site_visitors site_visitors_site_id_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_visitors
    ADD CONSTRAINT site_visitors_site_id_email_key UNIQUE (site_id, email);


--
-- Name: social_media_accounts social_media_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_accounts
    ADD CONSTRAINT social_media_accounts_pkey PRIMARY KEY (id);


--
-- Name: social_media_posts social_media_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_posts
    ADD CONSTRAINT social_media_posts_pkey PRIMARY KEY (id);


--
-- Name: sticky_walls sticky_walls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sticky_walls
    ADD CONSTRAINT sticky_walls_pkey PRIMARY KEY (id);


--
-- Name: storage_quotas storage_quotas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storage_quotas
    ADD CONSTRAINT storage_quotas_pkey PRIMARY KEY (id);


--
-- Name: storage_quotas storage_quotas_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storage_quotas
    ADD CONSTRAINT storage_quotas_user_id_key UNIQUE (user_id);


--
-- Name: subscription_site_events subscription_site_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_site_events
    ADD CONSTRAINT subscription_site_events_pkey PRIMARY KEY (id);


--
-- Name: subscription_sites subscription_sites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_sites
    ADD CONSTRAINT subscription_sites_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_reference_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_reference_id_key UNIQUE (reference_id);


--
-- Name: team_branding team_branding_manager_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_branding
    ADD CONSTRAINT team_branding_manager_id_key UNIQUE (manager_id);


--
-- Name: team_branding team_branding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_branding
    ADD CONSTRAINT team_branding_pkey PRIMARY KEY (id);


--
-- Name: team_inbox_settings team_inbox_settings_admin_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_inbox_settings
    ADD CONSTRAINT team_inbox_settings_admin_id_key UNIQUE (admin_id);


--
-- Name: team_inbox_settings team_inbox_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_inbox_settings
    ADD CONSTRAINT team_inbox_settings_pkey PRIMARY KEY (id);


--
-- Name: team_memberships team_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_memberships
    ADD CONSTRAINT team_memberships_pkey PRIMARY KEY (id);


--
-- Name: team_memberships team_memberships_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_memberships
    ADD CONSTRAINT team_memberships_team_id_user_id_key UNIQUE (team_id, user_id);


--
-- Name: time_entries time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_pkey PRIMARY KEY (id);


--
-- Name: two_factor_attempts two_factor_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.two_factor_attempts
    ADD CONSTRAINT two_factor_attempts_pkey PRIMARY KEY (id);


--
-- Name: user_activity_log user_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_log
    ADD CONSTRAINT user_activity_log_pkey PRIMARY KEY (id);


--
-- Name: user_branding user_branding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_branding
    ADD CONSTRAINT user_branding_pkey PRIMARY KEY (id);


--
-- Name: user_branding user_branding_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_branding
    ADD CONSTRAINT user_branding_user_id_key UNIQUE (user_id);


--
-- Name: user_calendars user_calendars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_calendars
    ADD CONSTRAINT user_calendars_pkey PRIMARY KEY (id);


--
-- Name: user_connections user_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_pkey PRIMARY KEY (id);


--
-- Name: user_connections user_connections_user_id_provider_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_user_id_provider_key UNIQUE (user_id, provider);


--
-- Name: user_onboarding user_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding
    ADD CONSTRAINT user_onboarding_pkey PRIMARY KEY (id);


--
-- Name: user_onboarding user_onboarding_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding
    ADD CONSTRAINT user_onboarding_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_sidebar_layout user_sidebar_layout_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sidebar_layout
    ADD CONSTRAINT user_sidebar_layout_pkey PRIMARY KEY (id);


--
-- Name: user_sidebar_layout user_sidebar_layout_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sidebar_layout
    ADD CONSTRAINT user_sidebar_layout_user_id_key UNIQUE (user_id);


--
-- Name: vault_configs vault_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_configs
    ADD CONSTRAINT vault_configs_pkey PRIMARY KEY (id);


--
-- Name: vault_items vault_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_items
    ADD CONSTRAINT vault_items_pkey PRIMARY KEY (id);


--
-- Name: whitelisted_ips whitelisted_ips_ip_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelisted_ips
    ADD CONSTRAINT whitelisted_ips_ip_address_key UNIQUE (ip_address);


--
-- Name: whitelisted_ips whitelisted_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelisted_ips
    ADD CONSTRAINT whitelisted_ips_pkey PRIMARY KEY (id);


--
-- Name: wiki_pages wiki_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT wiki_pages_pkey PRIMARY KEY (id);


--
-- Name: workflow_runs workflow_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_runs
    ADD CONSTRAINT workflow_runs_pkey PRIMARY KEY (id);


--
-- Name: workflows workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);


--
-- Name: acc_audit_org_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_audit_org_idx ON public.acc_audit_log USING btree (org_id, created_at DESC);


--
-- Name: acc_coa_org_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_coa_org_idx ON public.acc_chart_of_accounts USING btree (org_id);


--
-- Name: acc_inv_org_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_inv_org_idx ON public.acc_accountant_invites USING btree (org_id);


--
-- Name: acc_inv_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_inv_token_idx ON public.acc_accountant_invites USING btree (token);


--
-- Name: acc_je_org_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_je_org_date_idx ON public.acc_journal_entries USING btree (org_id, entry_date);


--
-- Name: acc_je_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_je_source_idx ON public.acc_journal_entries USING btree (source_type, source_id);


--
-- Name: acc_jl_account_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_jl_account_idx ON public.acc_journal_lines USING btree (account_id);


--
-- Name: acc_jl_entry_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_jl_entry_idx ON public.acc_journal_lines USING btree (journal_entry_id);


--
-- Name: acc_per_org_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_per_org_idx ON public.acc_accounting_periods USING btree (org_id, start_date);


--
-- Name: acc_report_recalcs_org_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_report_recalcs_org_time_idx ON public.acc_report_recalcs USING btree (org_id, computed_at DESC);


--
-- Name: ecommerce_orders_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ecommerce_orders_user_idx ON public.ecommerce_orders USING btree (user_id, created_at DESC);


--
-- Name: idx_2fa_attempts_user_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_2fa_attempts_user_time ON public.two_factor_attempts USING btree (user_id, created_at DESC);


--
-- Name: idx_acc_ap_bills_org_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_ap_bills_org_status ON public.acc_ap_bills USING btree (org_id, status);


--
-- Name: idx_acc_ap_bills_supplier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_ap_bills_supplier ON public.acc_ap_bills USING btree (supplier_id);


--
-- Name: idx_acc_ar_invoices_crm_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_ar_invoices_crm_company ON public.acc_ar_invoices USING btree (crm_company_id);


--
-- Name: idx_acc_ar_invoices_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_ar_invoices_customer ON public.acc_ar_invoices USING btree (customer_id);


--
-- Name: idx_acc_ar_invoices_org_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_ar_invoices_org_status ON public.acc_ar_invoices USING btree (org_id, status);


--
-- Name: idx_acc_ar_invoices_subscription_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_ar_invoices_subscription_site ON public.acc_ar_invoices USING btree (subscription_site_id) WHERE (subscription_site_id IS NOT NULL);


--
-- Name: idx_acc_bank_txn_account_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_bank_txn_account_date ON public.acc_bank_transactions USING btree (bank_account_id, txn_date DESC);


--
-- Name: idx_acc_bank_txn_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_bank_txn_status ON public.acc_bank_transactions USING btree (bank_account_id, status);


--
-- Name: idx_acc_customers_crm_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_customers_crm_company ON public.acc_customers USING btree (crm_company_id);


--
-- Name: idx_ad_campaigns_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_campaigns_platform ON public.ad_campaigns USING btree (platform);


--
-- Name: idx_ad_campaigns_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns USING btree (status);


--
-- Name: idx_ad_campaigns_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_campaigns_user_id ON public.ad_campaigns USING btree (user_id);


--
-- Name: idx_ai_conversations_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversations_updated_at ON public.ai_conversations USING btree (user_id, updated_at DESC);


--
-- Name: idx_ai_conversations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations USING btree (user_id);


--
-- Name: idx_ai_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages USING btree (conversation_id);


--
-- Name: idx_ai_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_messages_created_at ON public.ai_messages USING btree (conversation_id, created_at);


--
-- Name: idx_api_keys_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_user ON public.api_keys USING btree (user_id);


--
-- Name: idx_app_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_projects_status ON public.app_projects USING btree (status);


--
-- Name: idx_app_projects_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_projects_user_id ON public.app_projects USING btree (user_id);


--
-- Name: idx_asset_folders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asset_folders_user ON public.asset_folders USING btree (user_id);


--
-- Name: idx_asset_tags_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asset_tags_user ON public.asset_tags USING btree (user_id);


--
-- Name: idx_automation_rule_logs_executed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_rule_logs_executed_at ON public.automation_rule_logs USING btree (executed_at DESC);


--
-- Name: idx_automation_rule_logs_rule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_rule_logs_rule_id ON public.automation_rule_logs USING btree (rule_id);


--
-- Name: idx_automation_rules_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_rules_active ON public.automation_rules USING btree (is_active);


--
-- Name: idx_automation_runs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_runs_user ON public.automation_runs USING btree (user_id);


--
-- Name: idx_automation_runs_workflow; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_runs_workflow ON public.automation_runs USING btree (workflow_id);


--
-- Name: idx_automation_schedules_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_schedules_user ON public.automation_schedules USING btree (user_id);


--
-- Name: idx_blocked_ips_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blocked_ips_expires ON public.blocked_ips USING btree (expires_at) WHERE (expires_at IS NOT NULL);


--
-- Name: idx_blocked_ips_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blocked_ips_ip ON public.blocked_ips USING btree (ip_address);


--
-- Name: idx_booking_availability_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_availability_user ON public.booking_availability USING btree (user_id, staff_id, day_of_week);


--
-- Name: idx_booking_services_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_services_user ON public.booking_services USING btree (user_id);


--
-- Name: idx_booking_settings_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_settings_slug ON public.booking_settings USING btree (business_slug);


--
-- Name: idx_booking_staff_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_staff_user ON public.booking_staff USING btree (user_id);


--
-- Name: idx_bookings_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_source ON public.bookings USING btree (user_id, source);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (user_id, status);


--
-- Name: idx_bookings_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_user_date ON public.bookings USING btree (user_id, booking_date);


--
-- Name: idx_brand_settings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brand_settings_user ON public.brand_settings USING btree (user_id);


--
-- Name: idx_business_reports_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_reports_user ON public.business_reports USING btree (user_id);


--
-- Name: idx_cad_autosaves_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cad_autosaves_user_id ON public.cad_autosaves USING btree (user_id);


--
-- Name: idx_cad_project_versions_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cad_project_versions_project_id ON public.cad_project_versions USING btree (project_id);


--
-- Name: idx_cad_projects_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cad_projects_user_id ON public.cad_projects USING btree (user_id);


--
-- Name: idx_calendar_events_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_events_start_time ON public.calendar_events USING btree (start_time);


--
-- Name: idx_calendar_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_events_user_id ON public.calendar_events USING btree (user_id);


--
-- Name: idx_client_assets_folder; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_assets_folder ON public.client_assets USING btree (folder_id);


--
-- Name: idx_client_assets_folder_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_assets_folder_id ON public.client_assets USING btree (folder_id);


--
-- Name: idx_client_assets_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_assets_user ON public.client_assets USING btree (user_id);


--
-- Name: idx_client_assets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_assets_user_id ON public.client_assets USING btree (user_id);


--
-- Name: idx_client_contracts_crm_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_contracts_crm_company ON public.client_contracts USING btree (crm_company_id);


--
-- Name: idx_client_invoices_crm_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_invoices_crm_company ON public.client_invoices USING btree (crm_company_id);


--
-- Name: idx_client_onboarding_deal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_onboarding_deal ON public.client_onboarding USING btree (deal_id);


--
-- Name: idx_client_onboarding_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_onboarding_status ON public.client_onboarding USING btree (status);


--
-- Name: idx_client_onboarding_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_onboarding_user ON public.client_onboarding USING btree (user_id);


--
-- Name: idx_client_teams_primary_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_teams_primary_account ON public.client_teams USING btree (primary_account_id);


--
-- Name: idx_comm_channel_members_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_channel_members_channel ON public.comm_channel_members USING btree (channel_id);


--
-- Name: idx_comm_channel_members_channel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_channel_members_channel_id ON public.comm_channel_members USING btree (channel_id);


--
-- Name: idx_comm_channel_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_channel_members_user ON public.comm_channel_members USING btree (user_id);


--
-- Name: idx_comm_channel_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_channel_members_user_id ON public.comm_channel_members USING btree (user_id);


--
-- Name: idx_comm_messages_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_messages_channel ON public.comm_messages USING btree (channel_id, created_at DESC);


--
-- Name: idx_comm_messages_channel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_messages_channel_id ON public.comm_messages USING btree (channel_id);


--
-- Name: idx_comm_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_messages_created_at ON public.comm_messages USING btree (created_at DESC);


--
-- Name: idx_comm_messages_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_messages_parent ON public.comm_messages USING btree (parent_id) WHERE (parent_id IS NOT NULL);


--
-- Name: idx_comm_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_messages_sender ON public.comm_messages USING btree (sender_id);


--
-- Name: idx_comm_messages_sender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_messages_sender_id ON public.comm_messages USING btree (sender_id);


--
-- Name: idx_comm_presence_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_presence_status ON public.comm_presence USING btree (status);


--
-- Name: idx_comm_presence_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_presence_user ON public.comm_presence USING btree (user_id);


--
-- Name: idx_comm_reactions_message; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_reactions_message ON public.comm_reactions USING btree (message_id);


--
-- Name: idx_content_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_requests_status ON public.content_requests USING btree (status);


--
-- Name: idx_content_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_requests_user_id ON public.content_requests USING btree (user_id);


--
-- Name: idx_crm_comm_att_comm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_att_comm ON public.crm_communication_attachments USING btree (communication_id);


--
-- Name: idx_crm_comm_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_company ON public.crm_communications USING btree (company_id, occurred_at DESC);


--
-- Name: idx_crm_comm_contact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_contact ON public.crm_communications USING btree (contact_id, occurred_at DESC);


--
-- Name: idx_crm_comm_external; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_external ON public.crm_communications USING btree (external_source, external_id);


--
-- Name: idx_crm_comm_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_kind ON public.crm_communications USING btree (kind);


--
-- Name: idx_crm_comm_opp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_opp ON public.crm_communications USING btree (opportunity_id, occurred_at DESC);


--
-- Name: idx_crm_comm_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_org ON public.crm_communications USING btree (org_id);


--
-- Name: idx_crm_companies_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_companies_domain ON public.crm_companies USING btree (domain);


--
-- Name: idx_crm_companies_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_companies_org ON public.crm_companies USING btree (org_id);


--
-- Name: idx_crm_companies_rel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_companies_rel ON public.crm_companies USING gin (relationship_type);


--
-- Name: idx_crm_contacts_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_company ON public.crm_contacts USING btree (company_id);


--
-- Name: idx_crm_contacts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_email ON public.crm_contacts USING btree (email);


--
-- Name: idx_crm_contacts_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_org ON public.crm_contacts USING btree (org_id);


--
-- Name: idx_crm_deal_activities_deal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_deal_activities_deal_id ON public.crm_deal_activities USING btree (deal_id);


--
-- Name: idx_crm_deals_expected_close; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_deals_expected_close ON public.crm_deals USING btree (expected_close_date);


--
-- Name: idx_crm_deals_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_deals_stage ON public.crm_deals USING btree (stage);


--
-- Name: idx_crm_deals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_deals_user_id ON public.crm_deals USING btree (user_id);


--
-- Name: idx_crm_fin_links_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_fin_links_entity ON public.crm_financial_links USING btree (entity_type, entity_id);


--
-- Name: idx_crm_fin_links_finance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_fin_links_finance ON public.crm_financial_links USING btree (finance_type, finance_id);


--
-- Name: idx_crm_fin_links_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_fin_links_org ON public.crm_financial_links USING btree (org_id);


--
-- Name: idx_crm_opps_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_opps_company ON public.crm_opportunities USING btree (company_id);


--
-- Name: idx_crm_opps_contact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_opps_contact ON public.crm_opportunities USING btree (contact_id);


--
-- Name: idx_crm_opps_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_opps_org ON public.crm_opportunities USING btree (org_id);


--
-- Name: idx_crm_participants_comm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_participants_comm ON public.crm_activity_participants USING btree (communication_id);


--
-- Name: idx_crm_workflow_runs_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_workflow_runs_entity ON public.crm_workflow_runs USING btree (entity_type, entity_id);


--
-- Name: idx_crm_workflow_runs_workflow; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_workflow_runs_workflow ON public.crm_workflow_runs USING btree (workflow_id, created_at DESC);


--
-- Name: idx_crm_workflows_org_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_workflows_org_active ON public.crm_workflows USING btree (org_id, is_active, trigger_event);


--
-- Name: idx_designer_assets_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designer_assets_site ON public.designer_assets USING btree (site_id);


--
-- Name: idx_designer_assets_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designer_assets_user ON public.designer_assets USING btree (user_id);


--
-- Name: idx_designer_components_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designer_components_user ON public.designer_components USING btree (user_id);


--
-- Name: idx_designer_pages_site_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designer_pages_site_id ON public.designer_pages USING btree (site_id);


--
-- Name: idx_designer_pages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designer_pages_user_id ON public.designer_pages USING btree (user_id);


--
-- Name: idx_designer_sites_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designer_sites_user_id ON public.designer_sites USING btree (user_id);


--
-- Name: idx_dmc_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dmc_user ON public.dashboard_metrics_cache USING btree (user_id, period);


--
-- Name: idx_doc_comments_doc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doc_comments_doc ON public.document_comments USING btree (document_id);


--
-- Name: idx_doc_versions_doc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doc_versions_doc ON public.document_versions USING btree (document_id, created_at DESC);


--
-- Name: idx_email_accounts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_accounts_user ON public.email_accounts USING btree (user_id);


--
-- Name: idx_email_drafts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_drafts_user ON public.email_drafts USING btree (user_id);


--
-- Name: idx_email_messages_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_account ON public.email_messages USING btree (account_id);


--
-- Name: idx_email_messages_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_account_id ON public.email_messages USING btree (account_id);


--
-- Name: idx_email_messages_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_date ON public.email_messages USING btree (date DESC);


--
-- Name: idx_email_messages_folder; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_folder ON public.email_messages USING btree (folder);


--
-- Name: idx_email_messages_thread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_thread ON public.email_messages USING btree (thread_id);


--
-- Name: idx_email_messages_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_user ON public.email_messages USING btree (user_id);


--
-- Name: idx_email_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_user_id ON public.email_messages USING btree (user_id);


--
-- Name: idx_enquiries_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enquiries_created_at ON public.enquiries USING btree (created_at DESC);


--
-- Name: idx_enquiries_resume_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enquiries_resume_token ON public.enquiries USING btree (resume_token);


--
-- Name: idx_enquiries_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enquiries_status ON public.enquiries USING btree (status);


--
-- Name: idx_knowledge_base_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_base_author ON public.knowledge_base USING btree (author_id);


--
-- Name: idx_knowledge_base_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_base_category ON public.knowledge_base USING btree (category);


--
-- Name: idx_knowledge_base_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_base_status ON public.knowledge_base USING btree (status);


--
-- Name: idx_kpi_goals_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_goals_user ON public.kpi_goals USING btree (user_id);


--
-- Name: idx_lead_notes_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes USING btree (lead_id);


--
-- Name: idx_lead_status_history_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_status_history_lead_id ON public.lead_status_history USING btree (lead_id);


--
-- Name: idx_leads_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_assigned_to ON public.leads USING btree (assigned_to);


--
-- Name: idx_leads_business_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_business_name ON public.leads USING btree (business_name);


--
-- Name: idx_leads_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_email ON public.leads USING btree (email);


--
-- Name: idx_leads_enquiry_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_enquiry_id ON public.leads USING btree (enquiry_id);


--
-- Name: idx_leads_location_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_location_city ON public.leads USING btree (location_city);


--
-- Name: idx_leads_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_phone ON public.leads USING btree (phone);


--
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_status ON public.leads USING btree (status);


--
-- Name: idx_lifecycle_history_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lifecycle_history_entity ON public.crm_lifecycle_history USING btree (entity_type, entity_id);


--
-- Name: idx_marketing_page_views_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketing_page_views_created_at ON public.marketing_page_views USING btree (created_at DESC);


--
-- Name: idx_marketing_page_views_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketing_page_views_path ON public.marketing_page_views USING btree (path);


--
-- Name: idx_marketing_page_views_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketing_page_views_session ON public.marketing_page_views USING btree (session_id);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);


--
-- Name: idx_messages_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_recipient ON public.messages USING btree (recipient_id);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read) WHERE (is_read = false);


--
-- Name: idx_office_documents_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_office_documents_type ON public.office_documents USING btree (document_type);


--
-- Name: idx_office_documents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_office_documents_user_id ON public.office_documents USING btree (user_id);


--
-- Name: idx_planner_tasks_assigned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_tasks_assigned ON public.planner_tasks USING btree (assigned_to);


--
-- Name: idx_planner_tasks_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_tasks_due ON public.planner_tasks USING btree (due_date);


--
-- Name: idx_planner_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_tasks_status ON public.planner_tasks USING btree (status);


--
-- Name: idx_planner_tasks_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_tasks_team_id ON public.planner_tasks USING btree (team_id);


--
-- Name: idx_planner_tasks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_tasks_user_id ON public.planner_tasks USING btree (user_id);


--
-- Name: idx_platform_files_folder; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_files_folder ON public.platform_files USING btree (folder_path);


--
-- Name: idx_platform_files_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_files_source ON public.platform_files USING btree (app_source, source_id);


--
-- Name: idx_platform_files_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_files_type ON public.platform_files USING btree (file_type);


--
-- Name: idx_platform_files_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_files_user ON public.platform_files USING btree (user_id);


--
-- Name: idx_platform_folders_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_folders_path ON public.platform_folders USING btree (user_id, parent_path);


--
-- Name: idx_platform_folders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_folders_user ON public.platform_folders USING btree (user_id);


--
-- Name: idx_poll_votes_poll_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes USING btree (poll_id);


--
-- Name: idx_poll_votes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_poll_votes_user_id ON public.poll_votes USING btree (user_id);


--
-- Name: idx_product_variants_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_variants_product ON public.product_variants USING btree (product_id);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- Name: idx_products_user_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_user_site ON public.products USING btree (user_id, site_id);


--
-- Name: idx_profiles_2fa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_2fa ON public.profiles USING btree (two_factor_enabled);


--
-- Name: idx_profiles_enquiry_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_enquiry_id ON public.profiles USING btree (enquiry_id);


--
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);


--
-- Name: idx_profiles_verification_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_verification_token ON public.profiles USING btree (verification_token) WHERE (verification_token IS NOT NULL);


--
-- Name: idx_proposals_crm_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposals_crm_company ON public.proposals USING btree (crm_company_id);


--
-- Name: idx_pw_vault_configs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pw_vault_configs_user ON public.password_vault_configs USING btree (user_id);


--
-- Name: idx_pw_vault_items_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pw_vault_items_user ON public.password_vault_items USING btree (user_id);


--
-- Name: idx_pw_vault_items_vault; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pw_vault_items_vault ON public.password_vault_items USING btree (vault_id);


--
-- Name: idx_rate_limits_key_endpoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limits_key_endpoint ON public.rate_limits USING btree (key, endpoint);


--
-- Name: idx_rate_limits_window; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limits_window ON public.rate_limits USING btree (window_start);


--
-- Name: idx_rbac_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_audit_log_created_at ON public.rbac_audit_log USING btree (created_at DESC);


--
-- Name: idx_rbac_audit_log_performed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_audit_log_performed_by ON public.rbac_audit_log USING btree (performed_by);


--
-- Name: idx_rbac_permissions_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_permissions_module ON public.rbac_permissions USING btree (module);


--
-- Name: idx_rbac_permissions_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_permissions_role_id ON public.rbac_permissions USING btree (role_id);


--
-- Name: idx_rbac_roles_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_roles_position ON public.rbac_roles USING btree ("position" DESC);


--
-- Name: idx_rbac_user_roles_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_user_roles_role_id ON public.rbac_user_roles USING btree (role_id);


--
-- Name: idx_rbac_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_user_roles_user_id ON public.rbac_user_roles USING btree (user_id);


--
-- Name: idx_resource_allocations_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_allocations_project ON public.resource_allocations USING btree (project_id);


--
-- Name: idx_resource_allocations_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_allocations_user ON public.resource_allocations USING btree (user_id);


--
-- Name: idx_resource_allocations_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_allocations_week ON public.resource_allocations USING btree (week_start);


--
-- Name: idx_security_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_logs_created_at ON public.security_logs USING btree (created_at DESC);


--
-- Name: idx_security_logs_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_logs_event_type ON public.security_logs USING btree (event_type);


--
-- Name: idx_security_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_logs_user_id ON public.security_logs USING btree (user_id);


--
-- Name: idx_site_bookings_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_bookings_date ON public.site_bookings USING btree (site_id, booking_date);


--
-- Name: idx_site_carts_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_carts_session ON public.site_carts USING btree (session_id);


--
-- Name: idx_site_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_orders_user ON public.site_orders USING btree (user_id, site_id);


--
-- Name: idx_site_visitors_site_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_visitors_site_email ON public.site_visitors USING btree (site_id, email);


--
-- Name: idx_subscription_site_events_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_site_events_site ON public.subscription_site_events USING btree (subscription_site_id, occurred_at DESC);


--
-- Name: idx_subscription_sites_hosting_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_sites_hosting_status ON public.subscription_sites USING btree (hosting_status);


--
-- Name: idx_subscription_sites_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_sites_owner ON public.subscription_sites USING btree (owner_user_id);


--
-- Name: idx_subscription_sites_renewal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_sites_renewal ON public.subscription_sites USING btree (next_renewal_date);


--
-- Name: idx_subscription_sites_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_sites_status ON public.subscription_sites USING btree (status);


--
-- Name: idx_support_tickets_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_created_at ON public.support_tickets USING btree (created_at DESC);


--
-- Name: idx_support_tickets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);


--
-- Name: idx_support_tickets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);


--
-- Name: idx_team_memberships_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_memberships_team_id ON public.team_memberships USING btree (team_id);


--
-- Name: idx_team_memberships_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_memberships_user_id ON public.team_memberships USING btree (user_id);


--
-- Name: idx_ual_feature; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ual_feature ON public.user_activity_log USING btree (user_id, feature_name);


--
-- Name: idx_ual_user_visited; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ual_user_visited ON public.user_activity_log USING btree (user_id, visited_at DESC);


--
-- Name: idx_user_connections_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_connections_provider ON public.user_connections USING btree (user_id, provider);


--
-- Name: idx_user_connections_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_connections_user_id ON public.user_connections USING btree (user_id);


--
-- Name: idx_user_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_vault_configs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vault_configs_user ON public.vault_configs USING btree (user_id);


--
-- Name: idx_vault_items_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vault_items_user ON public.vault_items USING btree (user_id);


--
-- Name: idx_whitelisted_ips_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whitelisted_ips_ip ON public.whitelisted_ips USING btree (ip_address);


--
-- Name: acc_accounting_periods acc_accounting_periods_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_accounting_periods_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_accounting_periods FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ap_bill_lines_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_ap_bill_lines FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_ap_bills acc_ap_bills_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ap_bills_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_ap_bills FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_ap_payments acc_ap_payments_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ap_payments_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_ap_payments FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ar_invoice_lines_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_ar_invoice_lines FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_ar_invoices acc_ar_invoices_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ar_invoices_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_ar_invoices FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_ar_payments acc_ar_payments_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ar_payments_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_ar_payments FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_bank_reconciliations acc_bank_reconciliations_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_bank_reconciliations_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_bank_reconciliations FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_bank_transactions acc_bank_transactions_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_bank_transactions_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_bank_transactions FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_chart_of_accounts acc_chart_of_accounts_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_chart_of_accounts_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_chart_of_accounts FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_chart_of_accounts acc_coa_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_coa_touch BEFORE UPDATE ON public.acc_chart_of_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_customers acc_customers_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_customers_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_customers FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_depreciation_runs acc_depreciation_runs_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_depreciation_runs_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_depreciation_runs FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_fixed_assets acc_fixed_assets_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_fixed_assets_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_fixed_assets FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_accountant_invites acc_inv_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_inv_touch BEFORE UPDATE ON public.acc_accountant_invites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_journal_entries acc_je_append_only; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_je_append_only BEFORE DELETE OR UPDATE ON public.acc_journal_entries FOR EACH ROW EXECUTE FUNCTION public.acc_block_posted_entry_mutation();


--
-- Name: acc_journal_entries acc_je_balanced; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_je_balanced BEFORE INSERT OR UPDATE ON public.acc_journal_entries FOR EACH ROW EXECUTE FUNCTION public.acc_check_entry_balanced();


--
-- Name: acc_journal_entries acc_je_period_lock; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_je_period_lock BEFORE INSERT OR UPDATE ON public.acc_journal_entries FOR EACH ROW EXECUTE FUNCTION public.acc_enforce_period_lock();


--
-- Name: acc_journal_entries acc_je_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_je_touch BEFORE UPDATE ON public.acc_journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_journal_lines acc_jl_append_only; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_jl_append_only BEFORE DELETE OR UPDATE ON public.acc_journal_lines FOR EACH ROW EXECUTE FUNCTION public.acc_block_posted_line_mutation();


--
-- Name: acc_journal_entries acc_journal_entries_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_journal_entries_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_journal_entries FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_journal_lines acc_journal_lines_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_journal_lines_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_journal_lines FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_organizations acc_org_after_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_org_after_insert AFTER INSERT ON public.acc_organizations FOR EACH ROW EXECUTE FUNCTION public.acc_after_org_insert();


--
-- Name: acc_organizations acc_org_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_org_touch BEFORE UPDATE ON public.acc_organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_accounting_periods acc_per_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_per_touch BEFORE UPDATE ON public.acc_accounting_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_suppliers acc_suppliers_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_suppliers_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_suppliers FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: acc_user_roles acc_ur_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ur_touch BEFORE UPDATE ON public.acc_user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_vat_returns acc_vat_returns_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_vat_returns_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_vat_returns FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();


--
-- Name: ecommerce_orders ecommerce_orders_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ecommerce_orders_touch BEFORE UPDATE ON public.ecommerce_orders FOR EACH ROW EXECUTE FUNCTION public.ecommerce_orders_touch();


--
-- Name: ecommerce_settings ecommerce_settings_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ecommerce_settings_touch BEFORE UPDATE ON public.ecommerce_settings FOR EACH ROW EXECUTE FUNCTION public.ecommerce_settings_touch();


--
-- Name: blocked_ips encrypt_blocked_ip_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER encrypt_blocked_ip_trigger BEFORE INSERT OR UPDATE ON public.blocked_ips FOR EACH ROW EXECUTE FUNCTION public.encrypt_blocked_ip();


--
-- Name: enquiries encrypt_enquiry_pii_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER encrypt_enquiry_pii_trigger BEFORE INSERT OR UPDATE ON public.enquiries FOR EACH ROW EXECUTE FUNCTION public.encrypt_enquiry_pii();


--
-- Name: leads encrypt_lead_pii_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER encrypt_lead_pii_trigger BEFORE INSERT OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.encrypt_lead_pii();


--
-- Name: profiles encrypt_profile_pii_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER encrypt_profile_pii_trigger BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.encrypt_profile_pii();


--
-- Name: security_logs encrypt_security_log_ip_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER encrypt_security_log_ip_trigger BEFORE INSERT OR UPDATE ON public.security_logs FOR EACH ROW EXECUTE FUNCTION public.encrypt_security_log_ip();


--
-- Name: whitelisted_ips encrypt_whitelisted_ip_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER encrypt_whitelisted_ip_trigger BEFORE INSERT OR UPDATE ON public.whitelisted_ips FOR EACH ROW EXECUTE FUNCTION public.encrypt_whitelisted_ip();


--
-- Name: inv_locations inv_locations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER inv_locations_updated_at BEFORE UPDATE ON public.inv_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inv_products inv_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER inv_products_updated_at BEFORE UPDATE ON public.inv_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inv_settings inv_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER inv_settings_updated_at BEFORE UPDATE ON public.inv_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inv_stock_counts inv_stock_counts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER inv_stock_counts_updated_at BEFORE UPDATE ON public.inv_stock_counts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inv_stock_levels inv_stock_levels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER inv_stock_levels_updated_at BEFORE UPDATE ON public.inv_stock_levels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription_sites subscription_sites_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER subscription_sites_updated_at BEFORE UPDATE ON public.subscription_sites FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: client_assets track_asset_storage; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER track_asset_storage AFTER INSERT OR DELETE ON public.client_assets FOR EACH ROW EXECUTE FUNCTION public.track_storage_quota();


--
-- Name: acc_ap_bills trg_acc_ap_bills_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_ap_bills_updated BEFORE UPDATE ON public.acc_ap_bills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_ap_payments trg_acc_ap_payments_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_ap_payments_updated BEFORE UPDATE ON public.acc_ap_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_ar_invoices trg_acc_ar_invoices_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_ar_invoices_updated BEFORE UPDATE ON public.acc_ar_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_ar_payments trg_acc_ar_payments_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_ar_payments_updated BEFORE UPDATE ON public.acc_ar_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_bank_accounts trg_acc_bank_accounts_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_bank_accounts_updated BEFORE UPDATE ON public.acc_bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_bank_transactions trg_acc_bank_txn_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_bank_txn_updated BEFORE UPDATE ON public.acc_bank_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_customers trg_acc_customers_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_customers_updated BEFORE UPDATE ON public.acc_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_depreciation_runs trg_acc_dr_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_dr_updated BEFORE UPDATE ON public.acc_depreciation_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_employees trg_acc_employees_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_employees_updated_at BEFORE UPDATE ON public.acc_employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_fixed_assets trg_acc_fa_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_fa_updated BEFORE UPDATE ON public.acc_fixed_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_pay_runs trg_acc_pay_runs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_pay_runs_updated_at BEFORE UPDATE ON public.acc_pay_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_payslips trg_acc_payslips_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_payslips_updated_at BEFORE UPDATE ON public.acc_payslips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_bank_reconciliations trg_acc_recon_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_recon_updated BEFORE UPDATE ON public.acc_bank_reconciliations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_suppliers trg_acc_suppliers_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_suppliers_updated BEFORE UPDATE ON public.acc_suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_vat_returns trg_acc_vat_returns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_vat_returns_updated_at BEFORE UPDATE ON public.acc_vat_returns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: crm_communications trg_crm_comm_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_comm_updated BEFORE UPDATE ON public.crm_communications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: crm_companies trg_crm_companies_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_companies_updated BEFORE UPDATE ON public.crm_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: crm_contacts trg_crm_contacts_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: crm_lifecycle_history trg_crm_dispatch_lifecycle; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_dispatch_lifecycle AFTER INSERT ON public.crm_lifecycle_history FOR EACH ROW EXECUTE FUNCTION public.crm_dispatch_lifecycle_workflows();


--
-- Name: crm_financial_links trg_crm_fin_links_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_fin_links_updated_at BEFORE UPDATE ON public.crm_financial_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: crm_lifecycle_stages trg_crm_lifecycle_stages_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_lifecycle_stages_updated BEFORE UPDATE ON public.crm_lifecycle_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: crm_opportunities trg_crm_opportunities_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_opportunities_updated BEFORE UPDATE ON public.crm_opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: crm_workflows trg_crm_workflows_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_workflows_updated_at BEFORE UPDATE ON public.crm_workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_fx_rates trg_fx_rates_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fx_rates_updated BEFORE UPDATE ON public.acc_fx_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: greeting_messages trg_greeting_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_greeting_messages_updated_at BEFORE UPDATE ON public.greeting_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: comm_channels trg_set_channel_join_code; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_set_channel_join_code BEFORE INSERT ON public.comm_channels FOR EACH ROW EXECUTE FUNCTION public.set_channel_join_code();


--
-- Name: site_content trg_site_content_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_messages update_ai_conversation_on_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_conversation_on_message AFTER INSERT ON public.ai_messages FOR EACH ROW EXECUTE FUNCTION public.update_ai_conversation_timestamp();


--
-- Name: app_projects update_app_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_app_projects_updated_at BEFORE UPDATE ON public.app_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: automation_rules update_automation_rules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: automation_schedules update_automation_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_automation_schedules_updated_at BEFORE UPDATE ON public.automation_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: booking_services update_booking_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_booking_services_updated_at BEFORE UPDATE ON public.booking_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: booking_settings update_booking_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_booking_settings_updated_at BEFORE UPDATE ON public.booking_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: booking_staff update_booking_staff_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_booking_staff_updated_at BEFORE UPDATE ON public.booking_staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bookings update_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: brand_settings update_brand_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_brand_settings_updated_at BEFORE UPDATE ON public.brand_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: business_reports update_business_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_business_reports_updated_at BEFORE UPDATE ON public.business_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cad_projects update_cad_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cad_projects_updated_at BEFORE UPDATE ON public.cad_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: calendar_events update_calendar_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: call_sessions update_call_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_call_sessions_updated_at BEFORE UPDATE ON public.call_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_billing update_client_billing_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_billing_updated_at BEFORE UPDATE ON public.client_billing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: client_contracts update_client_contracts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_contracts_updated_at BEFORE UPDATE ON public.client_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_invoices update_client_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_invoices_updated_at BEFORE UPDATE ON public.client_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_onboarding update_client_onboarding_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_onboarding_updated_at BEFORE UPDATE ON public.client_onboarding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_pricing update_client_pricing_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_pricing_updated_at BEFORE UPDATE ON public.client_pricing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_teams update_client_teams_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_teams_updated_at BEFORE UPDATE ON public.client_teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cms_collections update_cms_collections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_collections_updated_at BEFORE UPDATE ON public.cms_collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: cms_entries update_cms_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_entries_updated_at BEFORE UPDATE ON public.cms_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: comm_channels update_comm_channels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comm_channels_updated_at BEFORE UPDATE ON public.comm_channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: comm_messages update_comm_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comm_messages_updated_at BEFORE UPDATE ON public.comm_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: comm_presence update_comm_presence_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comm_presence_updated_at BEFORE UPDATE ON public.comm_presence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: comm_user_settings update_comm_user_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comm_user_settings_updated_at BEFORE UPDATE ON public.comm_user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: content_requests update_content_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_content_requests_updated_at BEFORE UPDATE ON public.content_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: crm_deals update_crm_deals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_crm_deals_updated_at BEFORE UPDATE ON public.crm_deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: designer_pages update_designer_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_designer_pages_updated_at BEFORE UPDATE ON public.designer_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: designer_sites update_designer_sites_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_designer_sites_updated_at BEFORE UPDATE ON public.designer_sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: email_accounts update_email_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON public.email_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: email_drafts update_email_drafts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_drafts_updated_at BEFORE UPDATE ON public.email_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: email_messages update_email_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_messages_updated_at BEFORE UPDATE ON public.email_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: enquiries update_enquiries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_enquiries_updated_at BEFORE UPDATE ON public.enquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: inv_companies update_inv_companies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_inv_companies_updated_at BEFORE UPDATE ON public.inv_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: knowledge_base update_knowledge_base_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON public.knowledge_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: kpi_goals update_kpi_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_kpi_goals_updated_at BEFORE UPDATE ON public.kpi_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lead_notes update_lead_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_lead_notes_updated_at BEFORE UPDATE ON public.lead_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: comm_messages update_message_thread_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_message_thread_count AFTER INSERT OR DELETE ON public.comm_messages FOR EACH ROW EXECUTE FUNCTION public.update_thread_count();


--
-- Name: notification_preferences update_notification_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: office_documents update_office_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_office_documents_updated_at BEFORE UPDATE ON public.office_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: planner_tasks update_planner_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_planner_tasks_updated_at BEFORE UPDATE ON public.planner_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: platform_files update_platform_files_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_platform_files_updated_at BEFORE UPDATE ON public.platform_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: platform_folders update_platform_folders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_platform_folders_updated_at BEFORE UPDATE ON public.platform_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: product_categories update_product_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: product_variants update_product_variants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_last_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_last_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_profile_last_updated();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: proposals update_proposals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: password_vault_configs update_pw_vault_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pw_vault_configs_updated_at BEFORE UPDATE ON public.password_vault_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: password_vault_items update_pw_vault_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pw_vault_items_updated_at BEFORE UPDATE ON public.password_vault_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: rbac_roles update_rbac_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_rbac_roles_updated_at BEFORE UPDATE ON public.rbac_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: resource_allocations update_resource_allocations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_resource_allocations_updated_at BEFORE UPDATE ON public.resource_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: site_bookings update_site_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_bookings_updated_at BEFORE UPDATE ON public.site_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: site_carts update_site_carts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_carts_updated_at BEFORE UPDATE ON public.site_carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: site_deployments update_site_deployments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_deployments_updated_at BEFORE UPDATE ON public.site_deployments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: site_domains update_site_domains_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_domains_updated_at BEFORE UPDATE ON public.site_domains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: site_orders update_site_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_orders_updated_at BEFORE UPDATE ON public.site_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: site_products update_site_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_products_updated_at BEFORE UPDATE ON public.site_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: site_visitors update_site_visitors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_visitors_updated_at BEFORE UPDATE ON public.site_visitors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: social_media_accounts update_social_media_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_social_media_accounts_updated_at BEFORE UPDATE ON public.social_media_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: social_media_posts update_social_media_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_social_media_posts_updated_at BEFORE UPDATE ON public.social_media_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: sticky_walls update_sticky_walls_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sticky_walls_updated_at BEFORE UPDATE ON public.sticky_walls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: support_tickets update_support_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: team_branding update_team_branding_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_team_branding_updated_at BEFORE UPDATE ON public.team_branding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: user_branding update_user_branding_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_branding_updated_at BEFORE UPDATE ON public.user_branding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: user_calendars update_user_calendars_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_calendars_updated_at BEFORE UPDATE ON public.user_calendars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_connections update_user_connections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON public.user_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_onboarding update_user_onboarding_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_onboarding_updated_at BEFORE UPDATE ON public.user_onboarding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_sidebar_layout update_user_sidebar_layout_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_sidebar_layout_updated_at BEFORE UPDATE ON public.user_sidebar_layout FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vault_configs update_vault_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vault_configs_updated_at BEFORE UPDATE ON public.vault_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vault_items update_vault_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vault_items_updated_at BEFORE UPDATE ON public.vault_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: workflows update_workflows_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acc_accountant_invites acc_accountant_invites_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_accountant_invites
    ADD CONSTRAINT acc_accountant_invites_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_accounting_periods acc_accounting_periods_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_accounting_periods
    ADD CONSTRAINT acc_accounting_periods_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bill_lines
    ADD CONSTRAINT acc_ap_bill_lines_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.acc_ap_bills(id) ON DELETE CASCADE;


--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_expense_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bill_lines
    ADD CONSTRAINT acc_ap_bill_lines_expense_account_id_fkey FOREIGN KEY (expense_account_id) REFERENCES public.acc_chart_of_accounts(id);


--
-- Name: acc_ap_bills acc_ap_bills_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE SET NULL;


--
-- Name: acc_ap_bills acc_ap_bills_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;


--
-- Name: acc_ap_bills acc_ap_bills_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_ap_bills acc_ap_bills_reversal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_reversal_entry_id_fkey FOREIGN KEY (reversal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;


--
-- Name: acc_ap_bills acc_ap_bills_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.acc_suppliers(id) ON DELETE RESTRICT;


--
-- Name: acc_ap_payments acc_ap_payments_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_payments
    ADD CONSTRAINT acc_ap_payments_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.acc_chart_of_accounts(id);


--
-- Name: acc_ap_payments acc_ap_payments_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_payments
    ADD CONSTRAINT acc_ap_payments_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.acc_ap_bills(id) ON DELETE RESTRICT;


--
-- Name: acc_ap_payments acc_ap_payments_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_payments
    ADD CONSTRAINT acc_ap_payments_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;


--
-- Name: acc_ap_payments acc_ap_payments_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_payments
    ADD CONSTRAINT acc_ap_payments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoice_lines
    ADD CONSTRAINT acc_ar_invoice_lines_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.acc_ar_invoices(id) ON DELETE CASCADE;


--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_revenue_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoice_lines
    ADD CONSTRAINT acc_ar_invoice_lines_revenue_account_id_fkey FOREIGN KEY (revenue_account_id) REFERENCES public.acc_chart_of_accounts(id);


--
-- Name: acc_ar_invoices acc_ar_invoices_client_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_client_invoice_id_fkey FOREIGN KEY (client_invoice_id) REFERENCES public.client_invoices(id) ON DELETE SET NULL;


--
-- Name: acc_ar_invoices acc_ar_invoices_crm_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_crm_company_id_fkey FOREIGN KEY (crm_company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;


--
-- Name: acc_ar_invoices acc_ar_invoices_crm_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_crm_contact_id_fkey FOREIGN KEY (crm_contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;


--
-- Name: acc_ar_invoices acc_ar_invoices_crm_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_crm_opportunity_id_fkey FOREIGN KEY (crm_opportunity_id) REFERENCES public.crm_opportunities(id) ON DELETE SET NULL;


--
-- Name: acc_ar_invoices acc_ar_invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.acc_customers(id) ON DELETE RESTRICT;


--
-- Name: acc_ar_invoices acc_ar_invoices_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;


--
-- Name: acc_ar_invoices acc_ar_invoices_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_ar_invoices acc_ar_invoices_reversal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_reversal_entry_id_fkey FOREIGN KEY (reversal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;


--
-- Name: acc_ar_invoices acc_ar_invoices_subscription_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_subscription_site_id_fkey FOREIGN KEY (subscription_site_id) REFERENCES public.subscription_sites(id) ON DELETE SET NULL;


--
-- Name: acc_ar_payments acc_ar_payments_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_payments
    ADD CONSTRAINT acc_ar_payments_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.acc_chart_of_accounts(id);


--
-- Name: acc_ar_payments acc_ar_payments_crm_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_payments
    ADD CONSTRAINT acc_ar_payments_crm_company_id_fkey FOREIGN KEY (crm_company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;


--
-- Name: acc_ar_payments acc_ar_payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_payments
    ADD CONSTRAINT acc_ar_payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.acc_ar_invoices(id) ON DELETE RESTRICT;


--
-- Name: acc_ar_payments acc_ar_payments_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_payments
    ADD CONSTRAINT acc_ar_payments_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;


--
-- Name: acc_ar_payments acc_ar_payments_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_payments
    ADD CONSTRAINT acc_ar_payments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_audit_log acc_audit_log_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_audit_log
    ADD CONSTRAINT acc_audit_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_bank_accounts acc_bank_accounts_coa_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_accounts
    ADD CONSTRAINT acc_bank_accounts_coa_account_id_fkey FOREIGN KEY (coa_account_id) REFERENCES public.acc_chart_of_accounts(id) ON DELETE RESTRICT;


--
-- Name: acc_bank_accounts acc_bank_accounts_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_accounts
    ADD CONSTRAINT acc_bank_accounts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_bank_reconciliations acc_bank_reconciliations_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_reconciliations
    ADD CONSTRAINT acc_bank_reconciliations_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.acc_bank_accounts(id) ON DELETE CASCADE;


--
-- Name: acc_bank_reconciliations acc_bank_reconciliations_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_reconciliations
    ADD CONSTRAINT acc_bank_reconciliations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_bank_transactions acc_bank_transactions_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_transactions
    ADD CONSTRAINT acc_bank_transactions_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.acc_bank_accounts(id) ON DELETE CASCADE;


--
-- Name: acc_bank_transactions acc_bank_transactions_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_transactions
    ADD CONSTRAINT acc_bank_transactions_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;


--
-- Name: acc_bank_transactions acc_bank_transactions_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_transactions
    ADD CONSTRAINT acc_bank_transactions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_bank_transactions acc_bank_transactions_reconciliation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_transactions
    ADD CONSTRAINT acc_bank_transactions_reconciliation_id_fkey FOREIGN KEY (reconciliation_id) REFERENCES public.acc_bank_reconciliations(id) ON DELETE SET NULL;


--
-- Name: acc_chart_of_accounts acc_chart_of_accounts_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_chart_of_accounts
    ADD CONSTRAINT acc_chart_of_accounts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_chart_of_accounts acc_chart_of_accounts_parent_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_chart_of_accounts
    ADD CONSTRAINT acc_chart_of_accounts_parent_account_id_fkey FOREIGN KEY (parent_account_id) REFERENCES public.acc_chart_of_accounts(id) ON DELETE SET NULL;


--
-- Name: acc_customers acc_customers_crm_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_crm_company_id_fkey FOREIGN KEY (crm_company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;


--
-- Name: acc_customers acc_customers_crm_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_crm_contact_id_fkey FOREIGN KEY (crm_contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;


--
-- Name: acc_customers acc_customers_default_ar_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_default_ar_account_id_fkey FOREIGN KEY (default_ar_account_id) REFERENCES public.acc_chart_of_accounts(id);


--
-- Name: acc_customers acc_customers_default_revenue_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_default_revenue_account_id_fkey FOREIGN KEY (default_revenue_account_id) REFERENCES public.acc_chart_of_accounts(id);


--
-- Name: acc_customers acc_customers_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_depreciation_lines acc_depreciation_lines_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_lines
    ADD CONSTRAINT acc_depreciation_lines_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.acc_fixed_assets(id) ON DELETE RESTRICT;


--
-- Name: acc_depreciation_lines acc_depreciation_lines_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_lines
    ADD CONSTRAINT acc_depreciation_lines_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_depreciation_lines acc_depreciation_lines_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_lines
    ADD CONSTRAINT acc_depreciation_lines_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.acc_depreciation_runs(id) ON DELETE CASCADE;


--
-- Name: acc_depreciation_runs acc_depreciation_runs_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_runs
    ADD CONSTRAINT acc_depreciation_runs_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id);


--
-- Name: acc_depreciation_runs acc_depreciation_runs_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_runs
    ADD CONSTRAINT acc_depreciation_runs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_employees acc_employees_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_employees
    ADD CONSTRAINT acc_employees_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_fixed_assets acc_fixed_assets_accum_depr_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_accum_depr_account_id_fkey FOREIGN KEY (accum_depr_account_id) REFERENCES public.acc_chart_of_accounts(id);


--
-- Name: acc_fixed_assets acc_fixed_assets_acquisition_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_acquisition_entry_id_fkey FOREIGN KEY (acquisition_entry_id) REFERENCES public.acc_journal_entries(id);


--
-- Name: acc_fixed_assets acc_fixed_assets_asset_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_asset_account_id_fkey FOREIGN KEY (asset_account_id) REFERENCES public.acc_chart_of_accounts(id);


--
-- Name: acc_fixed_assets acc_fixed_assets_depr_expense_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_depr_expense_account_id_fkey FOREIGN KEY (depr_expense_account_id) REFERENCES public.acc_chart_of_accounts(id);


--
-- Name: acc_fixed_assets acc_fixed_assets_disposal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_disposal_entry_id_fkey FOREIGN KEY (disposal_entry_id) REFERENCES public.acc_journal_entries(id);


--
-- Name: acc_fixed_assets acc_fixed_assets_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_fx_rates acc_fx_rates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fx_rates
    ADD CONSTRAINT acc_fx_rates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: acc_fx_rates acc_fx_rates_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fx_rates
    ADD CONSTRAINT acc_fx_rates_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_journal_entries acc_journal_entries_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_entries
    ADD CONSTRAINT acc_journal_entries_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_journal_entries acc_journal_entries_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_entries
    ADD CONSTRAINT acc_journal_entries_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.acc_accounting_periods(id) ON DELETE SET NULL;


--
-- Name: acc_journal_entries acc_journal_entries_reversed_by_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_entries
    ADD CONSTRAINT acc_journal_entries_reversed_by_entry_id_fkey FOREIGN KEY (reversed_by_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;


--
-- Name: acc_journal_lines acc_journal_lines_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_lines
    ADD CONSTRAINT acc_journal_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.acc_chart_of_accounts(id) ON DELETE RESTRICT;


--
-- Name: acc_journal_lines acc_journal_lines_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_lines
    ADD CONSTRAINT acc_journal_lines_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE CASCADE;


--
-- Name: acc_org_members acc_org_members_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_org_members
    ADD CONSTRAINT acc_org_members_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_pay_runs acc_pay_runs_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_pay_runs
    ADD CONSTRAINT acc_pay_runs_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id);


--
-- Name: acc_pay_runs acc_pay_runs_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_pay_runs
    ADD CONSTRAINT acc_pay_runs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_pay_runs acc_pay_runs_payment_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_pay_runs
    ADD CONSTRAINT acc_pay_runs_payment_entry_id_fkey FOREIGN KEY (payment_entry_id) REFERENCES public.acc_journal_entries(id);


--
-- Name: acc_payslips acc_payslips_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_payslips
    ADD CONSTRAINT acc_payslips_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.acc_employees(id) ON DELETE RESTRICT;


--
-- Name: acc_payslips acc_payslips_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_payslips
    ADD CONSTRAINT acc_payslips_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_payslips acc_payslips_pay_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_payslips
    ADD CONSTRAINT acc_payslips_pay_run_id_fkey FOREIGN KEY (pay_run_id) REFERENCES public.acc_pay_runs(id) ON DELETE CASCADE;


--
-- Name: acc_suppliers acc_suppliers_default_ap_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_suppliers
    ADD CONSTRAINT acc_suppliers_default_ap_account_id_fkey FOREIGN KEY (default_ap_account_id) REFERENCES public.acc_chart_of_accounts(id);


--
-- Name: acc_suppliers acc_suppliers_default_expense_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_suppliers
    ADD CONSTRAINT acc_suppliers_default_expense_account_id_fkey FOREIGN KEY (default_expense_account_id) REFERENCES public.acc_chart_of_accounts(id);


--
-- Name: acc_suppliers acc_suppliers_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_suppliers
    ADD CONSTRAINT acc_suppliers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_user_roles acc_user_roles_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_user_roles
    ADD CONSTRAINT acc_user_roles_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_vat_returns acc_vat_returns_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_vat_returns
    ADD CONSTRAINT acc_vat_returns_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;


--
-- Name: acc_vat_returns acc_vat_returns_payment_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_vat_returns
    ADD CONSTRAINT acc_vat_returns_payment_entry_id_fkey FOREIGN KEY (payment_entry_id) REFERENCES public.acc_journal_entries(id);


--
-- Name: acc_vat_returns acc_vat_returns_submission_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_vat_returns
    ADD CONSTRAINT acc_vat_returns_submission_entry_id_fkey FOREIGN KEY (submission_entry_id) REFERENCES public.acc_journal_entries(id);


--
-- Name: ai_messages ai_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id) ON DELETE CASCADE;


--
-- Name: asset_folders asset_folders_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_folders
    ADD CONSTRAINT asset_folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.asset_folders(id) ON DELETE CASCADE;


--
-- Name: asset_tag_assignments asset_tag_assignments_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_tag_assignments
    ADD CONSTRAINT asset_tag_assignments_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.client_assets(id) ON DELETE CASCADE;


--
-- Name: asset_tag_assignments asset_tag_assignments_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_tag_assignments
    ADD CONSTRAINT asset_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.asset_tags(id) ON DELETE CASCADE;


--
-- Name: automation_rule_logs automation_rule_logs_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rule_logs
    ADD CONSTRAINT automation_rule_logs_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.automation_rules(id) ON DELETE CASCADE;


--
-- Name: automation_rules automation_rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: billing_audit_log billing_audit_log_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_audit_log
    ADD CONSTRAINT billing_audit_log_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE SET NULL;


--
-- Name: blocked_ips blocked_ips_blocked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_ips
    ADD CONSTRAINT blocked_ips_blocked_by_fkey FOREIGN KEY (blocked_by) REFERENCES auth.users(id);


--
-- Name: booking_availability booking_availability_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_availability
    ADD CONSTRAINT booking_availability_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.booking_staff(id) ON DELETE CASCADE;


--
-- Name: booking_blocked_dates booking_blocked_dates_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_blocked_dates
    ADD CONSTRAINT booking_blocked_dates_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.booking_staff(id) ON DELETE CASCADE;


--
-- Name: booking_services booking_services_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT booking_services_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;


--
-- Name: booking_staff_services booking_staff_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_staff_services
    ADD CONSTRAINT booking_staff_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.booking_services(id) ON DELETE CASCADE;


--
-- Name: booking_staff_services booking_staff_services_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_staff_services
    ADD CONSTRAINT booking_staff_services_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.booking_staff(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_rescheduled_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_rescheduled_from_fkey FOREIGN KEY (rescheduled_from) REFERENCES public.bookings(id);


--
-- Name: bookings bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.booking_services(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.booking_staff(id) ON DELETE SET NULL;


--
-- Name: brand_settings brand_settings_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_settings
    ADD CONSTRAINT brand_settings_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE CASCADE;


--
-- Name: cad_autosaves cad_autosaves_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_autosaves
    ADD CONSTRAINT cad_autosaves_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.cad_projects(id) ON DELETE SET NULL;


--
-- Name: cad_project_versions cad_project_versions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_project_versions
    ADD CONSTRAINT cad_project_versions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.cad_projects(id) ON DELETE CASCADE;


--
-- Name: calculator_history calculator_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculator_history
    ADD CONSTRAINT calculator_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: calendar_event_exceptions calendar_event_exceptions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_event_exceptions
    ADD CONSTRAINT calendar_event_exceptions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.calendar_events(id) ON DELETE CASCADE;


--
-- Name: call_sessions call_sessions_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_sessions
    ADD CONSTRAINT call_sessions_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.comm_channels(id) ON DELETE SET NULL;


--
-- Name: client_assets client_assets_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_assets
    ADD CONSTRAINT client_assets_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.asset_folders(id) ON DELETE SET NULL;


--
-- Name: client_contracts client_contracts_crm_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_crm_company_id_fkey FOREIGN KEY (crm_company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;


--
-- Name: client_contracts client_contracts_crm_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_crm_opportunity_id_fkey FOREIGN KEY (crm_opportunity_id) REFERENCES public.crm_opportunities(id) ON DELETE SET NULL;


--
-- Name: client_contracts client_contracts_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE CASCADE;


--
-- Name: client_invoices client_invoices_crm_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_invoices
    ADD CONSTRAINT client_invoices_crm_company_id_fkey FOREIGN KEY (crm_company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;


--
-- Name: client_invoices client_invoices_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_invoices
    ADD CONSTRAINT client_invoices_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE CASCADE;


--
-- Name: client_onboarding client_onboarding_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_onboarding
    ADD CONSTRAINT client_onboarding_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.crm_deals(id) ON DELETE SET NULL;


--
-- Name: client_pricing client_pricing_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_pricing
    ADD CONSTRAINT client_pricing_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE CASCADE;


--
-- Name: cms_collections cms_collections_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_collections
    ADD CONSTRAINT cms_collections_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;


--
-- Name: cms_entries cms_entries_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_entries
    ADD CONSTRAINT cms_entries_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.cms_collections(id) ON DELETE CASCADE;


--
-- Name: cms_entries cms_entries_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_entries
    ADD CONSTRAINT cms_entries_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;


--
-- Name: comm_channel_members comm_channel_members_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channel_members
    ADD CONSTRAINT comm_channel_members_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.comm_channels(id) ON DELETE CASCADE;


--
-- Name: comm_channel_members comm_channel_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channel_members
    ADD CONSTRAINT comm_channel_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: comm_channels comm_channels_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channels
    ADD CONSTRAINT comm_channels_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: comm_messages comm_messages_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_messages
    ADD CONSTRAINT comm_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.comm_channels(id) ON DELETE CASCADE;


--
-- Name: comm_messages comm_messages_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_messages
    ADD CONSTRAINT comm_messages_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comm_messages(id) ON DELETE SET NULL;


--
-- Name: comm_messages comm_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_messages
    ADD CONSTRAINT comm_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: comm_presence comm_presence_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_presence
    ADD CONSTRAINT comm_presence_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: comm_reactions comm_reactions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_reactions
    ADD CONSTRAINT comm_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.comm_messages(id) ON DELETE CASCADE;


--
-- Name: comm_reactions comm_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_reactions
    ADD CONSTRAINT comm_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: comm_read_receipts comm_read_receipts_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_read_receipts
    ADD CONSTRAINT comm_read_receipts_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.comm_channels(id) ON DELETE CASCADE;


--
-- Name: comm_read_receipts comm_read_receipts_last_read_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_read_receipts
    ADD CONSTRAINT comm_read_receipts_last_read_message_id_fkey FOREIGN KEY (last_read_message_id) REFERENCES public.comm_messages(id) ON DELETE SET NULL;


--
-- Name: comm_read_receipts comm_read_receipts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_read_receipts
    ADD CONSTRAINT comm_read_receipts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: comm_user_settings comm_user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_user_settings
    ADD CONSTRAINT comm_user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: crm_activity_participants crm_activity_participants_communication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_activity_participants
    ADD CONSTRAINT crm_activity_participants_communication_id_fkey FOREIGN KEY (communication_id) REFERENCES public.crm_communications(id) ON DELETE CASCADE;


--
-- Name: crm_activity_participants crm_activity_participants_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_activity_participants
    ADD CONSTRAINT crm_activity_participants_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;


--
-- Name: crm_communication_attachments crm_communication_attachments_communication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_communication_attachments
    ADD CONSTRAINT crm_communication_attachments_communication_id_fkey FOREIGN KEY (communication_id) REFERENCES public.crm_communications(id) ON DELETE CASCADE;


--
-- Name: crm_communications crm_communications_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_communications
    ADD CONSTRAINT crm_communications_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.crm_companies(id) ON DELETE CASCADE;


--
-- Name: crm_communications crm_communications_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_communications
    ADD CONSTRAINT crm_communications_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE CASCADE;


--
-- Name: crm_communications crm_communications_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_communications
    ADD CONSTRAINT crm_communications_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.crm_opportunities(id) ON DELETE CASCADE;


--
-- Name: crm_contacts crm_contacts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contacts
    ADD CONSTRAINT crm_contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;


--
-- Name: crm_deal_activities crm_deal_activities_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_deal_activities
    ADD CONSTRAINT crm_deal_activities_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.crm_deals(id) ON DELETE CASCADE;


--
-- Name: crm_deals crm_deals_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_deals
    ADD CONSTRAINT crm_deals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: crm_opportunities crm_opportunities_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_opportunities
    ADD CONSTRAINT crm_opportunities_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;


--
-- Name: crm_opportunities crm_opportunities_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_opportunities
    ADD CONSTRAINT crm_opportunities_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;


--
-- Name: crm_workflow_runs crm_workflow_runs_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_workflow_runs
    ADD CONSTRAINT crm_workflow_runs_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.crm_workflows(id) ON DELETE CASCADE;


--
-- Name: designer_assets designer_assets_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designer_assets
    ADD CONSTRAINT designer_assets_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;


--
-- Name: designer_pages designer_pages_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designer_pages
    ADD CONSTRAINT designer_pages_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;


--
-- Name: document_comments document_comments_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT document_comments_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.office_documents(id) ON DELETE CASCADE;


--
-- Name: document_comments document_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT document_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: document_versions document_versions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.office_documents(id) ON DELETE CASCADE;


--
-- Name: document_versions document_versions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: email_drafts email_drafts_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_drafts
    ADD CONSTRAINT email_drafts_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.email_accounts(id) ON DELETE SET NULL;


--
-- Name: email_messages email_messages_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.email_accounts(id) ON DELETE CASCADE;


--
-- Name: expenses expenses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: greeting_messages greeting_messages_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.greeting_messages
    ADD CONSTRAINT greeting_messages_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: greeting_messages greeting_messages_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.greeting_messages
    ADD CONSTRAINT greeting_messages_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: greeting_messages greeting_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.greeting_messages
    ADD CONSTRAINT greeting_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: hr_candidates hr_candidates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_candidates
    ADD CONSTRAINT hr_candidates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: hr_employees hr_employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_employees
    ADD CONSTRAINT hr_employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: hr_performance_reviews hr_performance_reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_performance_reviews
    ADD CONSTRAINT hr_performance_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.hr_employees(id) ON DELETE CASCADE;


--
-- Name: hr_performance_reviews hr_performance_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_performance_reviews
    ADD CONSTRAINT hr_performance_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: hr_time_off_requests hr_time_off_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_time_off_requests
    ADD CONSTRAINT hr_time_off_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.hr_employees(id) ON DELETE CASCADE;


--
-- Name: hr_time_off_requests hr_time_off_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_time_off_requests
    ADD CONSTRAINT hr_time_off_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: inv_products inv_products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_products
    ADD CONSTRAINT inv_products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.inv_categories(id) ON DELETE SET NULL;


--
-- Name: inv_products inv_products_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_products
    ADD CONSTRAINT inv_products_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.inv_companies(id) ON DELETE CASCADE;


--
-- Name: inv_stock_count_items inv_stock_count_items_count_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_count_items
    ADD CONSTRAINT inv_stock_count_items_count_id_fkey FOREIGN KEY (count_id) REFERENCES public.inv_stock_counts(id) ON DELETE CASCADE;


--
-- Name: inv_stock_count_items inv_stock_count_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_count_items
    ADD CONSTRAINT inv_stock_count_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inv_products(id) ON DELETE CASCADE;


--
-- Name: inv_stock_counts inv_stock_counts_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_counts
    ADD CONSTRAINT inv_stock_counts_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.inv_locations(id) ON DELETE SET NULL;


--
-- Name: inv_stock_levels inv_stock_levels_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_levels
    ADD CONSTRAINT inv_stock_levels_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.inv_locations(id) ON DELETE CASCADE;


--
-- Name: inv_stock_levels inv_stock_levels_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_levels
    ADD CONSTRAINT inv_stock_levels_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inv_products(id) ON DELETE CASCADE;


--
-- Name: inv_stock_movements inv_stock_movements_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_movements
    ADD CONSTRAINT inv_stock_movements_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.inv_locations(id) ON DELETE SET NULL;


--
-- Name: inv_stock_movements inv_stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_movements
    ADD CONSTRAINT inv_stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inv_products(id) ON DELETE CASCADE;


--
-- Name: inv_stock_movements inv_stock_movements_to_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_movements
    ADD CONSTRAINT inv_stock_movements_to_location_id_fkey FOREIGN KEY (to_location_id) REFERENCES public.inv_locations(id) ON DELETE SET NULL;


--
-- Name: lead_imports lead_imports_imported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_imports
    ADD CONSTRAINT lead_imports_imported_by_fkey FOREIGN KEY (imported_by) REFERENCES auth.users(id);


--
-- Name: lead_notes lead_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id);


--
-- Name: lead_notes lead_notes_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_status_history lead_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);


--
-- Name: lead_status_history lead_status_history_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: leads leads_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);


--
-- Name: leads leads_enquiry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_enquiry_id_fkey FOREIGN KEY (enquiry_id) REFERENCES public.enquiries(id) ON DELETE SET NULL;


--
-- Name: messages messages_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: office_poll_options office_poll_options_poll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_options
    ADD CONSTRAINT office_poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.office_polls(id) ON DELETE CASCADE;


--
-- Name: office_poll_votes office_poll_votes_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_votes
    ADD CONSTRAINT office_poll_votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.office_poll_options(id) ON DELETE CASCADE;


--
-- Name: office_poll_votes office_poll_votes_poll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_votes
    ADD CONSTRAINT office_poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.office_polls(id) ON DELETE CASCADE;


--
-- Name: office_poll_votes office_poll_votes_voter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_votes
    ADD CONSTRAINT office_poll_votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: office_polls office_polls_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_polls
    ADD CONSTRAINT office_polls_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: password_vault_items password_vault_items_vault_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_vault_items
    ADD CONSTRAINT password_vault_items_vault_id_fkey FOREIGN KEY (vault_id) REFERENCES public.password_vault_configs(id) ON DELETE CASCADE;


--
-- Name: planner_tasks planner_tasks_parent_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_tasks
    ADD CONSTRAINT planner_tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.planner_tasks(id) ON DELETE SET NULL;


--
-- Name: planner_tasks planner_tasks_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_tasks
    ADD CONSTRAINT planner_tasks_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE SET NULL;


--
-- Name: poll_votes poll_votes_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.comm_channels(id) ON DELETE CASCADE;


--
-- Name: poll_votes poll_votes_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.comm_messages(id) ON DELETE CASCADE;


--
-- Name: pomodoro_sessions pomodoro_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: product_categories product_categories_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;


--
-- Name: products products_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_enquiry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_enquiry_id_fkey FOREIGN KEY (enquiry_id) REFERENCES public.enquiries(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: proposals proposals_crm_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_crm_company_id_fkey FOREIGN KEY (crm_company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;


--
-- Name: proposals proposals_crm_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_crm_contact_id_fkey FOREIGN KEY (crm_contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;


--
-- Name: proposals proposals_crm_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_crm_opportunity_id_fkey FOREIGN KEY (crm_opportunity_id) REFERENCES public.crm_opportunities(id) ON DELETE SET NULL;


--
-- Name: proposals proposals_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.crm_deals(id) ON DELETE SET NULL;


--
-- Name: proposals proposals_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: rate_limits rate_limits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: rbac_audit_log rbac_audit_log_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_audit_log
    ADD CONSTRAINT rbac_audit_log_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: rbac_permissions rbac_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_permissions
    ADD CONSTRAINT rbac_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rbac_roles(id) ON DELETE CASCADE;


--
-- Name: rbac_roles rbac_roles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_roles
    ADD CONSTRAINT rbac_roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: rbac_user_roles rbac_user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: rbac_user_roles rbac_user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rbac_roles(id) ON DELETE CASCADE;


--
-- Name: rbac_user_roles rbac_user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: resource_allocations resource_allocations_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_allocations
    ADD CONSTRAINT resource_allocations_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.crm_deals(id) ON DELETE SET NULL;


--
-- Name: resource_allocations resource_allocations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_allocations
    ADD CONSTRAINT resource_allocations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.app_projects(id) ON DELETE CASCADE;


--
-- Name: security_logs security_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: site_bookings site_bookings_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_bookings
    ADD CONSTRAINT site_bookings_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;


--
-- Name: site_bookings site_bookings_visitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_bookings
    ADD CONSTRAINT site_bookings_visitor_id_fkey FOREIGN KEY (visitor_id) REFERENCES public.site_visitors(id) ON DELETE SET NULL;


--
-- Name: site_carts site_carts_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_carts
    ADD CONSTRAINT site_carts_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;


--
-- Name: site_orders site_orders_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_orders
    ADD CONSTRAINT site_orders_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;


--
-- Name: site_products site_products_inv_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_products
    ADD CONSTRAINT site_products_inv_product_id_fkey FOREIGN KEY (inv_product_id) REFERENCES public.inv_products(id) ON DELETE SET NULL;


--
-- Name: site_products site_products_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_products
    ADD CONSTRAINT site_products_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;


--
-- Name: site_visitors site_visitors_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_visitors
    ADD CONSTRAINT site_visitors_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;


--
-- Name: social_media_posts social_media_posts_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_posts
    ADD CONSTRAINT social_media_posts_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.social_media_accounts(id) ON DELETE CASCADE;


--
-- Name: subscription_site_events subscription_site_events_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_site_events
    ADD CONSTRAINT subscription_site_events_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: subscription_site_events subscription_site_events_subscription_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_site_events
    ADD CONSTRAINT subscription_site_events_subscription_site_id_fkey FOREIGN KEY (subscription_site_id) REFERENCES public.subscription_sites(id) ON DELETE CASCADE;


--
-- Name: subscription_sites subscription_sites_acc_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_sites
    ADD CONSTRAINT subscription_sites_acc_customer_id_fkey FOREIGN KEY (acc_customer_id) REFERENCES public.acc_customers(id) ON DELETE SET NULL;


--
-- Name: subscription_sites subscription_sites_acc_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_sites
    ADD CONSTRAINT subscription_sites_acc_org_id_fkey FOREIGN KEY (acc_org_id) REFERENCES public.acc_organizations(id) ON DELETE SET NULL;


--
-- Name: subscription_sites subscription_sites_acc_revenue_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_sites
    ADD CONSTRAINT subscription_sites_acc_revenue_account_id_fkey FOREIGN KEY (acc_revenue_account_id) REFERENCES public.acc_chart_of_accounts(id) ON DELETE SET NULL;


--
-- Name: subscription_sites subscription_sites_account_manager_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_sites
    ADD CONSTRAINT subscription_sites_account_manager_user_id_fkey FOREIGN KEY (account_manager_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: subscription_sites subscription_sites_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_sites
    ADD CONSTRAINT subscription_sites_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_ai_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_ai_conversation_id_fkey FOREIGN KEY (ai_conversation_id) REFERENCES public.ai_conversations(id) ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: team_memberships team_memberships_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_memberships
    ADD CONSTRAINT team_memberships_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE CASCADE;


--
-- Name: time_entries time_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vault_configs vault_configs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_configs
    ADD CONSTRAINT vault_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vault_items vault_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_items
    ADD CONSTRAINT vault_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: whitelisted_ips whitelisted_ips_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelisted_ips
    ADD CONSTRAINT whitelisted_ips_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id);


--
-- Name: wiki_pages wiki_pages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT wiki_pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: workflow_runs workflow_runs_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_runs
    ADD CONSTRAINT workflow_runs_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE;


--
-- Name: enquiries Admin users can delete enquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can delete enquiries" ON public.enquiries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: enquiries Admin users can update enquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can update enquiries" ON public.enquiries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: enquiries Admin users can view enquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can view enquiries" ON public.enquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: automation_rules Admins can create automation rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create automation rules" ON public.automation_rules FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: knowledge_base Admins can create kb articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create kb articles" ON public.knowledge_base FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ad_campaigns Admins can delete ad campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete ad campaigns" ON public.ad_campaigns FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: crm_deals Admins can delete all deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete all deals" ON public.crm_deals FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: app_projects Admins can delete app projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete app projects" ON public.app_projects FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: automation_rules Admins can delete automation rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete automation rules" ON public.automation_rules FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_billing Admins can delete billing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete billing" ON public.client_billing FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blocked_ips Admins can delete blocked IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete blocked IPs" ON public.blocked_ips FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: comm_channels Admins can delete channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete channels" ON public.comm_channels FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: content_requests Admins can delete content requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete content requests" ON public.content_requests FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: conversations Admins can delete conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete conversations" ON public.conversations FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: customer_uploads Admins can delete customer uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete customer uploads" ON public.customer_uploads FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: knowledge_base Admins can delete kb articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete kb articles" ON public.knowledge_base FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lead_notes Admins can delete lead notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete lead notes" ON public.lead_notes FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Admins can delete leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: messages Admins can delete messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete messages" ON public.messages FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can delete profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: site_content Admins can delete site content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete site content" ON public.site_content FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: social_media_accounts Admins can delete social media accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete social media accounts" ON public.social_media_accounts FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: social_media_posts Admins can delete social media posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete social media posts" ON public.social_media_posts FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_sites Admins can delete subscription sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete subscription sites" ON public.subscription_sites FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_teams Admins can delete teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete teams" ON public.client_teams FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: whitelisted_ips Admins can delete whitelisted IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete whitelisted IPs" ON public.whitelisted_ips FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ad_campaigns Admins can insert ad campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert ad campaigns" ON public.ad_campaigns FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: app_projects Admins can insert app projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert app projects" ON public.app_projects FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: automation_rule_logs Admins can insert automation logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert automation logs" ON public.automation_rule_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_billing Admins can insert billing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert billing" ON public.client_billing FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blocked_ips Admins can insert blocked IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert blocked IPs" ON public.blocked_ips FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: crm_deals Admins can insert deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert deals" ON public.crm_deals FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lead_imports Admins can insert lead imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert lead imports" ON public.lead_imports FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lead_notes Admins can insert lead notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert lead notes" ON public.lead_notes FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lead_status_history Admins can insert lead status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert lead status history" ON public.lead_status_history FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Admins can insert leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert leads" ON public.leads FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can insert profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: site_content Admins can insert site content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert site content" ON public.site_content FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: social_media_accounts Admins can insert social media accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert social media accounts" ON public.social_media_accounts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: social_media_posts Admins can insert social media posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert social media posts" ON public.social_media_posts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_sites Admins can insert subscription sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert subscription sites" ON public.subscription_sites FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_teams Admins can insert teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert teams" ON public.client_teams FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: whitelisted_ips Admins can insert whitelisted IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert whitelisted IPs" ON public.whitelisted_ips FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: resource_allocations Admins can manage all allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all allocations" ON public.resource_allocations USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_contracts Admins can manage all contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all contracts" ON public.client_contracts USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: site_domains Admins can manage all domains; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all domains" ON public.site_domains TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_invoices Admins can manage all invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all invoices" ON public.client_invoices USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: team_memberships Admins can manage all memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all memberships" ON public.team_memberships USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_pricing Admins can manage all pricing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all pricing" ON public.client_pricing USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: announcements Admins can manage announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage announcements" ON public.announcements USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: comm_channel_members Admins can manage members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage members" ON public.comm_channel_members FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (user_id = auth.uid())));


--
-- Name: team_inbox_settings Admins can manage team inbox settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage team inbox settings" ON public.team_inbox_settings USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: rbac_user_roles Admins can manage user role assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage user role assignments" ON public.rbac_user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: rbac_audit_log Admins can read audit log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read audit log" ON public.rbac_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: messages Admins can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can send messages" ON public.messages FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ad_campaigns Admins can update ad campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update ad campaigns" ON public.ad_campaigns FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: conversations Admins can update all conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all conversations" ON public.conversations FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: crm_deals Admins can update all deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all deals" ON public.crm_deals FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_tickets Admins can update all tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all tickets" ON public.support_tickets FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: app_projects Admins can update app projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update app projects" ON public.app_projects FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: automation_rules Admins can update automation rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update automation rules" ON public.automation_rules FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_billing Admins can update billing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update billing" ON public.client_billing FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blocked_ips Admins can update blocked IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update blocked IPs" ON public.blocked_ips FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: comm_channels Admins can update channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update channels" ON public.comm_channels FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: content_requests Admins can update content requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update content requests" ON public.content_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: customer_uploads Admins can update customer uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update customer uploads" ON public.customer_uploads FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: knowledge_base Admins can update kb articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update kb articles" ON public.knowledge_base FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lead_notes Admins can update lead notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update lead notes" ON public.lead_notes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Admins can update leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update leads" ON public.leads FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: messages Admins can update messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update messages" ON public.messages FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: site_content Admins can update site content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update site content" ON public.site_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: social_media_accounts Admins can update social media accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update social media accounts" ON public.social_media_accounts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: social_media_posts Admins can update social media posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update social media posts" ON public.social_media_posts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: storage_quotas Admins can update storage quotas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update storage quotas" ON public.storage_quotas FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_sites Admins can update subscription sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update subscription sites" ON public.subscription_sites FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_teams Admins can update teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update teams" ON public.client_teams FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: whitelisted_ips Admins can update whitelisted IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update whitelisted IPs" ON public.whitelisted_ips FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ad_campaigns Admins can view all ad campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all ad campaigns" ON public.ad_campaigns FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: resource_allocations Admins can view all allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all allocations" ON public.resource_allocations FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: app_projects Admins can view all app projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all app projects" ON public.app_projects FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_billing Admins can view all billing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all billing" ON public.client_billing FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blocked_ips Admins can view all blocked IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all blocked IPs" ON public.blocked_ips FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: content_requests Admins can view all content requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all content requests" ON public.content_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: conversations Admins can view all conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: customer_uploads Admins can view all customer uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all customer uploads" ON public.customer_uploads FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: crm_deal_activities Admins can view all deal activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all deal activities" ON public.crm_deal_activities FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: crm_deals Admins can view all deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all deals" ON public.crm_deals FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: site_deployments Admins can view all deployments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all deployments" ON public.site_deployments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: office_documents Admins can view all documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all documents" ON public.office_documents FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: knowledge_base Admins can view all kb articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all kb articles" ON public.knowledge_base FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lead_notes Admins can view all lead notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all lead notes" ON public.lead_notes FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Admins can view all leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all leads" ON public.leads FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: team_memberships Admins can view all memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all memberships" ON public.team_memberships FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: messages Admins can view all messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: social_media_accounts Admins can view all social media accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all social media accounts" ON public.social_media_accounts FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: social_media_posts Admins can view all social media posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all social media posts" ON public.social_media_posts FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: storage_quotas Admins can view all storage quotas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all storage quotas" ON public.storage_quotas FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_sites Admins can view all subscription sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all subscription sites" ON public.subscription_sites FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: client_teams Admins can view all teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all teams" ON public.client_teams FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_tickets Admins can view all tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all user roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: password_vault_configs Admins can view all vault configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all vault configs" ON public.password_vault_configs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: vault_configs Admins can view all vault configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all vault configs" ON public.vault_configs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: whitelisted_ips Admins can view all whitelisted IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all whitelisted IPs" ON public.whitelisted_ips FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: automation_rule_logs Admins can view automation logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view automation logs" ON public.automation_rule_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: automation_rules Admins can view automation rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view automation rules" ON public.automation_rules FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lead_imports Admins can view lead imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view lead imports" ON public.lead_imports FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lead_status_history Admins can view lead status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view lead status history" ON public.lead_status_history FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: marketing_page_views Admins can view page views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view page views" ON public.marketing_page_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: security_logs Admins can view security logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view security logs" ON public.security_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_site_events Admins can view subscription events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view subscription events" ON public.subscription_site_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: team_inbox_settings Admins can view team inbox settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view team inbox settings" ON public.team_inbox_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: greeting_messages Admins manage all greetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage all greetings" ON public.greeting_messages TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: account_type_presets Admins manage presets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage presets" ON public.account_type_presets TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: bookings Anyone can create bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);


--
-- Name: ecommerce_orders Anyone can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create orders" ON public.ecommerce_orders FOR INSERT TO anon, authenticated WITH CHECK (true);


--
-- Name: marketing_page_views Anyone can insert page views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert page views" ON public.marketing_page_views FOR INSERT TO anon, authenticated WITH CHECK (true);


--
-- Name: ecommerce_orders Anyone can read a specific order; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read a specific order" ON public.ecommerce_orders FOR SELECT TO anon USING (true);


--
-- Name: site_content Anyone can read site content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read site content" ON public.site_content FOR SELECT USING (true);


--
-- Name: enquiries Anyone can submit enquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit enquiries" ON public.enquiries FOR INSERT TO anon, authenticated WITH CHECK (((name IS NOT NULL) AND (email IS NOT NULL) AND (length(name) > 0) AND (length(name) <= 200) AND (length(email) > 0) AND (length(email) <= 255) AND (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)));


--
-- Name: cad_projects Anyone can view shared CAD projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view shared CAD projects" ON public.cad_projects FOR SELECT USING (((shared_mode <> 'private'::text) AND (share_token IS NOT NULL)));


--
-- Name: account_type_presets Authenticated can read presets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read presets" ON public.account_type_presets FOR SELECT TO authenticated USING (true);


--
-- Name: comm_channels Authenticated users can create channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create channels" ON public.comm_channels FOR INSERT WITH CHECK ((auth.uid() = created_by));


--
-- Name: announcements Authenticated users can read active announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read active announcements" ON public.announcements FOR SELECT USING (((auth.uid() IS NOT NULL) AND (is_active = true)));


--
-- Name: poll_votes Authenticated users can view poll votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view poll votes" ON public.poll_votes FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: comm_presence Authenticated users can view presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view presence" ON public.comm_presence FOR SELECT TO authenticated USING (true);


--
-- Name: site_carts Authenticated users delete carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users delete carts" ON public.site_carts FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.designer_sites s
  WHERE ((s.id = site_carts.site_id) AND (s.user_id = auth.uid())))));


--
-- Name: two_factor_attempts Block all direct access to 2FA attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Block all direct access to 2FA attempts" ON public.two_factor_attempts USING (false) WITH CHECK (false);


--
-- Name: rate_limits Block all direct access to rate_limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Block all direct access to rate_limits" ON public.rate_limits USING (false) WITH CHECK (false);


--
-- Name: billing_audit_log Block deletes from billing audit log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Block deletes from billing audit log" ON public.billing_audit_log FOR DELETE USING (false);


--
-- Name: billing_audit_log Block updates to billing audit log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Block updates to billing audit log" ON public.billing_audit_log FOR UPDATE USING (false);


--
-- Name: site_carts Cart creation requires session id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cart creation requires session id" ON public.site_carts FOR INSERT WITH CHECK (((session_id IS NOT NULL) AND (length(session_id) >= 8) AND (site_id IS NOT NULL)));


--
-- Name: comm_messages Channel members can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Channel members can send messages" ON public.comm_messages FOR INSERT TO authenticated WITH CHECK (((sender_id = auth.uid()) AND ((EXISTS ( SELECT 1
   FROM public.comm_channel_members
  WHERE ((comm_channel_members.channel_id = comm_messages.channel_id) AND (comm_channel_members.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role))));


--
-- Name: comm_messages Channel members can view messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Channel members can view messages" ON public.comm_messages FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.comm_channel_members
  WHERE ((comm_channel_members.channel_id = comm_messages.channel_id) AND (comm_channel_members.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: comm_reactions Channel members can view reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Channel members can view reactions" ON public.comm_reactions FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM (public.comm_messages m
     JOIN public.comm_channel_members cm ON ((cm.channel_id = m.channel_id)))
  WHERE ((m.id = comm_reactions.message_id) AND (cm.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Deny anonymous access to profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access to profiles" ON public.profiles FOR SELECT TO anon USING (false);


--
-- Name: team_branding Managers can delete team branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can delete team branding" ON public.team_branding FOR DELETE TO authenticated USING ((auth.uid() = manager_id));


--
-- Name: team_branding Managers can insert team branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can insert team branding" ON public.team_branding FOR INSERT TO authenticated WITH CHECK ((auth.uid() = manager_id));


--
-- Name: team_branding Managers can update team branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can update team branding" ON public.team_branding FOR UPDATE TO authenticated USING ((auth.uid() = manager_id));


--
-- Name: team_branding Managers can view own team branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view own team branding" ON public.team_branding FOR SELECT TO authenticated USING ((auth.uid() = manager_id));


--
-- Name: comm_channel_members Members can view channel memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view channel memberships" ON public.comm_channel_members FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_channel_member(channel_id)));


--
-- Name: comm_read_receipts Members can view channel read receipts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view channel read receipts" ON public.comm_read_receipts FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.comm_channel_members
  WHERE ((comm_channel_members.channel_id = comm_read_receipts.channel_id) AND (comm_channel_members.user_id = auth.uid())))));


--
-- Name: ecommerce_orders Merchant deletes own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchant deletes own orders" ON public.ecommerce_orders FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: ecommerce_orders Merchant reads own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchant reads own orders" ON public.ecommerce_orders FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: ecommerce_orders Merchant updates own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchant updates own orders" ON public.ecommerce_orders FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_roles Only admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: billing_audit_log Only admins can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert audit logs" ON public.billing_audit_log FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Only admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Only admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: billing_audit_log Only admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view audit logs" ON public.billing_audit_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_site_events Owner can insert site events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner can insert site events" ON public.subscription_site_events FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.subscription_sites s
  WHERE ((s.id = subscription_site_events.subscription_site_id) AND (s.owner_user_id = auth.uid())))));


--
-- Name: subscription_sites Owner can manage subscription sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner can manage subscription sites" ON public.subscription_sites USING ((auth.uid() = owner_user_id)) WITH CHECK ((auth.uid() = owner_user_id));


--
-- Name: subscription_site_events Owner can view site events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner can view site events" ON public.subscription_site_events FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.subscription_sites s
  WHERE ((s.id = subscription_site_events.subscription_site_id) AND (s.owner_user_id = auth.uid())))));


--
-- Name: office_poll_options Poll options follow poll access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Poll options follow poll access" ON public.office_poll_options USING ((EXISTS ( SELECT 1
   FROM public.office_polls
  WHERE ((office_polls.id = office_poll_options.poll_id) AND (office_polls.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.office_polls
  WHERE ((office_polls.id = office_poll_options.poll_id) AND (office_polls.user_id = auth.uid())))));


--
-- Name: office_poll_votes Poll owners see votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Poll owners see votes" ON public.office_poll_votes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.office_polls
  WHERE ((office_polls.id = office_poll_votes.poll_id) AND (office_polls.user_id = auth.uid())))));


--
-- Name: team_memberships Primary owners can delete team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Primary owners can delete team members" ON public.team_memberships FOR DELETE USING ((team_id IN ( SELECT client_teams.id
   FROM public.client_teams
  WHERE (client_teams.primary_account_id = auth.uid()))));


--
-- Name: team_memberships Primary owners can insert team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Primary owners can insert team members" ON public.team_memberships FOR INSERT WITH CHECK ((team_id IN ( SELECT client_teams.id
   FROM public.client_teams
  WHERE (client_teams.primary_account_id = auth.uid()))));


--
-- Name: team_memberships Primary owners can update team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Primary owners can update team members" ON public.team_memberships FOR UPDATE USING ((team_id IN ( SELECT client_teams.id
   FROM public.client_teams
  WHERE (client_teams.primary_account_id = auth.uid()))));


--
-- Name: team_memberships Primary owners can view team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Primary owners can view team members" ON public.team_memberships FOR SELECT USING ((team_id IN ( SELECT client_teams.id
   FROM public.client_teams
  WHERE (client_teams.primary_account_id = auth.uid()))));


--
-- Name: enquiries Public can resume drafts with token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can resume drafts with token" ON public.enquiries FOR SELECT USING (((is_draft = true) AND (resume_token IS NOT NULL)));


--
-- Name: enquiries Public can update drafts with token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can update drafts with token" ON public.enquiries FOR UPDATE USING (((is_draft = true) AND (resume_token IS NOT NULL))) WITH CHECK ((is_draft = true));


--
-- Name: products Public can view active products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING ((status = 'active'::text));


--
-- Name: booking_services Public can view active services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active services" ON public.booking_services FOR SELECT USING ((is_active = true));


--
-- Name: booking_staff Public can view active staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active staff" ON public.booking_staff FOR SELECT USING ((is_active = true));


--
-- Name: booking_availability Public can view availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view availability" ON public.booking_availability FOR SELECT USING ((is_active = true));


--
-- Name: booking_blocked_dates Public can view blocked dates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view blocked dates" ON public.booking_blocked_dates FOR SELECT USING (true);


--
-- Name: booking_settings Public can view booking settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view booking settings" ON public.booking_settings FOR SELECT USING ((booking_page_enabled = true));


--
-- Name: product_categories Public can view categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view categories" ON public.product_categories FOR SELECT USING (true);


--
-- Name: booking_staff_services Public can view staff services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view staff services" ON public.booking_staff_services FOR SELECT USING (true);


--
-- Name: product_variants Public can view variants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view variants" ON public.product_variants FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_variants.product_id) AND (p.status = 'active'::text)))));


--
-- Name: cms_entries Public read CMS entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read CMS entries" ON public.cms_entries FOR SELECT USING ((status = 'published'::text));


--
-- Name: site_products Public read site products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read site products" ON public.site_products FOR SELECT USING ((status = 'active'::text));


--
-- Name: site_carts Site owners can update their site carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Site owners can update their site carts" ON public.site_carts FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.designer_sites s
  WHERE ((s.id = site_carts.site_id) AND (s.user_id = auth.uid())))));


--
-- Name: site_carts Site owners can view their site carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Site owners can view their site carts" ON public.site_carts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.designer_sites s
  WHERE ((s.id = site_carts.site_id) AND (s.user_id = auth.uid())))));


--
-- Name: booking_staff_services Staff service links follow staff ownership; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff service links follow staff ownership" ON public.booking_staff_services USING ((EXISTS ( SELECT 1
   FROM public.booking_staff s
  WHERE ((s.id = booking_staff_services.staff_id) AND (s.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.booking_staff s
  WHERE ((s.id = booking_staff_services.staff_id) AND (s.user_id = auth.uid())))));


--
-- Name: team_branding Team members can view team branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members can view team branding" ON public.team_branding FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.team_memberships tm
     JOIN public.client_teams ct ON ((ct.id = tm.team_id)))
  WHERE ((tm.user_id = auth.uid()) AND (ct.primary_account_id = team_branding.manager_id)))));


--
-- Name: client_contracts Team owners and financial members can view their contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners and financial members can view their contracts" ON public.client_contracts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.team_memberships tm
  WHERE ((tm.team_id = client_contracts.team_id) AND (tm.user_id = auth.uid()) AND (tm.member_role = ANY (ARRAY['owner'::text, 'financial'::text]))))));


--
-- Name: client_invoices Team owners and financial members can view their invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners and financial members can view their invoices" ON public.client_invoices FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.team_memberships tm
  WHERE ((tm.team_id = client_invoices.team_id) AND (tm.user_id = auth.uid()) AND (tm.member_role = ANY (ARRAY['owner'::text, 'financial'::text]))))));


--
-- Name: client_pricing Team owners and financial members can view their pricing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners and financial members can view their pricing" ON public.client_pricing FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.team_memberships tm
  WHERE ((tm.team_id = client_pricing.team_id) AND (tm.user_id = auth.uid()) AND (tm.member_role = ANY (ARRAY['owner'::text, 'financial'::text]))))) AND (is_visible = true)));


--
-- Name: user_branding Team owners can update member branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can update member branding" ON public.user_branding FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.team_memberships tm
     JOIN public.client_teams ct ON ((ct.id = tm.team_id)))
  WHERE ((tm.user_id = user_branding.user_id) AND (ct.primary_account_id = auth.uid())))));


--
-- Name: client_teams Team owners can update their team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can update their team" ON public.client_teams FOR UPDATE USING ((auth.uid() = primary_account_id));


--
-- Name: user_branding Team owners can view member branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can view member branding" ON public.user_branding FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.team_memberships tm
     JOIN public.client_teams ct ON ((ct.id = tm.team_id)))
  WHERE ((tm.user_id = user_branding.user_id) AND (ct.primary_account_id = auth.uid())))));


--
-- Name: client_teams Team owners can view their team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can view their team" ON public.client_teams FOR SELECT USING ((auth.uid() = primary_account_id));


--
-- Name: comm_reactions Users can add reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add reactions" ON public.comm_reactions FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: team_memberships Users can add themselves to team as owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add themselves to team as owner" ON public.team_memberships FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: rbac_user_roles Users can assign roles they own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can assign roles they own" ON public.rbac_user_roles FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (assigned_by = auth.uid())));


--
-- Name: poll_votes Users can cast their own vote; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can cast their own vote" ON public.poll_votes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: call_sessions Users can create calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create calls" ON public.call_sessions FOR INSERT WITH CHECK ((auth.uid() = caller_id));


--
-- Name: crm_deal_activities Users can create deal activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create deal activities" ON public.crm_deal_activities FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: ai_messages Users can create messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create messages in their conversations" ON public.ai_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));


--
-- Name: cad_projects Users can create own CAD projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own CAD projects" ON public.cad_projects FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: api_keys Users can create own api keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own api keys" ON public.api_keys FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: automation_runs Users can create own automation runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own automation runs" ON public.automation_runs FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: brand_settings Users can create own brand settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own brand settings" ON public.brand_settings FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: user_calendars Users can create own calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own calendars" ON public.user_calendars FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: designer_components Users can create own components; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own components" ON public.designer_components FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: conversations Users can create own conversation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own conversation" ON public.conversations FOR INSERT WITH CHECK ((auth.uid() = customer_id));


--
-- Name: crm_deals Users can create own deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own deals" ON public.crm_deals FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: site_deployments Users can create own deployments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own deployments" ON public.site_deployments FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: office_documents Users can create own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own documents" ON public.office_documents FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: calendar_event_exceptions Users can create own event exceptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own event exceptions" ON public.calendar_event_exceptions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.calendar_events
  WHERE ((calendar_events.id = calendar_event_exceptions.event_id) AND (calendar_events.user_id = auth.uid())))));


--
-- Name: calendar_events Users can create own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own events" ON public.calendar_events FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: kpi_goals Users can create own kpi goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own kpi goals" ON public.kpi_goals FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: client_onboarding Users can create own onboarding records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own onboarding records" ON public.client_onboarding FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: password_vault_configs Users can create own password vault configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own password vault configs" ON public.password_vault_configs FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: password_vault_items Users can create own password vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own password vault items" ON public.password_vault_items FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: cad_project_versions Users can create own project versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own project versions" ON public.cad_project_versions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cad_projects
  WHERE ((cad_projects.id = cad_project_versions.project_id) AND (cad_projects.user_id = auth.uid())))));


--
-- Name: business_reports Users can create own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own reports" ON public.business_reports FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: automation_schedules Users can create own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own schedules" ON public.automation_schedules FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: sticky_walls Users can create own sticky walls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own sticky walls" ON public.sticky_walls FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: rbac_roles Users can create roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create roles" ON public.rbac_roles FOR INSERT TO authenticated WITH CHECK ((created_by = auth.uid()));


--
-- Name: planner_tasks Users can create tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create tasks" ON public.planner_tasks FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: inv_companies Users can create their own companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own companies" ON public.inv_companies FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: content_requests Users can create their own content requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own content requests" ON public.content_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can create their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own conversations" ON public.ai_conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: designer_pages Users can create their own pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own pages" ON public.designer_pages FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: designer_sites Users can create their own sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own sites" ON public.designer_sites FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: client_teams Users can create their own team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own team" ON public.client_teams FOR INSERT WITH CHECK ((auth.uid() = primary_account_id));


--
-- Name: support_tickets Users can create their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tickets" ON public.support_tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: customer_uploads Users can create their own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own uploads" ON public.customer_uploads FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: workflows Users can create their own workflows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own workflows" ON public.workflows FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ai_messages Users can delete messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete messages in their conversations" ON public.ai_messages FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));


--
-- Name: cad_projects Users can delete own CAD projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own CAD projects" ON public.cad_projects FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: resource_allocations Users can delete own allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own allocations" ON public.resource_allocations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: api_keys Users can delete own api keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own api keys" ON public.api_keys FOR DELETE USING (public.is_owner(user_id));


--
-- Name: designer_assets Users can delete own assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own assets" ON public.designer_assets FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: automation_runs Users can delete own automation runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own automation runs" ON public.automation_runs FOR DELETE USING (public.is_owner(user_id));


--
-- Name: brand_settings Users can delete own brand settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own brand settings" ON public.brand_settings FOR DELETE USING (public.is_owner(user_id));


--
-- Name: user_calendars Users can delete own calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own calendars" ON public.user_calendars FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: designer_components Users can delete own components; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own components" ON public.designer_components FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_connections Users can delete own connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own connections" ON public.user_connections FOR DELETE USING (public.is_owner(user_id));


--
-- Name: crm_deals Users can delete own deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own deals" ON public.crm_deals FOR DELETE USING (public.is_owner(user_id));


--
-- Name: office_documents Users can delete own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own documents" ON public.office_documents FOR DELETE USING (public.is_owner(user_id));


--
-- Name: calendar_event_exceptions Users can delete own event exceptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own event exceptions" ON public.calendar_event_exceptions FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.calendar_events
  WHERE ((calendar_events.id = calendar_event_exceptions.event_id) AND (calendar_events.user_id = auth.uid())))));


--
-- Name: calendar_events Users can delete own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own events" ON public.calendar_events FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: platform_folders Users can delete own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own folders" ON public.platform_folders FOR DELETE USING (public.is_owner(user_id));


--
-- Name: kpi_goals Users can delete own kpi goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own kpi goals" ON public.kpi_goals FOR DELETE USING (public.is_owner(user_id));


--
-- Name: comm_messages Users can delete own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own messages" ON public.comm_messages FOR DELETE TO authenticated USING (((sender_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: lead_notes Users can delete own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own notes" ON public.lead_notes FOR DELETE TO authenticated USING ((author_id = auth.uid()));


--
-- Name: notifications Users can delete own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (public.is_owner(user_id));


--
-- Name: client_onboarding Users can delete own onboarding records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own onboarding records" ON public.client_onboarding FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: password_vault_items Users can delete own password vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own password vault items" ON public.password_vault_items FOR DELETE USING (public.is_owner(user_id));


--
-- Name: platform_files Users can delete own platform files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own platform files" ON public.platform_files FOR DELETE USING (public.is_owner(user_id));


--
-- Name: cad_project_versions Users can delete own project versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own project versions" ON public.cad_project_versions FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.cad_projects
  WHERE ((cad_projects.id = cad_project_versions.project_id) AND (cad_projects.user_id = auth.uid())))));


--
-- Name: business_reports Users can delete own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own reports" ON public.business_reports FOR DELETE USING (public.is_owner(user_id));


--
-- Name: rbac_roles Users can delete own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own roles" ON public.rbac_roles FOR DELETE TO authenticated USING (((created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid())));


--
-- Name: workflow_runs Users can delete own runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own runs" ON public.workflow_runs FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: automation_schedules Users can delete own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own schedules" ON public.automation_schedules FOR DELETE USING (public.is_owner(user_id));


--
-- Name: sticky_walls Users can delete own sticky walls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own sticky walls" ON public.sticky_walls FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: planner_tasks Users can delete own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own tasks" ON public.planner_tasks FOR DELETE TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid())));


--
-- Name: vault_items Users can delete own vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own vault items" ON public.vault_items FOR DELETE USING (public.is_owner(user_id));


--
-- Name: leads Users can delete their assigned leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their assigned leads" ON public.leads FOR DELETE TO authenticated USING (((assigned_to = auth.uid()) OR (assigned_to IS NULL) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: inv_companies Users can delete their own companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own companies" ON public.inv_companies FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can delete their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own conversations" ON public.ai_conversations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: designer_pages Users can delete their own pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own pages" ON public.designer_pages FOR DELETE USING (public.is_owner(user_id));


--
-- Name: designer_sites Users can delete their own sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own sites" ON public.designer_sites FOR DELETE USING (public.is_owner(user_id));


--
-- Name: customer_uploads Users can delete their own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own uploads" ON public.customer_uploads FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: workflows Users can delete their own workflows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own workflows" ON public.workflows FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: comm_messages Users can edit own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can edit own messages" ON public.comm_messages FOR UPDATE TO authenticated USING (((sender_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: rbac_audit_log Users can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert audit logs" ON public.rbac_audit_log FOR INSERT TO authenticated WITH CHECK ((performed_by = auth.uid()));


--
-- Name: leads Users can insert leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (((assigned_to = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: lead_notes Users can insert notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert notes" ON public.lead_notes FOR INSERT TO authenticated WITH CHECK ((author_id = auth.uid()));


--
-- Name: resource_allocations Users can insert own allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own allocations" ON public.resource_allocations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_branding Users can insert own branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own branding" ON public.user_branding FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_connections Users can insert own connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own connections" ON public.user_connections FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: platform_folders Users can insert own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own folders" ON public.platform_folders FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: notifications Users can insert own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: user_onboarding Users can insert own onboarding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own onboarding" ON public.user_onboarding FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: platform_files Users can insert own platform files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own platform files" ON public.platform_files FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: notification_preferences Users can insert own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own preferences" ON public.notification_preferences FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: workflow_runs Users can insert own runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own runs" ON public.workflow_runs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_sidebar_layout Users can insert own sidebar layout; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own sidebar layout" ON public.user_sidebar_layout FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vault_configs Users can insert own vault config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own vault config" ON public.vault_configs FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: vault_items Users can insert own vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own vault items" ON public.vault_items FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: lead_status_history Users can insert status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert status history" ON public.lead_status_history FOR INSERT TO authenticated WITH CHECK ((changed_by = auth.uid()));


--
-- Name: comm_channel_members Users can leave channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can leave channels" ON public.comm_channel_members FOR DELETE TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: cad_autosaves Users can manage own autosaves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own autosaves" ON public.cad_autosaves USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: comm_user_settings Users can manage own comm settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own comm settings" ON public.comm_user_settings TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: document_comments Users can manage own doc comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own doc comments" ON public.document_comments TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: document_versions Users can manage own doc versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own doc versions" ON public.document_versions TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: site_domains Users can manage own domains; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own domains" ON public.site_domains TO authenticated USING ((user_id = auth.uid()));


--
-- Name: comm_presence Users can manage own presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own presence" ON public.comm_presence FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: comm_read_receipts Users can manage own read receipts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own read receipts" ON public.comm_read_receipts TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: rbac_permissions Users can manage permissions for own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage permissions for own roles" ON public.rbac_permissions TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid()) OR (role_id IN ( SELECT rbac_roles.id
   FROM public.rbac_roles
  WHERE (rbac_roles.created_by = auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid()) OR (role_id IN ( SELECT rbac_roles.id
   FROM public.rbac_roles
  WHERE (rbac_roles.created_by = auth.uid())))));


--
-- Name: rbac_user_roles Users can manage role assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage role assignments" ON public.rbac_user_roles TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid()) OR (assigned_by = auth.uid()))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid()) OR (assigned_by = auth.uid())));


--
-- Name: proposals Users can manage their own proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own proposals" ON public.proposals USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: rbac_user_roles Users can read own role assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own role assignments" ON public.rbac_user_roles FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: comm_reactions Users can remove own reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove own reactions" ON public.comm_reactions FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: rbac_user_roles Users can remove role assignments they own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove role assignments they own" ON public.rbac_user_roles FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (assigned_by = auth.uid())));


--
-- Name: messages Users can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK ((auth.uid() = sender_id));


--
-- Name: cad_projects Users can update own CAD projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own CAD projects" ON public.cad_projects FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: resource_allocations Users can update own allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own allocations" ON public.resource_allocations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: api_keys Users can update own api keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own api keys" ON public.api_keys FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: automation_runs Users can update own automation runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own automation runs" ON public.automation_runs FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: brand_settings Users can update own brand settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own brand settings" ON public.brand_settings FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: user_branding Users can update own branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own branding" ON public.user_branding FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_calendars Users can update own calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own calendars" ON public.user_calendars FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: designer_components Users can update own components; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own components" ON public.designer_components FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_connections Users can update own connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own connections" ON public.user_connections FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: crm_deals Users can update own deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own deals" ON public.crm_deals FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: site_deployments Users can update own deployments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own deployments" ON public.site_deployments FOR UPDATE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: office_documents Users can update own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own documents" ON public.office_documents FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: calendar_event_exceptions Users can update own event exceptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own event exceptions" ON public.calendar_event_exceptions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.calendar_events
  WHERE ((calendar_events.id = calendar_event_exceptions.event_id) AND (calendar_events.user_id = auth.uid())))));


--
-- Name: calendar_events Users can update own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own events" ON public.calendar_events FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: platform_folders Users can update own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own folders" ON public.platform_folders FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: kpi_goals Users can update own kpi goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own kpi goals" ON public.kpi_goals FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: comm_channel_members Users can update own membership; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own membership" ON public.comm_channel_members FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: lead_notes Users can update own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notes" ON public.lead_notes FOR UPDATE TO authenticated USING ((author_id = auth.uid()));


--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: user_onboarding Users can update own onboarding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own onboarding" ON public.user_onboarding FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: client_onboarding Users can update own onboarding records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own onboarding records" ON public.client_onboarding FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: password_vault_configs Users can update own password vault configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own password vault configs" ON public.password_vault_configs FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: password_vault_items Users can update own password vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own password vault items" ON public.password_vault_items FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: platform_files Users can update own platform files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own platform files" ON public.platform_files FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: notification_preferences Users can update own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own preferences" ON public.notification_preferences FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: comm_presence Users can update own presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own presence" ON public.comm_presence FOR UPDATE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: business_reports Users can update own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own reports" ON public.business_reports FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: rbac_roles Users can update own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own roles" ON public.rbac_roles FOR UPDATE TO authenticated USING (((created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid())));


--
-- Name: workflow_runs Users can update own runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own runs" ON public.workflow_runs FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: automation_schedules Users can update own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own schedules" ON public.automation_schedules FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: user_sidebar_layout Users can update own sidebar layout; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own sidebar layout" ON public.user_sidebar_layout FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: sticky_walls Users can update own sticky walls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own sticky walls" ON public.sticky_walls FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: vault_configs Users can update own vault config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own vault config" ON public.vault_configs FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: vault_items Users can update own vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own vault items" ON public.vault_items FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: messages Users can update read status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update read status" ON public.messages FOR UPDATE USING ((auth.uid() = recipient_id));


--
-- Name: planner_tasks Users can update tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update tasks" ON public.planner_tasks FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR (assigned_to = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid())));


--
-- Name: leads Users can update their assigned leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their assigned leads" ON public.leads FOR UPDATE TO authenticated USING (((assigned_to = auth.uid()) OR (assigned_to IS NULL) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: call_sessions Users can update their calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their calls" ON public.call_sessions FOR UPDATE USING (((auth.uid() = caller_id) OR (auth.uid() = callee_id)));


--
-- Name: inv_companies Users can update their own companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own companies" ON public.inv_companies FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversations" ON public.ai_conversations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: designer_pages Users can update their own pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own pages" ON public.designer_pages FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: designer_sites Users can update their own sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own sites" ON public.designer_sites FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: workflows Users can update their own workflows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own workflows" ON public.workflows FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: designer_assets Users can upload own assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can upload own assets" ON public.designer_assets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: rbac_roles Users can view accessible roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view accessible roles" ON public.rbac_roles FOR SELECT TO authenticated USING (((is_system = true) OR (created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (id IN ( SELECT rbac_user_roles.role_id
   FROM public.rbac_user_roles
  WHERE (rbac_user_roles.user_id = auth.uid())))));


--
-- Name: comm_channels Users can view channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view channels" ON public.comm_channels FOR SELECT USING (((NOT is_archived) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: ai_messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.ai_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));


--
-- Name: lead_notes Users can view notes for accessible leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view notes for accessible leads" ON public.lead_notes FOR SELECT TO authenticated USING (((author_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: cad_projects Users can view own CAD projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own CAD projects" ON public.cad_projects FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: resource_allocations Users can view own allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own allocations" ON public.resource_allocations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: api_keys Users can view own api keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own api keys" ON public.api_keys FOR SELECT USING (public.is_owner(user_id));


--
-- Name: designer_assets Users can view own assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own assets" ON public.designer_assets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: rbac_audit_log Users can view own audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own audit logs" ON public.rbac_audit_log FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (performed_by = auth.uid())));


--
-- Name: automation_runs Users can view own automation runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own automation runs" ON public.automation_runs FOR SELECT USING (public.is_owner(user_id));


--
-- Name: client_billing Users can view own billing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own billing" ON public.client_billing FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: brand_settings Users can view own brand settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own brand settings" ON public.brand_settings FOR SELECT USING (public.is_owner(user_id));


--
-- Name: user_branding Users can view own branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own branding" ON public.user_branding FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_calendars Users can view own calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own calendars" ON public.user_calendars FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: designer_components Users can view own components; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own components" ON public.designer_components FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_connections Users can view own connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own connections" ON public.user_connections FOR SELECT USING (public.is_owner(user_id));


--
-- Name: conversations Users can view own conversation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own conversation" ON public.conversations FOR SELECT USING ((auth.uid() = customer_id));


--
-- Name: crm_deal_activities Users can view own deal activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own deal activities" ON public.crm_deal_activities FOR SELECT USING (public.is_owner(user_id));


--
-- Name: crm_deals Users can view own deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own deals" ON public.crm_deals FOR SELECT USING (public.is_owner(user_id));


--
-- Name: site_deployments Users can view own deployments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own deployments" ON public.site_deployments FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: office_documents Users can view own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own documents" ON public.office_documents FOR SELECT USING (public.is_owner(user_id));


--
-- Name: calendar_event_exceptions Users can view own event exceptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own event exceptions" ON public.calendar_event_exceptions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.calendar_events
  WHERE ((calendar_events.id = calendar_event_exceptions.event_id) AND (calendar_events.user_id = auth.uid())))));


--
-- Name: calendar_events Users can view own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own events" ON public.calendar_events FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: platform_folders Users can view own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own folders" ON public.platform_folders FOR SELECT USING (public.is_owner(user_id));


--
-- Name: kpi_goals Users can view own kpi goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own kpi goals" ON public.kpi_goals FOR SELECT USING (public.is_owner(user_id));


--
-- Name: team_memberships Users can view own membership; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own membership" ON public.team_memberships FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: messages Users can view own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (((auth.uid() = sender_id) OR (auth.uid() = recipient_id)));


--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (public.is_owner(user_id));


--
-- Name: user_onboarding Users can view own onboarding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own onboarding" ON public.user_onboarding FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: client_onboarding Users can view own onboarding records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own onboarding records" ON public.client_onboarding FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: password_vault_configs Users can view own password vault configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own password vault configs" ON public.password_vault_configs FOR SELECT USING (public.is_owner(user_id));


--
-- Name: password_vault_items Users can view own password vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own password vault items" ON public.password_vault_items FOR SELECT USING (public.is_owner(user_id));


--
-- Name: platform_files Users can view own platform files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own platform files" ON public.platform_files FOR SELECT USING (public.is_owner(user_id));


--
-- Name: notification_preferences Users can view own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own preferences" ON public.notification_preferences FOR SELECT USING (public.is_owner(user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: cad_project_versions Users can view own project versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own project versions" ON public.cad_project_versions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cad_projects
  WHERE ((cad_projects.id = cad_project_versions.project_id) AND (cad_projects.user_id = auth.uid())))));


--
-- Name: business_reports Users can view own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own reports" ON public.business_reports FOR SELECT USING (public.is_owner(user_id));


--
-- Name: user_roles Users can view own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: workflow_runs Users can view own runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own runs" ON public.workflow_runs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: automation_schedules Users can view own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own schedules" ON public.automation_schedules FOR SELECT USING (public.is_owner(user_id));


--
-- Name: user_sidebar_layout Users can view own sidebar layout; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sidebar layout" ON public.user_sidebar_layout FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: sticky_walls Users can view own sticky walls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sticky walls" ON public.sticky_walls FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: planner_tasks Users can view own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own tasks" ON public.planner_tasks FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (assigned_to = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR ((team_id IS NOT NULL) AND public.is_team_member(team_id))));


--
-- Name: vault_configs Users can view own vault config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own vault config" ON public.vault_configs FOR SELECT USING (public.is_owner(user_id));


--
-- Name: vault_items Users can view own vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own vault items" ON public.vault_items FOR SELECT USING (public.is_owner(user_id));


--
-- Name: rbac_permissions Users can view permissions for their roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view permissions for their roles" ON public.rbac_permissions FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid()) OR public.can_view_rbac_role(auth.uid(), role_id)));


--
-- Name: profiles Users can view profiles of channel co-members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view profiles of channel co-members" ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.comm_channel_members ccm1
     JOIN public.comm_channel_members ccm2 ON ((ccm1.channel_id = ccm2.channel_id)))
  WHERE ((ccm1.user_id = auth.uid()) AND (ccm2.user_id = profiles.user_id)))));


--
-- Name: comm_channels Users can view public channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view public channels" ON public.comm_channels FOR SELECT USING (((channel_type = ANY (ARRAY['public'::text, 'announcement'::text])) OR (id IN ( SELECT comm_channel_members.channel_id
   FROM public.comm_channel_members
  WHERE (comm_channel_members.user_id = auth.uid()))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: rbac_user_roles Users can view role assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view role assignments" ON public.rbac_user_roles FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid())));


--
-- Name: lead_status_history Users can view status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view status history" ON public.lead_status_history FOR SELECT TO authenticated USING (((changed_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: leads Users can view their assigned leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their assigned leads" ON public.leads FOR SELECT TO authenticated USING (((assigned_to = auth.uid()) OR (assigned_to IS NULL) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: ad_campaigns Users can view their own ad campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own ad campaigns" ON public.ad_campaigns FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: app_projects Users can view their own app projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own app projects" ON public.app_projects FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: call_sessions Users can view their own calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own calls" ON public.call_sessions FOR SELECT USING (((auth.uid() = caller_id) OR (auth.uid() = callee_id)));


--
-- Name: inv_companies Users can view their own companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own companies" ON public.inv_companies FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: content_requests Users can view their own content requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own content requests" ON public.content_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.ai_conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: designer_pages Users can view their own pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own pages" ON public.designer_pages FOR SELECT USING (public.is_owner(user_id));


--
-- Name: rbac_user_roles Users can view their own role assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own role assignments" ON public.rbac_user_roles FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (user_id = auth.uid()) OR (assigned_by = auth.uid())));


--
-- Name: designer_sites Users can view their own sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sites" ON public.designer_sites FOR SELECT USING (public.is_owner(user_id));


--
-- Name: social_media_accounts Users can view their own social media accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own social media accounts" ON public.social_media_accounts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: social_media_posts Users can view their own social media posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own social media posts" ON public.social_media_posts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: support_tickets Users can view their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: customer_uploads Users can view their own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own uploads" ON public.customer_uploads FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: workflows Users can view their own workflows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own workflows" ON public.workflows FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_activity_log Users insert own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own activity" ON public.user_activity_log FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: dashboard_metrics_cache Users insert own metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own metrics" ON public.dashboard_metrics_cache FOR INSERT WITH CHECK (public.is_owner(user_id));


--
-- Name: inv_stock_count_items Users manage count items for own counts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage count items for own counts" ON public.inv_stock_count_items USING ((EXISTS ( SELECT 1
   FROM public.inv_stock_counts c
  WHERE ((c.id = inv_stock_count_items.count_id) AND (c.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.inv_stock_counts c
  WHERE ((c.id = inv_stock_count_items.count_id) AND (c.user_id = auth.uid())))));


--
-- Name: cms_collections Users manage own CMS collections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own CMS collections" ON public.cms_collections USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: cms_entries Users manage own CMS entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own CMS entries" ON public.cms_entries USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: hr_employees Users manage own HR employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own HR employees" ON public.hr_employees USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: booking_availability Users manage own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own availability" ON public.booking_availability USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: booking_blocked_dates Users manage own blocked dates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own blocked dates" ON public.booking_blocked_dates USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: booking_settings Users manage own booking settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own booking settings" ON public.booking_settings USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: bookings Users manage own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own bookings" ON public.bookings USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: site_bookings Users manage own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own bookings" ON public.site_bookings USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: calculator_history Users manage own calc history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own calc history" ON public.calculator_history USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: hr_candidates Users manage own candidates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own candidates" ON public.hr_candidates USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: inv_categories Users manage own categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own categories" ON public.inv_categories USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: product_categories Users manage own categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own categories" ON public.product_categories USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: ecommerce_settings Users manage own ecommerce settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own ecommerce settings" ON public.ecommerce_settings TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: email_accounts Users manage own email accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own email accounts" ON public.email_accounts USING (public.is_owner(user_id)) WITH CHECK (public.is_owner(user_id));


--
-- Name: email_drafts Users manage own email drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own email drafts" ON public.email_drafts USING (public.is_owner(user_id)) WITH CHECK (public.is_owner(user_id));


--
-- Name: email_messages Users manage own email messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own email messages" ON public.email_messages USING (public.is_owner(user_id)) WITH CHECK (public.is_owner(user_id));


--
-- Name: expenses Users manage own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own expenses" ON public.expenses USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: inv_locations Users manage own locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own locations" ON public.inv_locations USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: inv_stock_movements Users manage own movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own movements" ON public.inv_stock_movements USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: site_orders Users manage own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own orders" ON public.site_orders USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: office_polls Users manage own polls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own polls" ON public.office_polls USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: pomodoro_sessions Users manage own pomodoro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own pomodoro" ON public.pomodoro_sessions USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: inv_products Users manage own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own products" ON public.inv_products USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: products Users manage own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own products" ON public.products USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: hr_performance_reviews Users manage own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own reviews" ON public.hr_performance_reviews USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: booking_services Users manage own services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own services" ON public.booking_services USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: inv_settings Users manage own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own settings" ON public.inv_settings USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: site_products Users manage own site products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own site products" ON public.site_products USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: booking_staff Users manage own staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own staff" ON public.booking_staff USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: inv_stock_counts Users manage own stock counts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own stock counts" ON public.inv_stock_counts USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: time_entries Users manage own time entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own time entries" ON public.time_entries USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: hr_time_off_requests Users manage own time off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own time off" ON public.hr_time_off_requests USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: product_variants Users manage own variants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own variants" ON public.product_variants USING ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_variants.product_id) AND (p.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_variants.product_id) AND (p.user_id = auth.uid())))));


--
-- Name: site_visitors Users manage own visitors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own visitors" ON public.site_visitors USING ((EXISTS ( SELECT 1
   FROM public.designer_sites s
  WHERE ((s.id = site_visitors.site_id) AND (s.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.designer_sites s
  WHERE ((s.id = site_visitors.site_id) AND (s.user_id = auth.uid())))));


--
-- Name: office_poll_votes Users manage own votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own votes" ON public.office_poll_votes USING ((auth.uid() = voter_id)) WITH CHECK ((auth.uid() = voter_id));


--
-- Name: wiki_pages Users manage own wiki pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own wiki pages" ON public.wiki_pages USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: inv_stock_levels Users manage stock for own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage stock for own products" ON public.inv_stock_levels USING ((EXISTS ( SELECT 1
   FROM public.inv_products p
  WHERE ((p.id = inv_stock_levels.product_id) AND (p.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.inv_products p
  WHERE ((p.id = inv_stock_levels.product_id) AND (p.user_id = auth.uid())))));


--
-- Name: greeting_messages Users read own enabled greeting; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own enabled greeting" ON public.greeting_messages FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: dashboard_metrics_cache Users update own metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own metrics" ON public.dashboard_metrics_cache FOR UPDATE USING (public.is_owner(user_id));


--
-- Name: user_activity_log Users view own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own activity" ON public.user_activity_log FOR SELECT USING (public.is_owner(user_id));


--
-- Name: dashboard_metrics_cache Users view own metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own metrics" ON public.dashboard_metrics_cache FOR SELECT USING (public.is_owner(user_id));


--
-- Name: acc_accountant_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_accountant_invites ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_accounting_periods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_accounting_periods ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_ap_bill_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_ap_bill_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ap_bill_lines_admin_all ON public.acc_ap_bill_lines USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ap_bill_lines_org_member ON public.acc_ap_bill_lines USING ((EXISTS ( SELECT 1
   FROM public.acc_ap_bills b
  WHERE ((b.id = acc_ap_bill_lines.bill_id) AND public.acc_is_org_member(auth.uid(), b.org_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.acc_ap_bills b
  WHERE ((b.id = acc_ap_bill_lines.bill_id) AND public.acc_is_org_member(auth.uid(), b.org_id)))));


--
-- Name: acc_ap_bills; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_ap_bills ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_ap_bills acc_ap_bills_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ap_bills_admin_all ON public.acc_ap_bills USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: acc_ap_bills acc_ap_bills_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ap_bills_org_member ON public.acc_ap_bills USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));


--
-- Name: acc_ap_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_ap_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_ap_payments acc_ap_payments_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ap_payments_admin_all ON public.acc_ap_payments USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: acc_ap_payments acc_ap_payments_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ap_payments_org_member ON public.acc_ap_payments USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));


--
-- Name: acc_ar_invoice_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_ar_invoice_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ar_invoice_lines_admin_all ON public.acc_ar_invoice_lines USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ar_invoice_lines_org_member ON public.acc_ar_invoice_lines USING ((EXISTS ( SELECT 1
   FROM public.acc_ar_invoices i
  WHERE ((i.id = acc_ar_invoice_lines.invoice_id) AND public.acc_is_org_member(auth.uid(), i.org_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.acc_ar_invoices i
  WHERE ((i.id = acc_ar_invoice_lines.invoice_id) AND public.acc_is_org_member(auth.uid(), i.org_id)))));


--
-- Name: acc_ar_invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_ar_invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_ar_invoices acc_ar_invoices_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ar_invoices_admin_all ON public.acc_ar_invoices USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: acc_ar_invoices acc_ar_invoices_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ar_invoices_org_member ON public.acc_ar_invoices USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));


--
-- Name: acc_ar_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_ar_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_ar_payments acc_ar_payments_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ar_payments_admin_all ON public.acc_ar_payments USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: acc_ar_payments acc_ar_payments_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ar_payments_org_member ON public.acc_ar_payments USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));


--
-- Name: acc_audit_log acc_audit insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_audit insert" ON public.acc_audit_log FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_audit_log acc_audit select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_audit select" ON public.acc_audit_log FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_bank_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_bank_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_bank_accounts acc_bank_accounts_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_bank_accounts_admin_all ON public.acc_bank_accounts USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: acc_bank_accounts acc_bank_accounts_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_bank_accounts_org_member ON public.acc_bank_accounts USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));


--
-- Name: acc_bank_reconciliations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_bank_reconciliations ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_bank_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_bank_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_bank_transactions acc_bank_txn_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_bank_txn_admin_all ON public.acc_bank_transactions USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: acc_bank_transactions acc_bank_txn_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_bank_txn_org_member ON public.acc_bank_transactions USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));


--
-- Name: acc_chart_of_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_chart_of_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_chart_of_accounts acc_coa select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_coa select" ON public.acc_chart_of_accounts FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_chart_of_accounts acc_coa write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_coa write" ON public.acc_chart_of_accounts TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_customers ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_customers acc_customers_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_customers_admin_all ON public.acc_customers USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: acc_customers acc_customers_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_customers_org_member ON public.acc_customers USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));


--
-- Name: acc_depreciation_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_depreciation_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_depreciation_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_depreciation_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_employees ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_fixed_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_fixed_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_fx_rates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_fx_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_accountant_invites acc_inv owner delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_inv owner delete" ON public.acc_accountant_invites FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_accountant_invites.org_id) AND (o.owner_user_id = auth.uid()))))));


--
-- Name: acc_accountant_invites acc_inv owner insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_inv owner insert" ON public.acc_accountant_invites FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_accountant_invites.org_id) AND (o.owner_user_id = auth.uid()))))));


--
-- Name: acc_accountant_invites acc_inv owner select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_inv owner select" ON public.acc_accountant_invites FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_accountant_invites.org_id) AND (o.owner_user_id = auth.uid()))))));


--
-- Name: acc_accountant_invites acc_inv owner update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_inv owner update" ON public.acc_accountant_invites FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_accountant_invites.org_id) AND (o.owner_user_id = auth.uid())))))) WITH CHECK (true);


--
-- Name: acc_journal_entries acc_je delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_je delete" ON public.acc_journal_entries FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_journal_entries acc_je insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_je insert" ON public.acc_journal_entries FOR INSERT TO authenticated WITH CHECK (((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)) AND (created_by = auth.uid())));


--
-- Name: acc_journal_entries acc_je select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_je select" ON public.acc_journal_entries FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_journal_entries acc_je update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_je update" ON public.acc_journal_entries FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_journal_lines acc_jl select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_jl select" ON public.acc_journal_lines FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.acc_journal_entries je
  WHERE ((je.id = acc_journal_lines.journal_entry_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), je.org_id))))));


--
-- Name: acc_journal_lines acc_jl write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_jl write" ON public.acc_journal_lines TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.acc_journal_entries je
  WHERE ((je.id = acc_journal_lines.journal_entry_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), je.org_id)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.acc_journal_entries je
  WHERE ((je.id = acc_journal_lines.journal_entry_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), je.org_id))))));


--
-- Name: acc_journal_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_journal_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_journal_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_journal_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_org_members acc_mem select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_mem select" ON public.acc_org_members FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_org_members.org_id) AND (o.owner_user_id = auth.uid()))))));


--
-- Name: acc_org_members acc_mem write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_mem write" ON public.acc_org_members TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_org_members.org_id) AND (o.owner_user_id = auth.uid())))))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_org_members.org_id) AND (o.owner_user_id = auth.uid()))))));


--
-- Name: acc_organizations acc_org delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_org delete" ON public.acc_organizations FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (owner_user_id = auth.uid())));


--
-- Name: acc_organizations acc_org insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_org insert" ON public.acc_organizations FOR INSERT TO authenticated WITH CHECK (((owner_user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: acc_organizations acc_org select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_org select" ON public.acc_organizations FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), id)));


--
-- Name: acc_organizations acc_org update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_org update" ON public.acc_organizations FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (owner_user_id = auth.uid()))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (owner_user_id = auth.uid())));


--
-- Name: acc_org_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_org_members ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_pay_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_pay_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_payslips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_payslips ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_accounting_periods acc_per select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_per select" ON public.acc_accounting_periods FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_accounting_periods acc_per write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_per write" ON public.acc_accounting_periods TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_bank_reconciliations acc_recon_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_recon_admin_all ON public.acc_bank_reconciliations USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: acc_bank_reconciliations acc_recon_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_recon_org_member ON public.acc_bank_reconciliations USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));


--
-- Name: acc_report_recalcs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_report_recalcs ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_suppliers acc_suppliers_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_suppliers_admin_all ON public.acc_suppliers USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: acc_suppliers acc_suppliers_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_suppliers_org_member ON public.acc_suppliers USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));


--
-- Name: acc_user_roles acc_ur select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_ur select" ON public.acc_user_roles FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (user_id = auth.uid()) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_user_roles acc_ur write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_ur write" ON public.acc_user_roles TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_user_roles.org_id) AND (o.owner_user_id = auth.uid())))))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_user_roles.org_id) AND (o.owner_user_id = auth.uid()))))));


--
-- Name: acc_user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_vat_returns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_vat_returns ENABLE ROW LEVEL SECURITY;

--
-- Name: account_type_presets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.account_type_presets ENABLE ROW LEVEL SECURITY;

--
-- Name: ad_campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: app_projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_projects ENABLE ROW LEVEL SECURITY;

--
-- Name: asset_folders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.asset_folders ENABLE ROW LEVEL SECURITY;

--
-- Name: asset_folders asset_folders_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_folders_delete ON public.asset_folders FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: asset_folders asset_folders_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_folders_insert ON public.asset_folders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: asset_folders asset_folders_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_folders_select ON public.asset_folders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: asset_folders asset_folders_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_folders_update ON public.asset_folders FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: asset_tag_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.asset_tag_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: asset_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.asset_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: asset_tags asset_tags_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_tags_delete ON public.asset_tags FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: asset_tags asset_tags_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_tags_insert ON public.asset_tags FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: asset_tags asset_tags_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_tags_select ON public.asset_tags FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: asset_tags asset_tags_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_tags_update ON public.asset_tags FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: automation_rule_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_rule_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: automation_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: automation_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: automation_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: billing_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.billing_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: blocked_ips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_availability; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_availability ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_blocked_dates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_blocked_dates ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_staff; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_staff ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_staff_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_staff_services ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: brand_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: business_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: cad_autosaves; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cad_autosaves ENABLE ROW LEVEL SECURITY;

--
-- Name: cad_project_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cad_project_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: cad_projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cad_projects ENABLE ROW LEVEL SECURITY;

--
-- Name: calculator_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calculator_history ENABLE ROW LEVEL SECURITY;

--
-- Name: calendar_event_exceptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_event_exceptions ENABLE ROW LEVEL SECURITY;

--
-- Name: calendar_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

--
-- Name: call_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: client_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: client_assets client_assets_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_assets_delete ON public.client_assets FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: client_assets client_assets_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_assets_insert ON public.client_assets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: client_assets client_assets_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_assets_select ON public.client_assets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: client_assets client_assets_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_assets_update ON public.client_assets FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: client_billing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_billing ENABLE ROW LEVEL SECURITY;

--
-- Name: client_contracts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: client_invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: client_onboarding; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;

--
-- Name: client_pricing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_pricing ENABLE ROW LEVEL SECURITY;

--
-- Name: client_teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_teams ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_collections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_collections ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: comm_channel_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_channel_members ENABLE ROW LEVEL SECURITY;

--
-- Name: comm_channels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_channels ENABLE ROW LEVEL SECURITY;

--
-- Name: comm_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: comm_presence; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_presence ENABLE ROW LEVEL SECURITY;

--
-- Name: comm_reactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_reactions ENABLE ROW LEVEL SECURITY;

--
-- Name: comm_read_receipts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_read_receipts ENABLE ROW LEVEL SECURITY;

--
-- Name: comm_user_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_user_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: content_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_activity_participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_activity_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_communication_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_communication_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_communications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_communications ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_deal_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_deal_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_deals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_financial_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_financial_links ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_financial_links crm_financial_links org access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "crm_financial_links org access" ON public.crm_financial_links TO authenticated USING ((org_id = public.get_primary_admin_id())) WITH CHECK ((org_id = public.get_primary_admin_id()));


--
-- Name: crm_lifecycle_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_lifecycle_history ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_lifecycle_stages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_lifecycle_stages ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_opportunities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_workflow_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_workflow_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_workflow_runs crm_workflow_runs org insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "crm_workflow_runs org insert" ON public.crm_workflow_runs FOR INSERT TO authenticated WITH CHECK ((org_id = public.get_primary_admin_id()));


--
-- Name: crm_workflow_runs crm_workflow_runs org read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "crm_workflow_runs org read" ON public.crm_workflow_runs FOR SELECT TO authenticated USING ((org_id = public.get_primary_admin_id()));


--
-- Name: crm_workflows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_workflows ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_workflows crm_workflows org access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "crm_workflows org access" ON public.crm_workflows TO authenticated USING ((org_id = public.get_primary_admin_id())) WITH CHECK ((org_id = public.get_primary_admin_id()));


--
-- Name: customer_uploads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: dashboard_metrics_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dashboard_metrics_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_depreciation_lines depr lines manageable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "depr lines manageable" ON public.acc_depreciation_lines TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_depreciation_lines depr lines viewable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "depr lines viewable" ON public.acc_depreciation_lines FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_depreciation_runs depr runs manageable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "depr runs manageable" ON public.acc_depreciation_runs TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_depreciation_runs depr runs viewable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "depr runs viewable" ON public.acc_depreciation_runs FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: designer_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.designer_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: designer_components; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.designer_components ENABLE ROW LEVEL SECURITY;

--
-- Name: designer_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.designer_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: designer_sites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.designer_sites ENABLE ROW LEVEL SECURITY;

--
-- Name: document_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: document_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: ecommerce_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: ecommerce_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ecommerce_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: email_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: email_drafts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;

--
-- Name: email_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_employees employees manageable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "employees manageable by org members" ON public.acc_employees TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_employees employees viewable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "employees viewable by org members" ON public.acc_employees FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: enquiries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_fixed_assets fa manageable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "fa manageable by org members" ON public.acc_fixed_assets TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_fixed_assets fa viewable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "fa viewable by org members" ON public.acc_fixed_assets FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_fx_rates fx_rates_org_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fx_rates_org_read ON public.acc_fx_rates FOR SELECT TO authenticated USING ((org_id IN ( SELECT acc_organizations.id
   FROM public.acc_organizations
  WHERE (acc_organizations.owner_user_id = auth.uid())
UNION
 SELECT acc_org_members.org_id
   FROM public.acc_org_members
  WHERE (acc_org_members.user_id = auth.uid()))));


--
-- Name: acc_fx_rates fx_rates_org_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fx_rates_org_write ON public.acc_fx_rates TO authenticated USING ((org_id IN ( SELECT acc_organizations.id
   FROM public.acc_organizations
  WHERE (acc_organizations.owner_user_id = auth.uid())
UNION
 SELECT acc_org_members.org_id
   FROM public.acc_org_members
  WHERE (acc_org_members.user_id = auth.uid())))) WITH CHECK ((org_id IN ( SELECT acc_organizations.id
   FROM public.acc_organizations
  WHERE (acc_organizations.owner_user_id = auth.uid())
UNION
 SELECT acc_org_members.org_id
   FROM public.acc_org_members
  WHERE (acc_org_members.user_id = auth.uid()))));


--
-- Name: greeting_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.greeting_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: hr_candidates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;

--
-- Name: hr_employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;

--
-- Name: hr_performance_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hr_performance_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: hr_time_off_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hr_time_off_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: inv_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: inv_companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_companies ENABLE ROW LEVEL SECURITY;

--
-- Name: inv_locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_locations ENABLE ROW LEVEL SECURITY;

--
-- Name: inv_products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_products ENABLE ROW LEVEL SECURITY;

--
-- Name: inv_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: inv_stock_count_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_stock_count_items ENABLE ROW LEVEL SECURITY;

--
-- Name: inv_stock_counts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_stock_counts ENABLE ROW LEVEL SECURITY;

--
-- Name: inv_stock_levels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_stock_levels ENABLE ROW LEVEL SECURITY;

--
-- Name: inv_stock_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_stock_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: knowledge_base; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

--
-- Name: kpi_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpi_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_imports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_imports ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_status_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: marketing_page_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketing_page_views ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: office_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.office_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: office_poll_options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.office_poll_options ENABLE ROW LEVEL SECURITY;

--
-- Name: office_poll_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.office_poll_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: office_polls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.office_polls ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_lifecycle_history org members insert lifecycle_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members insert lifecycle_history" ON public.crm_lifecycle_history FOR INSERT WITH CHECK (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: crm_activity_participants org members manage activity_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage activity_participants" ON public.crm_activity_participants USING ((EXISTS ( SELECT 1
   FROM public.crm_communications c
  WHERE ((c.id = crm_activity_participants.communication_id) AND ((c.org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.crm_communications c
  WHERE ((c.id = crm_activity_participants.communication_id) AND ((c.org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))))));


--
-- Name: crm_communication_attachments org members manage crm_comm_attachments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage crm_comm_attachments" ON public.crm_communication_attachments USING ((EXISTS ( SELECT 1
   FROM public.crm_communications c
  WHERE ((c.id = crm_communication_attachments.communication_id) AND ((c.org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.crm_communications c
  WHERE ((c.id = crm_communication_attachments.communication_id) AND ((c.org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))))));


--
-- Name: crm_communications org members manage crm_communications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage crm_communications" ON public.crm_communications USING (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: crm_companies org members manage crm_companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage crm_companies" ON public.crm_companies USING (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: crm_contacts org members manage crm_contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage crm_contacts" ON public.crm_contacts USING (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: crm_opportunities org members manage crm_opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage crm_opportunities" ON public.crm_opportunities USING (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: crm_lifecycle_stages org members manage lifecycle_stages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage lifecycle_stages" ON public.crm_lifecycle_stages USING (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: crm_lifecycle_history org members view lifecycle_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members view lifecycle_history" ON public.crm_lifecycle_history FOR SELECT USING (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: password_vault_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.password_vault_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: password_vault_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.password_vault_items ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_pay_runs pay runs manageable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "pay runs manageable by org members" ON public.acc_pay_runs TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_pay_runs pay runs viewable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "pay runs viewable by org members" ON public.acc_pay_runs FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_payslips payslips manageable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "payslips manageable by org members" ON public.acc_payslips TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_payslips payslips viewable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "payslips viewable by org members" ON public.acc_payslips FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: planner_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: platform_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.platform_files ENABLE ROW LEVEL SECURITY;

--
-- Name: platform_folders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.platform_folders ENABLE ROW LEVEL SECURITY;

--
-- Name: poll_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: pomodoro_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: product_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: product_variants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: proposals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

--
-- Name: rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: rbac_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rbac_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: rbac_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rbac_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: rbac_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rbac_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: rbac_user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rbac_user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_report_recalcs recalcs insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "recalcs insert" ON public.acc_report_recalcs FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_report_recalcs recalcs select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "recalcs select" ON public.acc_report_recalcs FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: resource_allocations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.resource_allocations ENABLE ROW LEVEL SECURITY;

--
-- Name: security_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: site_bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: site_carts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_carts ENABLE ROW LEVEL SECURITY;

--
-- Name: site_content; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

--
-- Name: site_deployments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_deployments ENABLE ROW LEVEL SECURITY;

--
-- Name: site_domains; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: site_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: site_products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_products ENABLE ROW LEVEL SECURITY;

--
-- Name: site_visitors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;

--
-- Name: social_media_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: social_media_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: sticky_walls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sticky_walls ENABLE ROW LEVEL SECURITY;

--
-- Name: storage_quotas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.storage_quotas ENABLE ROW LEVEL SECURITY;

--
-- Name: storage_quotas storage_quotas_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY storage_quotas_select ON public.storage_quotas FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscription_site_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_site_events ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_sites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_sites ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: asset_tag_assignments tag_assignments_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tag_assignments_delete ON public.asset_tag_assignments FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.client_assets
  WHERE ((client_assets.id = asset_tag_assignments.asset_id) AND (client_assets.user_id = auth.uid())))));


--
-- Name: asset_tag_assignments tag_assignments_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tag_assignments_insert ON public.asset_tag_assignments FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.client_assets
  WHERE ((client_assets.id = asset_tag_assignments.asset_id) AND (client_assets.user_id = auth.uid())))));


--
-- Name: asset_tag_assignments tag_assignments_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tag_assignments_select ON public.asset_tag_assignments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.client_assets
  WHERE ((client_assets.id = asset_tag_assignments.asset_id) AND (client_assets.user_id = auth.uid())))));


--
-- Name: team_branding; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_branding ENABLE ROW LEVEL SECURITY;

--
-- Name: team_inbox_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_inbox_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: team_memberships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

--
-- Name: time_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: two_factor_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.two_factor_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: user_activity_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

--
-- Name: user_branding; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_branding ENABLE ROW LEVEL SECURITY;

--
-- Name: user_calendars; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_calendars ENABLE ROW LEVEL SECURITY;

--
-- Name: user_connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

--
-- Name: user_onboarding; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sidebar_layout; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_sidebar_layout ENABLE ROW LEVEL SECURITY;

--
-- Name: acc_vat_returns vat returns manageable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "vat returns manageable by org members" ON public.acc_vat_returns TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: acc_vat_returns vat returns viewable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "vat returns viewable by org members" ON public.acc_vat_returns FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));


--
-- Name: vault_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vault_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: vault_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

--
-- Name: whitelisted_ips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.whitelisted_ips ENABLE ROW LEVEL SECURITY;

--
-- Name: wiki_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: workflows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION acc_seed_default_coa(_org_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.acc_seed_default_coa(_org_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.acc_seed_default_coa(_org_id uuid) TO service_role;


--
-- Name: FUNCTION crm_entity_financials(_entity_type text, _entity_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.crm_entity_financials(_entity_type text, _entity_id uuid) TO authenticated;


--
-- Name: FUNCTION crm_entity_lifetime_value(_entity_type text, _entity_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.crm_entity_lifetime_value(_entity_type text, _entity_id uuid) TO authenticated;


--
-- Name: FUNCTION crm_execute_workflow_actions(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.crm_execute_workflow_actions(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.crm_execute_workflow_actions(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb) TO authenticated;


--
-- Name: FUNCTION crm_log_communication(_kind text, _direction text, _subject text, _body text, _company_id uuid, _contact_id uuid, _opportunity_id uuid, _occurred_at timestamp with time zone, _from_address text, _to_addresses text[], _metadata jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.crm_log_communication(_kind text, _direction text, _subject text, _body text, _company_id uuid, _contact_id uuid, _opportunity_id uuid, _occurred_at timestamp with time zone, _from_address text, _to_addresses text[], _metadata jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.crm_log_communication(_kind text, _direction text, _subject text, _body text, _company_id uuid, _contact_id uuid, _opportunity_id uuid, _occurred_at timestamp with time zone, _from_address text, _to_addresses text[], _metadata jsonb) TO authenticated;


--
-- Name: FUNCTION crm_run_workflow(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.crm_run_workflow(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.crm_run_workflow(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb) TO authenticated;


--
-- Name: FUNCTION crm_timeline(_entity_type text, _entity_id uuid, _limit integer, _before timestamp with time zone); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.crm_timeline(_entity_type text, _entity_id uuid, _limit integer, _before timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION public.crm_timeline(_entity_type text, _entity_id uuid, _limit integer, _before timestamp with time zone) TO authenticated;


--
-- Name: TABLE acc_accountant_invites; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_accountant_invites TO authenticated;
GRANT ALL ON TABLE public.acc_accountant_invites TO service_role;
GRANT SELECT ON TABLE public.acc_accountant_invites TO anon;


--
-- Name: TABLE acc_accounting_periods; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_accounting_periods TO authenticated;
GRANT ALL ON TABLE public.acc_accounting_periods TO service_role;


--
-- Name: TABLE acc_ap_bills; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_ap_bills TO authenticated;
GRANT ALL ON TABLE public.acc_ap_bills TO service_role;


--
-- Name: TABLE acc_suppliers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_suppliers TO authenticated;
GRANT ALL ON TABLE public.acc_suppliers TO service_role;


--
-- Name: TABLE acc_ap_aging; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.acc_ap_aging TO authenticated;


--
-- Name: TABLE acc_ap_bill_lines; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_ap_bill_lines TO authenticated;
GRANT ALL ON TABLE public.acc_ap_bill_lines TO service_role;


--
-- Name: TABLE acc_ap_payments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_ap_payments TO authenticated;
GRANT ALL ON TABLE public.acc_ap_payments TO service_role;


--
-- Name: TABLE acc_ar_invoices; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_ar_invoices TO authenticated;
GRANT ALL ON TABLE public.acc_ar_invoices TO service_role;


--
-- Name: TABLE acc_customers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_customers TO authenticated;
GRANT ALL ON TABLE public.acc_customers TO service_role;


--
-- Name: TABLE acc_ar_aging; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.acc_ar_aging TO authenticated;


--
-- Name: TABLE acc_ar_invoice_lines; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_ar_invoice_lines TO authenticated;
GRANT ALL ON TABLE public.acc_ar_invoice_lines TO service_role;


--
-- Name: TABLE acc_ar_payments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_ar_payments TO authenticated;
GRANT ALL ON TABLE public.acc_ar_payments TO service_role;


--
-- Name: TABLE acc_audit_log; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.acc_audit_log TO authenticated;
GRANT ALL ON TABLE public.acc_audit_log TO service_role;


--
-- Name: TABLE acc_bank_accounts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_bank_accounts TO authenticated;
GRANT ALL ON TABLE public.acc_bank_accounts TO service_role;


--
-- Name: TABLE acc_bank_reconciliations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_bank_reconciliations TO authenticated;
GRANT ALL ON TABLE public.acc_bank_reconciliations TO service_role;


--
-- Name: TABLE acc_bank_transactions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_bank_transactions TO authenticated;
GRANT ALL ON TABLE public.acc_bank_transactions TO service_role;


--
-- Name: TABLE acc_chart_of_accounts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_chart_of_accounts TO authenticated;
GRANT ALL ON TABLE public.acc_chart_of_accounts TO service_role;


--
-- Name: TABLE acc_depreciation_lines; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_depreciation_lines TO authenticated;
GRANT ALL ON TABLE public.acc_depreciation_lines TO service_role;


--
-- Name: TABLE acc_depreciation_runs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_depreciation_runs TO authenticated;
GRANT ALL ON TABLE public.acc_depreciation_runs TO service_role;


--
-- Name: TABLE acc_employees; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_employees TO authenticated;
GRANT ALL ON TABLE public.acc_employees TO service_role;


--
-- Name: TABLE acc_fixed_assets; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_fixed_assets TO authenticated;
GRANT ALL ON TABLE public.acc_fixed_assets TO service_role;


--
-- Name: TABLE acc_fx_rates; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_fx_rates TO authenticated;
GRANT ALL ON TABLE public.acc_fx_rates TO service_role;


--
-- Name: TABLE acc_journal_entries; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_journal_entries TO authenticated;
GRANT ALL ON TABLE public.acc_journal_entries TO service_role;


--
-- Name: TABLE acc_journal_lines; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_journal_lines TO authenticated;
GRANT ALL ON TABLE public.acc_journal_lines TO service_role;


--
-- Name: TABLE acc_org_members; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_org_members TO authenticated;
GRANT ALL ON TABLE public.acc_org_members TO service_role;


--
-- Name: TABLE acc_organizations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_organizations TO authenticated;
GRANT ALL ON TABLE public.acc_organizations TO service_role;


--
-- Name: TABLE acc_pay_runs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_pay_runs TO authenticated;
GRANT ALL ON TABLE public.acc_pay_runs TO service_role;


--
-- Name: TABLE acc_payslips; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_payslips TO authenticated;
GRANT ALL ON TABLE public.acc_payslips TO service_role;


--
-- Name: TABLE acc_report_recalcs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.acc_report_recalcs TO authenticated;
GRANT ALL ON TABLE public.acc_report_recalcs TO service_role;


--
-- Name: TABLE acc_trial_balance; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.acc_trial_balance TO authenticated;
GRANT SELECT ON TABLE public.acc_trial_balance TO service_role;


--
-- Name: TABLE acc_user_roles; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_user_roles TO authenticated;
GRANT ALL ON TABLE public.acc_user_roles TO service_role;


--
-- Name: TABLE acc_vat_returns; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_vat_returns TO authenticated;
GRANT ALL ON TABLE public.acc_vat_returns TO service_role;


--
-- Name: TABLE account_type_presets; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.account_type_presets TO authenticated;
GRANT ALL ON TABLE public.account_type_presets TO service_role;


--
-- Name: TABLE crm_activity_participants; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_activity_participants TO authenticated;
GRANT ALL ON TABLE public.crm_activity_participants TO service_role;


--
-- Name: TABLE crm_communication_attachments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_communication_attachments TO authenticated;
GRANT ALL ON TABLE public.crm_communication_attachments TO service_role;


--
-- Name: TABLE crm_communications; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_communications TO authenticated;
GRANT ALL ON TABLE public.crm_communications TO service_role;


--
-- Name: TABLE crm_companies; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_companies TO authenticated;
GRANT ALL ON TABLE public.crm_companies TO service_role;


--
-- Name: TABLE crm_contacts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_contacts TO authenticated;
GRANT ALL ON TABLE public.crm_contacts TO service_role;


--
-- Name: TABLE crm_opportunities; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_opportunities TO authenticated;
GRANT ALL ON TABLE public.crm_opportunities TO service_role;


--
-- Name: TABLE crm_deals_compat; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.crm_deals_compat TO authenticated;


--
-- Name: TABLE crm_financial_links; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_financial_links TO authenticated;
GRANT ALL ON TABLE public.crm_financial_links TO service_role;


--
-- Name: TABLE crm_lifecycle_history; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.crm_lifecycle_history TO authenticated;
GRANT ALL ON TABLE public.crm_lifecycle_history TO service_role;


--
-- Name: TABLE crm_lifecycle_stages; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_lifecycle_stages TO authenticated;
GRANT ALL ON TABLE public.crm_lifecycle_stages TO service_role;


--
-- Name: TABLE crm_workflow_runs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.crm_workflow_runs TO authenticated;
GRANT ALL ON TABLE public.crm_workflow_runs TO service_role;


--
-- Name: TABLE crm_workflows; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_workflows TO authenticated;
GRANT ALL ON TABLE public.crm_workflows TO service_role;


--
-- Name: TABLE ecommerce_orders; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ecommerce_orders TO authenticated;
GRANT SELECT,INSERT ON TABLE public.ecommerce_orders TO anon;
GRANT ALL ON TABLE public.ecommerce_orders TO service_role;


--
-- Name: TABLE ecommerce_settings; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ecommerce_settings TO authenticated;
GRANT ALL ON TABLE public.ecommerce_settings TO service_role;


--
-- Name: TABLE greeting_messages; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.greeting_messages TO authenticated;
GRANT ALL ON TABLE public.greeting_messages TO service_role;


--
-- Name: TABLE marketing_page_views; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT ON TABLE public.marketing_page_views TO anon;
GRANT SELECT,INSERT ON TABLE public.marketing_page_views TO authenticated;
GRANT ALL ON TABLE public.marketing_page_views TO service_role;


--
-- Name: TABLE site_content; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.site_content TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.site_content TO authenticated;
GRANT ALL ON TABLE public.site_content TO service_role;


--
-- Name: TABLE subscription_site_events; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.subscription_site_events TO authenticated;
GRANT ALL ON TABLE public.subscription_site_events TO service_role;


--
-- Name: TABLE subscription_sites; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.subscription_sites TO authenticated;
GRANT ALL ON TABLE public.subscription_sites TO service_role;


--
-- PostgreSQL database dump complete
--



-- ============================================================
-- SECURITY HARDENING (C3/C4/C5) - see docs/SECURITY-AUDIT-2026-07.md
-- ============================================================
-- Security hardening: closes the six critical database-level findings from
-- docs/SECURITY-AUDIT-2026-07.md. Safe to run against an empty or a populated
-- database, and idempotent (re-running it is a no-op). Apply this AFTER the
-- consolidated schema / dump restore, before any real data is exposed.
--
-- C1 (quooro-chat) and C2 (execute-workflow) are edge-function code fixes and
-- live in supabase/functions/, not here.

-- ---------------------------------------------------------------------------
-- C3. CRM tenant isolation was a constant: get_primary_admin_id() returns the
-- same UUID for every caller, and every CRM policy compared org_id to it, so
-- any authenticated (and in places anon) user could read/write the entire CRM.
--
-- Introduce real membership and rewrite every CRM policy to gate on it. Owners
-- (admins) keep full access; everyone else sees only orgs they belong to.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_org_members (
  org_id     uuid NOT NULL,
  user_id    uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);
ALTER TABLE public.crm_org_members ENABLE ROW LEVEL SECURITY;

-- Seed the current owner org so existing single-tenant data stays reachable.
INSERT INTO public.crm_org_members (org_id, user_id)
SELECT public.get_primary_admin_id(), public.get_primary_admin_id()
WHERE public.get_primary_admin_id() IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.crm_is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_org_members m
    WHERE m.org_id = _org_id AND m.user_id = _user_id
  );
$$;

-- Admins manage membership; members can see their own rows.
DROP POLICY IF EXISTS "crm_org_members admin manage" ON public.crm_org_members;
CREATE POLICY "crm_org_members admin manage" ON public.crm_org_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "crm_org_members self read" ON public.crm_org_members;
CREATE POLICY "crm_org_members self read" ON public.crm_org_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Replace every permissive CRM policy. Each table: drop the old policy names
-- seen in the migrations, then create one membership-gated FOR ALL policy
-- scoped to authenticated (never anon).
DO $$
DECLARE
  t text;
  crm_tables text[] := ARRAY[
    'crm_companies','crm_contacts','crm_opportunities','crm_communications',
    'crm_lifecycle_stages','crm_lifecycle_history','crm_financial_links',
    'crm_workflows','crm_workflow_runs'
  ];
  pol record;
BEGIN
  FOREACH t IN ARRAY crm_tables LOOP
    IF to_regclass('public.'||t) IS NULL THEN CONTINUE; END IF;

    -- Drop ALL existing policies on the table, whatever they were named.
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- anon must never reach CRM data via default table privileges.
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);

    -- One coherent tenant policy: platform admins, or members of the row's org.
    EXECUTE format($p$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (public.has_role(auth.uid(), 'admin')
               OR public.crm_is_org_member(auth.uid(), org_id))
        WITH CHECK (public.has_role(auth.uid(), 'admin')
               OR public.crm_is_org_member(auth.uid(), org_id))
    $p$, t||'_tenant_isolation', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- C4. ecommerce_orders was world-readable: `FOR SELECT TO anon USING (true)`
-- plus GRANT SELECT to anon exposed every merchant's orders (customer email,
-- phone, shipping address, payment_intent_id) to anyone with the anon key.
--
-- Remove anon read entirely. Anonymous shoppers create an order (INSERT stays)
-- but can no longer read the table; order-status lookups must go through a
-- service-role edge function that checks a per-order token.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.ecommerce_orders') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Anyone can read a specific order" ON public.ecommerce_orders;
    REVOKE SELECT ON public.ecommerce_orders FROM anon;
    -- Keep INSERT for the anonymous-checkout flow, but the store's own key
    -- (service role / authenticated merchant) is what should read orders.
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- C5. Three SECURITY DEFINER RPCs returned the decrypted security audit trail
-- (plaintext IPs, blocked/whitelisted IP lists) to anyone, because Postgres
-- grants EXECUTE to PUBLIC by default and anon is a member of PUBLIC.
--
-- Revoke public execute; grant only to authenticated, and guard the bodies so
-- even authenticated non-admins get nothing.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regprocedure('public.get_security_logs_decrypted(integer)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.get_security_logs_decrypted(integer) FROM PUBLIC, anon;
  END IF;
  IF to_regprocedure('public.get_blocked_ips_decrypted()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.get_blocked_ips_decrypted() FROM PUBLIC, anon;
  END IF;
  IF to_regprocedure('public.get_whitelisted_ips_decrypted()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.get_whitelisted_ips_decrypted() FROM PUBLIC, anon;
  END IF;
END $$;

-- Defence in depth: an admin check inside each body, so a future accidental
-- GRANT can't re-expose them.
CREATE OR REPLACE FUNCTION public.get_security_logs_decrypted(p_limit integer DEFAULT 100)
RETURNS TABLE(id uuid, user_id uuid, event_type text, portal_attempted text, actual_role text, ip_address text, user_agent text, details jsonb, created_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT s.id, s.user_id, s.event_type, s.portal_attempted, s.actual_role,
         CASE WHEN s.ip_address LIKE 'ENC:%' THEN public.decrypt_pii(s.ip_address) ELSE s.ip_address END,
         s.user_agent, s.details::jsonb, s.created_at
  FROM public.security_logs s
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_blocked_ips_decrypted()
RETURNS TABLE(id uuid, ip_address text, blocked_by uuid, reason text, is_auto_blocked boolean, failed_attempts integer, blocked_at timestamp with time zone, expires_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT b.id,
         CASE WHEN b.ip_address LIKE 'ENC:%' THEN public.decrypt_pii(b.ip_address) ELSE b.ip_address END,
         b.blocked_by, b.reason, b.is_auto_blocked, b.failed_attempts, b.blocked_at, b.expires_at
  FROM public.blocked_ips b
  ORDER BY b.blocked_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_whitelisted_ips_decrypted()
RETURNS TABLE(id uuid, ip_address text, added_by uuid, notes text, created_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT w.id,
         CASE WHEN w.ip_address LIKE 'ENC:%' THEN public.decrypt_pii(w.ip_address) ELSE w.ip_address END,
         w.added_by, w.notes, w.created_at
  FROM public.whitelisted_ips w
  ORDER BY w.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_security_logs_decrypted(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_blocked_ips_decrypted() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_whitelisted_ips_decrypted() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_security_logs_decrypted(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_blocked_ips_decrypted() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_whitelisted_ips_decrypted() TO authenticated;
