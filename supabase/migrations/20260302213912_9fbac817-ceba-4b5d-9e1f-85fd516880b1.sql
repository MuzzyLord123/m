
-- Create a security definer function to check role ownership/assignment without triggering RLS
CREATE OR REPLACE FUNCTION public.can_view_rbac_role(_user_id uuid, _role_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rbac_roles WHERE id = _role_id AND (is_system = true OR created_by = _user_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.rbac_user_roles WHERE user_id = _user_id AND role_id = _role_id
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- Fix rbac_roles SELECT policy
DROP POLICY IF EXISTS "Users can view accessible roles" ON public.rbac_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.rbac_roles;

CREATE POLICY "Users can view accessible roles"
ON public.rbac_roles FOR SELECT TO authenticated
USING (
  is_system = true
  OR created_by = auth.uid()
  OR public.can_view_rbac_role(auth.uid(), id)
);

-- Fix rbac_user_roles SELECT to avoid cross-referencing rbac_roles
DROP POLICY IF EXISTS "Users can view their own role assignments" ON public.rbac_user_roles;

CREATE POLICY "Users can view their own role assignments"
ON public.rbac_user_roles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_id = auth.uid()
  OR assigned_by = auth.uid()
);

-- Fix rbac_permissions SELECT to avoid cross-referencing rbac_roles
DROP POLICY IF EXISTS "Users can view permissions for their roles" ON public.rbac_permissions;

CREATE POLICY "Users can view permissions for their roles"
ON public.rbac_permissions FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR public.can_view_rbac_role(auth.uid(), role_id)
);

-- Fix rbac_permissions ALL policy
DROP POLICY IF EXISTS "Users can manage permissions for own roles" ON public.rbac_permissions;

CREATE POLICY "Users can manage permissions for own roles"
ON public.rbac_permissions FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR role_id IN (SELECT id FROM public.rbac_roles WHERE created_by = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR role_id IN (SELECT id FROM public.rbac_roles WHERE created_by = auth.uid())
);

-- Fix rbac_user_roles INSERT/DELETE to use created_by check without recursive lookup
DROP POLICY IF EXISTS "Users can assign roles they own" ON public.rbac_user_roles;
DROP POLICY IF EXISTS "Users can remove role assignments they own" ON public.rbac_user_roles;

CREATE POLICY "Users can assign roles they own"
ON public.rbac_user_roles FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR assigned_by = auth.uid()
);

CREATE POLICY "Users can remove role assignments they own"
ON public.rbac_user_roles FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR assigned_by = auth.uid()
);
