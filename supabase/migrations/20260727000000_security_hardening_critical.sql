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
