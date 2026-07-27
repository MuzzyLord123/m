-- Provide a safe way for non-admin users to discover the current primary admin user_id
-- (needed so clients can message the team without exposing roles table access)

CREATE OR REPLACE FUNCTION public.get_primary_admin_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;
$$;