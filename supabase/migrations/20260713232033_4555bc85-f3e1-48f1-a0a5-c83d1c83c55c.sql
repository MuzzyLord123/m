
-- Enums (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'acc_account_type') THEN
    CREATE TYPE public.acc_account_type AS ENUM ('asset','liability','equity','revenue','expense');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'acc_period_status') THEN
    CREATE TYPE public.acc_period_status AS ENUM ('open','closed','locked');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'acc_source_type') THEN
    CREATE TYPE public.acc_source_type AS ENUM ('invoice','bill','bank','manual','payroll','adjustment','reversal','automation');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'acc_role') THEN
    CREATE TYPE public.acc_role AS ENUM ('owner','accountant','bookkeeper','approver','client_view_only');
  END IF;
END $$;

-- Tables (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.acc_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  client_team_id uuid NULL,
  name text NOT NULL,
  base_currency text NOT NULL DEFAULT 'GBP',
  fiscal_year_start date NOT NULL DEFAULT date_trunc('year', now())::date,
  vat_scheme text NOT NULL DEFAULT 'standard',
  tax_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_organizations TO authenticated;
GRANT ALL ON public.acc_organizations TO service_role;
ALTER TABLE public.acc_organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.acc_org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_org_members TO authenticated;
GRANT ALL ON public.acc_org_members TO service_role;
ALTER TABLE public.acc_org_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.acc_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.acc_role NOT NULL,
  can_post_journal boolean NOT NULL DEFAULT false,
  can_close_period boolean NOT NULL DEFAULT false,
  can_approve_payment boolean NOT NULL DEFAULT false,
  can_reopen_period boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_user_roles TO authenticated;
GRANT ALL ON public.acc_user_roles TO service_role;
ALTER TABLE public.acc_user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.acc_is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.acc_organizations o WHERE o.id = _org_id AND o.owner_user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.acc_org_members m WHERE m.org_id = _org_id AND m.user_id = _user_id);
$$;

CREATE TABLE IF NOT EXISTS public.acc_chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  type public.acc_account_type NOT NULL,
  subtype text NULL,
  parent_account_id uuid NULL REFERENCES public.acc_chart_of_accounts(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, code)
);
CREATE INDEX IF NOT EXISTS acc_coa_org_idx ON public.acc_chart_of_accounts(org_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_chart_of_accounts TO authenticated;
GRANT ALL ON public.acc_chart_of_accounts TO service_role;
ALTER TABLE public.acc_chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.acc_accounting_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status public.acc_period_status NOT NULL DEFAULT 'open',
  closed_by uuid NULL,
  closed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS acc_per_org_idx ON public.acc_accounting_periods(org_id, start_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_accounting_periods TO authenticated;
GRANT ALL ON public.acc_accounting_periods TO service_role;
ALTER TABLE public.acc_accounting_periods ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.acc_journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  description text NULL,
  source_type public.acc_source_type NOT NULL DEFAULT 'manual',
  source_id uuid NULL,
  source_ref text NULL,
  created_by uuid NOT NULL,
  posted_at timestamptz NULL,
  period_id uuid NULL REFERENCES public.acc_accounting_periods(id) ON DELETE SET NULL,
  reversed_by_entry_id uuid NULL REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL,
  is_reversal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS acc_je_org_date_idx ON public.acc_journal_entries(org_id, entry_date);
CREATE INDEX IF NOT EXISTS acc_je_source_idx   ON public.acc_journal_entries(source_type, source_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_journal_entries TO authenticated;
GRANT ALL ON public.acc_journal_entries TO service_role;
ALTER TABLE public.acc_journal_entries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.acc_journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES public.acc_journal_entries(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.acc_chart_of_accounts(id) ON DELETE RESTRICT,
  debit numeric(19,4) NOT NULL DEFAULT 0,
  credit numeric(19,4) NOT NULL DEFAULT 0,
  client_id uuid NULL,
  memo text NULL,
  tax_code text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (debit >= 0),
  CHECK (credit >= 0),
  CHECK (NOT (debit > 0 AND credit > 0))
);
CREATE INDEX IF NOT EXISTS acc_jl_entry_idx   ON public.acc_journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS acc_jl_account_idx ON public.acc_journal_lines(account_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_journal_lines TO authenticated;
GRANT ALL ON public.acc_journal_lines TO service_role;
ALTER TABLE public.acc_journal_lines ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.acc_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  actor_id uuid NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NULL,
  before_state jsonb NULL,
  after_state jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS acc_audit_org_idx ON public.acc_audit_log(org_id, created_at DESC);
GRANT SELECT, INSERT ON public.acc_audit_log TO authenticated;
GRANT ALL ON public.acc_audit_log TO service_role;
ALTER TABLE public.acc_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies (drop-then-create for idempotency)
DROP POLICY IF EXISTS "acc_org select"  ON public.acc_organizations;
DROP POLICY IF EXISTS "acc_org insert"  ON public.acc_organizations;
DROP POLICY IF EXISTS "acc_org update"  ON public.acc_organizations;
DROP POLICY IF EXISTS "acc_org delete"  ON public.acc_organizations;
CREATE POLICY "acc_org select" ON public.acc_organizations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), id));
CREATE POLICY "acc_org insert" ON public.acc_organizations FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "acc_org update" ON public.acc_organizations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR owner_user_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin') OR owner_user_id = auth.uid());
CREATE POLICY "acc_org delete" ON public.acc_organizations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR owner_user_id = auth.uid());

DROP POLICY IF EXISTS "acc_mem select" ON public.acc_org_members;
DROP POLICY IF EXISTS "acc_mem write"  ON public.acc_org_members;
CREATE POLICY "acc_mem select" ON public.acc_org_members FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.acc_organizations o WHERE o.id = org_id AND o.owner_user_id = auth.uid()));
CREATE POLICY "acc_mem write" ON public.acc_org_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')
         OR EXISTS (SELECT 1 FROM public.acc_organizations o WHERE o.id = org_id AND o.owner_user_id = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin')
         OR EXISTS (SELECT 1 FROM public.acc_organizations o WHERE o.id = org_id AND o.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "acc_ur select" ON public.acc_user_roles;
DROP POLICY IF EXISTS "acc_ur write"  ON public.acc_user_roles;
CREATE POLICY "acc_ur select" ON public.acc_user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR user_id = auth.uid() OR public.acc_is_org_member(auth.uid(), org_id));
CREATE POLICY "acc_ur write" ON public.acc_user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')
         OR EXISTS (SELECT 1 FROM public.acc_organizations o WHERE o.id = org_id AND o.owner_user_id = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin')
         OR EXISTS (SELECT 1 FROM public.acc_organizations o WHERE o.id = org_id AND o.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "acc_coa select" ON public.acc_chart_of_accounts;
DROP POLICY IF EXISTS "acc_coa write"  ON public.acc_chart_of_accounts;
CREATE POLICY "acc_coa select" ON public.acc_chart_of_accounts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE POLICY "acc_coa write" ON public.acc_chart_of_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));

DROP POLICY IF EXISTS "acc_per select" ON public.acc_accounting_periods;
DROP POLICY IF EXISTS "acc_per write"  ON public.acc_accounting_periods;
CREATE POLICY "acc_per select" ON public.acc_accounting_periods FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE POLICY "acc_per write" ON public.acc_accounting_periods FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));

DROP POLICY IF EXISTS "acc_je select" ON public.acc_journal_entries;
DROP POLICY IF EXISTS "acc_je insert" ON public.acc_journal_entries;
DROP POLICY IF EXISTS "acc_je update" ON public.acc_journal_entries;
DROP POLICY IF EXISTS "acc_je delete" ON public.acc_journal_entries;
CREATE POLICY "acc_je select" ON public.acc_journal_entries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE POLICY "acc_je insert" ON public.acc_journal_entries FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id)) AND created_by = auth.uid());
CREATE POLICY "acc_je update" ON public.acc_journal_entries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE POLICY "acc_je delete" ON public.acc_journal_entries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));

DROP POLICY IF EXISTS "acc_jl select" ON public.acc_journal_lines;
DROP POLICY IF EXISTS "acc_jl write"  ON public.acc_journal_lines;
CREATE POLICY "acc_jl select" ON public.acc_journal_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.acc_journal_entries je WHERE je.id = journal_entry_id
                 AND (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), je.org_id))));
CREATE POLICY "acc_jl write" ON public.acc_journal_lines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.acc_journal_entries je WHERE je.id = journal_entry_id
                 AND (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), je.org_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.acc_journal_entries je WHERE je.id = journal_entry_id
                 AND (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), je.org_id))));

DROP POLICY IF EXISTS "acc_audit select" ON public.acc_audit_log;
DROP POLICY IF EXISTS "acc_audit insert" ON public.acc_audit_log;
CREATE POLICY "acc_audit select" ON public.acc_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));
CREATE POLICY "acc_audit insert" ON public.acc_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.acc_is_org_member(auth.uid(), org_id));

-- Triggers
DROP TRIGGER IF EXISTS acc_org_touch  ON public.acc_organizations;
DROP TRIGGER IF EXISTS acc_ur_touch   ON public.acc_user_roles;
DROP TRIGGER IF EXISTS acc_coa_touch  ON public.acc_chart_of_accounts;
DROP TRIGGER IF EXISTS acc_per_touch  ON public.acc_accounting_periods;
DROP TRIGGER IF EXISTS acc_je_touch   ON public.acc_journal_entries;
CREATE TRIGGER acc_org_touch BEFORE UPDATE ON public.acc_organizations      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER acc_ur_touch  BEFORE UPDATE ON public.acc_user_roles         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER acc_coa_touch BEFORE UPDATE ON public.acc_chart_of_accounts  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER acc_per_touch BEFORE UPDATE ON public.acc_accounting_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER acc_je_touch  BEFORE UPDATE ON public.acc_journal_entries    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.acc_block_posted_entry_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
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
DROP TRIGGER IF EXISTS acc_je_append_only ON public.acc_journal_entries;
CREATE TRIGGER acc_je_append_only BEFORE UPDATE OR DELETE ON public.acc_journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.acc_block_posted_entry_mutation();

CREATE OR REPLACE FUNCTION public.acc_block_posted_line_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
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
DROP TRIGGER IF EXISTS acc_jl_append_only ON public.acc_journal_lines;
CREATE TRIGGER acc_jl_append_only BEFORE UPDATE OR DELETE ON public.acc_journal_lines
  FOR EACH ROW EXECUTE FUNCTION public.acc_block_posted_line_mutation();

CREATE OR REPLACE FUNCTION public.acc_enforce_period_lock()
RETURNS trigger LANGUAGE plpgsql AS $$
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
DROP TRIGGER IF EXISTS acc_je_period_lock ON public.acc_journal_entries;
CREATE TRIGGER acc_je_period_lock BEFORE INSERT OR UPDATE ON public.acc_journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.acc_enforce_period_lock();

CREATE OR REPLACE FUNCTION public.acc_check_entry_balanced()
RETURNS trigger LANGUAGE plpgsql AS $$
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
DROP TRIGGER IF EXISTS acc_je_balanced ON public.acc_journal_entries;
CREATE TRIGGER acc_je_balanced BEFORE INSERT OR UPDATE ON public.acc_journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.acc_check_entry_balanced();

-- Trial Balance live view
CREATE OR REPLACE VIEW public.acc_trial_balance AS
SELECT
  a.org_id, a.id AS account_id, a.code AS account_code, a.name AS account_name,
  a.type AS account_type, a.subtype AS account_subtype,
  COALESCE(SUM(jl.debit),0)  AS total_debit,
  COALESCE(SUM(jl.credit),0) AS total_credit,
  COALESCE(SUM(jl.debit),0) - COALESCE(SUM(jl.credit),0) AS balance
FROM public.acc_chart_of_accounts a
LEFT JOIN public.acc_journal_lines   jl ON jl.account_id = a.id
LEFT JOIN public.acc_journal_entries je ON je.id = jl.journal_entry_id AND je.posted_at IS NOT NULL
GROUP BY a.org_id, a.id, a.code, a.name, a.type, a.subtype;
GRANT SELECT ON public.acc_trial_balance TO authenticated, service_role;
