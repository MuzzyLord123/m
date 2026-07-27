
-- Allow authenticated users to read roles they created or are assigned to
CREATE POLICY "Users can view roles they created"
ON public.rbac_roles FOR SELECT TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to create roles
CREATE POLICY "Users can create roles"
ON public.rbac_roles FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

-- Allow users to update their own roles
CREATE POLICY "Users can update own roles"
ON public.rbac_roles FOR UPDATE TO authenticated
USING (created_by = auth.uid());

-- Allow users to delete their own roles
CREATE POLICY "Users can delete own roles"
ON public.rbac_roles FOR DELETE TO authenticated
USING (created_by = auth.uid());

-- Also fix rbac_permissions for non-admin users
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.rbac_permissions;

CREATE POLICY "Users can view permissions for their roles"
ON public.rbac_permissions FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR role_id IN (SELECT id FROM public.rbac_roles WHERE created_by = auth.uid())
  OR role_id IN (SELECT role_id FROM public.rbac_user_roles WHERE user_id = auth.uid())
);

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

-- Fix rbac_user_roles for non-admin users
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.rbac_user_roles;

CREATE POLICY "Users can view their own role assignments"
ON public.rbac_user_roles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_id = auth.uid()
  OR role_id IN (SELECT id FROM public.rbac_roles WHERE created_by = auth.uid())
);

CREATE POLICY "Users can assign roles they own"
ON public.rbac_user_roles FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR role_id IN (SELECT id FROM public.rbac_roles WHERE created_by = auth.uid())
);

CREATE POLICY "Users can remove role assignments they own"
ON public.rbac_user_roles FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR role_id IN (SELECT id FROM public.rbac_roles WHERE created_by = auth.uid())
);

-- Fix rbac_audit_log
DROP POLICY IF EXISTS "Admins can view audit log" ON public.rbac_audit_log;
DROP POLICY IF EXISTS "Admins can insert audit log" ON public.rbac_audit_log;

CREATE POLICY "Users can view own audit logs"
ON public.rbac_audit_log FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR performed_by = auth.uid());

CREATE POLICY "Users can insert audit logs"
ON public.rbac_audit_log FOR INSERT TO authenticated
WITH CHECK (performed_by = auth.uid());
