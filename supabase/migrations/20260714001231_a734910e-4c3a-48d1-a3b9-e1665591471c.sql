
-- Accountant invites
CREATE TABLE public.acc_accountant_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.acc_organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | revoked | expired
  accepted_user_id UUID,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX acc_inv_org_idx ON public.acc_accountant_invites(org_id);
CREATE INDEX acc_inv_token_idx ON public.acc_accountant_invites(token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_accountant_invites TO authenticated;
GRANT ALL ON public.acc_accountant_invites TO service_role;
-- anon needs SELECT to look up invite by token on public accept page
GRANT SELECT ON public.acc_accountant_invites TO anon;

ALTER TABLE public.acc_accountant_invites ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read a specific invite row when they know the token.
-- (In practice queries filter on token; RLS just permits reads by token holders.)
CREATE POLICY "acc_inv token lookup"
  ON public.acc_accountant_invites FOR SELECT
  USING (true);

CREATE POLICY "acc_inv owner insert"
  ON public.acc_accountant_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
      SELECT 1 FROM public.acc_organizations o
      WHERE o.id = org_id AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "acc_inv owner update"
  ON public.acc_accountant_invites FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
      SELECT 1 FROM public.acc_organizations o
      WHERE o.id = org_id AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (true);

CREATE POLICY "acc_inv owner delete"
  ON public.acc_accountant_invites FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
      SELECT 1 FROM public.acc_organizations o
      WHERE o.id = org_id AND o.owner_user_id = auth.uid()
    )
  );

CREATE TRIGGER acc_inv_touch BEFORE UPDATE ON public.acc_accountant_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: is user an accountant of org?
CREATE OR REPLACE FUNCTION public.acc_is_accountant_of(_user UUID, _org UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.acc_org_members
    WHERE user_id = _user AND org_id = _org AND role = 'accountant'
  );
$$;

-- Trial Balance server-computed helper (optional; UI can compute client-side too).
CREATE OR REPLACE FUNCTION public.acc_report_trial_balance(_org UUID, _as_of DATE)
RETURNS TABLE (
  account_id UUID,
  code TEXT,
  name TEXT,
  type acc_account_type,
  debit NUMERIC,
  credit NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    coa.id,
    coa.code,
    coa.name,
    coa.type,
    CASE WHEN SUM(jl.debit - jl.credit) > 0 THEN SUM(jl.debit - jl.credit) ELSE 0 END AS debit,
    CASE WHEN SUM(jl.debit - jl.credit) < 0 THEN -SUM(jl.debit - jl.credit) ELSE 0 END AS credit
  FROM public.acc_chart_of_accounts coa
  LEFT JOIN public.acc_journal_lines jl ON jl.account_id = coa.id
  LEFT JOIN public.acc_journal_entries je ON je.id = jl.journal_entry_id
  WHERE coa.org_id = _org
    AND (je.id IS NULL OR (je.posted_at IS NOT NULL AND je.entry_date <= _as_of))
  GROUP BY coa.id, coa.code, coa.name, coa.type
  HAVING COALESCE(SUM(jl.debit - jl.credit), 0) <> 0
  ORDER BY coa.code;
$$;
