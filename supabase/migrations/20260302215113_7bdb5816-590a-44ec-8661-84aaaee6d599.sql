
-- Create a security definer function to check if user is a team owner
CREATE OR REPLACE FUNCTION public.is_team_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_teams
    WHERE primary_account_id = _user_id
  )
$$;

-- Update rbac_permissions ALL policy to include team owners
DROP POLICY IF EXISTS "Users can manage permissions for own roles" ON public.rbac_permissions;
CREATE POLICY "Users can manage permissions for own roles"
ON public.rbac_permissions
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_team_owner(auth.uid())
  OR role_id IN (SELECT id FROM public.rbac_roles WHERE created_by = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_team_owner(auth.uid())
  OR role_id IN (SELECT id FROM public.rbac_roles WHERE created_by = auth.uid())
);

-- Update rbac_permissions SELECT policy to include team owners
DROP POLICY IF EXISTS "Users can view permissions for their roles" ON public.rbac_permissions;
CREATE POLICY "Users can view permissions for their roles"
ON public.rbac_permissions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_team_owner(auth.uid())
  OR can_view_rbac_role(auth.uid(), role_id)
);

-- Update rbac_roles policies to let team owners manage all roles
DROP POLICY IF EXISTS "Users can update own roles" ON public.rbac_roles;
CREATE POLICY "Users can update own roles"
ON public.rbac_roles
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_team_owner(auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own roles" ON public.rbac_roles;
CREATE POLICY "Users can delete own roles"
ON public.rbac_roles
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_team_owner(auth.uid())
);

-- Update rbac_user_roles policies to let team owners manage assignments
DROP POLICY IF EXISTS "Users can view role assignments" ON public.rbac_user_roles;
CREATE POLICY "Users can view role assignments"
ON public.rbac_user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_team_owner(auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage role assignments" ON public.rbac_user_roles;
DROP POLICY IF EXISTS "Users can manage role assignments" ON public.rbac_user_roles;
CREATE POLICY "Users can manage role assignments"
ON public.rbac_user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_team_owner(auth.uid())
  OR assigned_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_team_owner(auth.uid())
  OR assigned_by = auth.uid()
);
