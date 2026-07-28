-- CRITICAL. The schema replay created all 188 public tables but never granted
-- the PostgREST roles any table privileges, so anon/authenticated/service_role
-- had ZERO access to every table. Every read and write from the browser failed
-- with "permission denied for table ...".
--
-- That wording matters: it is a GRANT failure, not an RLS rejection (RLS says
-- "new row violates row-level security policy"). Nothing in the platform could
-- save or load - no CRM, no Quooro Office, no enquiries, no settings.
--
-- These are Supabase's standard grants. They are only safe because RLS is what
-- actually enforces access, so abort loudly if any table is unprotected rather
-- than silently exposing it.
DO $$
DECLARE unprotected int;
BEGIN
  SELECT count(*) INTO unprotected
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;

  IF unprotected > 0 THEN
    RAISE EXCEPTION
      'Refusing to grant: % public table(s) have RLS disabled. Granting would expose them.', unprotected;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- So tables added later do not silently regress to the same broken state.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
