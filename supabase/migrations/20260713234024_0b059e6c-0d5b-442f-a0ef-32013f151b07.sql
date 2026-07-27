
-- =========================================================
-- Accounting Phase 5: Banking & Reconciliation
-- =========================================================

-- ---------- acc_bank_accounts ----------
CREATE TABLE public.acc_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  coa_account_id uuid NOT NULL REFERENCES public.acc_chart_of_accounts(id) ON DELETE RESTRICT,
  name text NOT NULL,
  institution text,
  account_number_last4 text,
  currency text NOT NULL DEFAULT 'GBP',
  opening_balance numeric(19,4) NOT NULL DEFAULT 0,
  opening_balance_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_bank_accounts TO authenticated;
GRANT ALL ON public.acc_bank_accounts TO service_role;
ALTER TABLE public.acc_bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acc_bank_accounts_admin_all" ON public.acc_bank_accounts FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "acc_bank_accounts_org_member" ON public.acc_bank_accounts FOR ALL
  USING (public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_bank_accounts_updated BEFORE UPDATE ON public.acc_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- acc_bank_reconciliations ----------
CREATE TYPE public.acc_reconciliation_status AS ENUM ('open','completed');

CREATE TABLE public.acc_bank_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.acc_bank_accounts(id) ON DELETE CASCADE,
  statement_date date NOT NULL,
  opening_balance numeric(19,4) NOT NULL,
  closing_balance numeric(19,4) NOT NULL,
  status public.acc_reconciliation_status NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  completed_by uuid,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_bank_reconciliations TO authenticated;
GRANT ALL ON public.acc_bank_reconciliations TO service_role;
ALTER TABLE public.acc_bank_reconciliations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acc_recon_admin_all" ON public.acc_bank_reconciliations FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "acc_recon_org_member" ON public.acc_bank_reconciliations FOR ALL
  USING (public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_recon_updated BEFORE UPDATE ON public.acc_bank_reconciliations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- acc_bank_transactions ----------
CREATE TYPE public.acc_bank_txn_status AS ENUM ('unmatched','matched','reconciled','ignored');

CREATE TABLE public.acc_bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.acc_bank_accounts(id) ON DELETE CASCADE,
  txn_date date NOT NULL,
  description text NOT NULL,
  reference text,
  amount numeric(19,4) NOT NULL, -- signed: positive = money in, negative = money out
  running_balance numeric(19,4),
  status public.acc_bank_txn_status NOT NULL DEFAULT 'unmatched',
  journal_entry_id uuid REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL,
  reconciliation_id uuid REFERENCES public.acc_bank_reconciliations(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual', -- 'manual' | 'csv'
  external_id text, -- optional idempotency key from source
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bank_account_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_bank_transactions TO authenticated;
GRANT ALL ON public.acc_bank_transactions TO service_role;
ALTER TABLE public.acc_bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acc_bank_txn_admin_all" ON public.acc_bank_transactions FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "acc_bank_txn_org_member" ON public.acc_bank_transactions FOR ALL
  USING (public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
CREATE TRIGGER trg_acc_bank_txn_updated BEFORE UPDATE ON public.acc_bank_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_acc_bank_txn_account_date ON public.acc_bank_transactions(bank_account_id, txn_date DESC);
CREATE INDEX idx_acc_bank_txn_status ON public.acc_bank_transactions(bank_account_id, status);

-- =========================================================
-- Post a journal entry directly from a bank transaction
-- Positive amount (money in):  Dr Bank / Cr contra
-- Negative amount (money out): Dr contra / Cr Bank
-- =========================================================
CREATE OR REPLACE FUNCTION public.acc_create_journal_from_bank_transaction(
  _txn_id uuid, _contra_account_id uuid, _memo text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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

-- =========================================================
-- Match a bank transaction to an existing posted journal entry.
-- Requires the entry to touch this bank's COA account with an
-- amount equal to the txn amount (positive = debit on bank, negative = credit).
-- =========================================================
CREATE OR REPLACE FUNCTION public.acc_match_bank_transaction(
  _txn_id uuid, _entry_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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

-- =========================================================
-- Unmatch a bank transaction (does NOT touch the journal entry).
-- =========================================================
CREATE OR REPLACE FUNCTION public.acc_unmatch_bank_transaction(_txn_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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

-- =========================================================
-- Complete a reconciliation: verifies opening + sum(matched) = closing,
-- then flips included transactions to 'reconciled' and locks the session.
-- =========================================================
CREATE OR REPLACE FUNCTION public.acc_complete_bank_reconciliation(_recon_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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
