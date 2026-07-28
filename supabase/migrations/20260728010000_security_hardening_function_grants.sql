-- Security hardening: SECURITY DEFINER execute grants (C8), invite escalation (C10)
--
-- C8 -----------------------------------------------------------------------
-- Postgres grants EXECUTE on new functions to PUBLIC by default, and the
-- source project never revoked it. The result is that 65 SECURITY DEFINER
-- functions -- which by definition run with the owner's rights and bypass RLS
-- entirely -- are callable by the `anon` role, i.e. by anyone holding the
-- publishable key, which ships in the browser bundle.
--
-- That surface includes the whole accounting mutation API
-- (acc_post_ar_invoice, acc_void_ap_bill, acc_pay_pay_run, acc_dispose_asset,
-- acc_post_depreciation_run, ...), which take a row uuid and write to the
-- ledger without any caller check; the role oracles (has_role,
-- has_rbac_permission, acc_is_org_member) which let an unauthenticated caller
-- test whether a given uuid is an admin; and get_primary_admin_id /
-- get_available_admin_id, which hand out admin user ids directly.
--
-- Fix: revoke EXECUTE from PUBLIC and anon across every SECURITY DEFINER
-- function in `public`, then grant it back to `authenticated` and
-- `service_role`. Logged-in users keep exactly the access they have today --
-- only the unauthenticated surface shrinks.
--
-- Trigger functions (prorettype = trigger) are deliberately skipped: they are
-- not reachable through PostgREST, and their grants are irrelevant to how
-- triggers fire.
--
-- Three functions stay anon-callable on purpose. Each takes the secret as an
-- argument and compares it internally, so the check cannot be skipped by the
-- caller:
--   verify_email_token      -- clicked from an email, before any session exists
--   get_enquiry_draft       -- token-matched, added in 20260728000000
--   get_shared_cad_project  -- token-matched, added in 20260728000000

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef                              -- SECURITY DEFINER only
      AND p.prokind = 'f'
      AND p.prorettype <> 'pg_catalog.trigger'::regtype
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
  END LOOP;
END $$;

-- Deliberately public, token-validated entry points.
DO $$
DECLARE
  sig text;
  anon_ok text[] := ARRAY[
    'public.verify_email_token(uuid)',
    'public.get_enquiry_draft(uuid)',
    'public.get_shared_cad_project(uuid)'
  ];
BEGIN
  FOREACH sig IN ARRAY anon_ok LOOP
    IF to_regprocedure(sig) IS NOT NULL THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', sig);
    END IF;
  END LOOP;
END $$;

-- decrypt_pii: restore access for logged-in users.
--
-- An earlier hardening pass revoked this from `authenticated` as well as from
-- anon/PUBLIC. That went too far: profiles.phone is encrypted by trigger for
-- *every* user (encrypt_profile_pii), and src/lib/piiDecrypt.ts calls this RPC
-- to render it, so revoking it makes every user's own phone number display as
-- the raw "ENC:..." string. Restored for `authenticated`, still denied to anon.
--
-- Residual risk, deliberately left in place because closing it is an
-- application refactor rather than a grant change: decrypt_pii(text) takes a
-- ciphertext and no ownership context, so it remains a decryption oracle for
-- any authenticated caller who obtains a ciphertext by some other route. RLS
-- is what stops them obtaining one. The durable fix is per-table gated
-- readers (the shape get_security_logs_decrypted already uses) and dropping
-- the raw RPC. See docs/SECURITY-AUDIT-2026-07.md (C5, H6).
DO $$
BEGIN
  IF to_regprocedure('public.decrypt_pii(text)') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.decrypt_pii(text) TO authenticated;
  END IF;
END $$;

-- C10 ----------------------------------------------------------------------
-- `acc_inv owner update` restricts which invite rows you may target (USING),
-- but its WITH CHECK is `true`, so the post-update row is unconstrained. An
-- org owner can therefore take one of their own invites and rewrite its
-- org_id to point at somebody else's organisation, manufacturing an accountant
-- invite into an org they have no rights over. Constrain the resulting row to
-- the same predicate that gates the target row.
DO $$
BEGIN
  IF to_regclass('public.acc_accountant_invites') IS NOT NULL THEN
    DROP POLICY IF EXISTS "acc_inv owner update" ON public.acc_accountant_invites;
    CREATE POLICY "acc_inv owner update" ON public.acc_accountant_invites
      FOR UPDATE TO authenticated
      USING (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR EXISTS (SELECT 1 FROM public.acc_organizations o
                   WHERE o.id = acc_accountant_invites.org_id
                     AND o.owner_user_id = auth.uid())
      )
      WITH CHECK (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR EXISTS (SELECT 1 FROM public.acc_organizations o
                   WHERE o.id = acc_accountant_invites.org_id
                     AND o.owner_user_id = auth.uid())
      );
  END IF;
END $$;
