
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view accessible roles" ON public.rbac_roles;

-- Create a simple policy that doesn't call any function that references rbac_roles
CREATE POLICY "Users can view accessible roles"
ON public.rbac_roles FOR SELECT TO authenticated
USING (
  is_system = true
  OR created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR id IN (SELECT role_id FROM public.rbac_user_roles WHERE user_id = auth.uid())
);
