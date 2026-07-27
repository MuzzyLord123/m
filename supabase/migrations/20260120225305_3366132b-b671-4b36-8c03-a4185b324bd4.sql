-- =============================================
-- RLS POLICIES FOR ALL NEW TABLES
-- =============================================

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.generate_team_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
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

-- client_teams RLS policies
CREATE POLICY "Admins can view all teams"
  ON public.client_teams FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert teams"
  ON public.client_teams FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update teams"
  ON public.client_teams FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete teams"
  ON public.client_teams FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Team owners can view their team"
  ON public.client_teams FOR SELECT
  USING (auth.uid() = primary_account_id);

CREATE POLICY "Team owners can update their team"
  ON public.client_teams FOR UPDATE
  USING (auth.uid() = primary_account_id);

-- team_memberships RLS policies
CREATE POLICY "Admins can view all memberships"
  ON public.team_memberships FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all memberships"
  ON public.team_memberships FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Team members can view their team memberships"
  ON public.team_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = team_memberships.team_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage team members"
  ON public.team_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.client_teams ct
      WHERE ct.id = team_memberships.team_id
      AND ct.primary_account_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_teams ct
      WHERE ct.id = team_memberships.team_id
      AND ct.primary_account_id = auth.uid()
    )
  );

-- client_pricing RLS policies
CREATE POLICY "Admins can manage all pricing"
  ON public.client_pricing FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Team owners and financial members can view their pricing"
  ON public.client_pricing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = client_pricing.team_id
      AND tm.user_id = auth.uid()
      AND tm.member_role IN ('owner', 'financial')
    )
    AND is_visible = true
  );

-- client_contracts RLS policies
CREATE POLICY "Admins can manage all contracts"
  ON public.client_contracts FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Team owners and financial members can view their contracts"
  ON public.client_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = client_contracts.team_id
      AND tm.user_id = auth.uid()
      AND tm.member_role IN ('owner', 'financial')
    )
  );

-- client_invoices RLS policies
CREATE POLICY "Admins can manage all invoices"
  ON public.client_invoices FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Team owners and financial members can view their invoices"
  ON public.client_invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = client_invoices.team_id
      AND tm.user_id = auth.uid()
      AND tm.member_role IN ('owner', 'financial')
    )
  );

-- billing_audit_log RLS policies
CREATE POLICY "Only admins can view audit logs"
  ON public.billing_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert audit logs"
  ON public.billing_audit_log FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));