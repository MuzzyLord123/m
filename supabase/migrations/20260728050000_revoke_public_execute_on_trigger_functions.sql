-- C8 follow-up. The earlier grant sweep deliberately skipped SECURITY DEFINER
-- functions returning `trigger`, leaving Postgres' default EXECUTE-to-PUBLIC in
-- place on 13 of them (including handle_new_user).
--
-- PostgREST cannot invoke a trigger function over /rest/v1/rpc, so this was not
-- directly exploitable - but the grant buys nothing either. EXECUTE on a trigger
-- function is checked at CREATE TRIGGER time, not when the trigger fires, so
-- revoking it leaves every existing trigger working. Verified empirically on a
-- throwaway table before running this against handle_new_user, which is what
-- creates profiles/user_roles on signup, and re-verified afterwards by
-- simulating a Google OAuth insert into auth.users.
DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prorettype = 'pg_catalog.trigger'::regtype
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn.sig);
  END LOOP;
END $$;
