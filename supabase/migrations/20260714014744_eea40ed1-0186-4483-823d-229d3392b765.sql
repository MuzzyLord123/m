
-- 1. Report recalculation log
CREATE TABLE IF NOT EXISTS public.acc_report_recalcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  report_name text NOT NULL,
  params jsonb,
  row_count integer,
  duration_ms integer,
  computed_by uuid,
  computed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS acc_report_recalcs_org_time_idx ON public.acc_report_recalcs (org_id, computed_at DESC);

GRANT SELECT, INSERT ON public.acc_report_recalcs TO authenticated;
GRANT ALL ON public.acc_report_recalcs TO service_role;

ALTER TABLE public.acc_report_recalcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recalcs select" ON public.acc_report_recalcs
  FOR SELECT USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE POLICY "recalcs insert" ON public.acc_report_recalcs
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.acc_report_recalcs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.acc_audit_log;

-- 2. Generic change-log trigger. Writes to acc_audit_log. Requires target table
--    to have an org_id column (all acc_* ledger tables do).
CREATE OR REPLACE FUNCTION public.acc_log_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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
END $fn$;

-- 3. Attach to key ledger tables (idempotent)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'acc_journal_entries','acc_journal_lines',
    'acc_ar_invoices','acc_ar_invoice_lines','acc_ar_payments',
    'acc_ap_bills','acc_ap_bill_lines','acc_ap_payments',
    'acc_bank_transactions','acc_bank_reconciliations',
    'acc_fixed_assets','acc_depreciation_runs',
    'acc_vat_returns','acc_accounting_periods',
    'acc_chart_of_accounts','acc_customers','acc_suppliers'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_audit ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER %I_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.acc_log_change()',
      t, t
    );
  END LOOP;
END $$;
