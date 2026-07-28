-- Security hardening: unvalidated share/resume tokens (C7)
--
-- Two policies inherited from the source project gate access on a token
-- *existing* rather than on the caller *presenting* the right one:
--
--   enquiries    "Public can resume drafts with token"  (SELECT, UPDATE)
--                USING (is_draft = true AND resume_token IS NOT NULL)
--   cad_projects "Anyone can view shared CAD projects"  (SELECT)
--                USING (shared_mode <> 'private' AND share_token IS NOT NULL)
--
-- Neither predicate ever compares the token to a caller-supplied value, and
-- both are granted to role `public` -- which every authenticated user is a
-- member of. The effect is that any logged-in user can read every draft
-- enquiry (name, email, phone, message body) and every non-private CAD
-- project, and can overwrite any draft enquiry. Row filtering in the client
-- (.eq('resume_token', token)) does not help: PostgREST applies it after RLS,
-- so a caller who simply omits the filter receives the whole table.
--
-- Neither feature is referenced anywhere in src/ or supabase/functions/ --
-- the columns exist but no code path reads or writes them -- so removing the
-- policies costs no working behaviour. The token-matched SECURITY DEFINER
-- readers below are the supported way to build these features later: the
-- token is an argument, so the comparison cannot be omitted by the caller.

-- C7a: enquiries draft resume ------------------------------------------------
DROP POLICY IF EXISTS "Public can resume drafts with token" ON public.enquiries;
DROP POLICY IF EXISTS "Public can update drafts with token" ON public.enquiries;

CREATE OR REPLACE FUNCTION public.get_enquiry_draft(_resume_token uuid)
RETURNS SETOF public.enquiries
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT e.*
  FROM public.enquiries e
  WHERE e.resume_token = _resume_token
    AND e.is_draft = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_enquiry_draft(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_enquiry_draft(uuid) TO anon, authenticated;

-- C7b: CAD project share links -----------------------------------------------
DROP POLICY IF EXISTS "Anyone can view shared CAD projects" ON public.cad_projects;

CREATE OR REPLACE FUNCTION public.get_shared_cad_project(_share_token uuid)
RETURNS SETOF public.cad_projects
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.*
  FROM public.cad_projects c
  WHERE c.share_token = _share_token
    AND c.shared_mode <> 'private'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_cad_project(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_cad_project(uuid) TO anon, authenticated;
