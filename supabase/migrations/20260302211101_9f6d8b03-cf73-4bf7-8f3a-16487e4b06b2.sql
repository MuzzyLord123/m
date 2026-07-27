
-- ============================================
-- ENTERPRISE RBAC SYSTEM
-- ============================================

-- 1. Custom Roles table
CREATE TABLE public.rbac_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name)
);

-- 2. Module permissions per role
CREATE TABLE public.rbac_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.rbac_roles(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, module, action)
);

-- 3. User-role assignments (replaces simple user_roles for RBAC)
CREATE TABLE public.rbac_user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.rbac_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- 4. Audit log for all RBAC changes
CREATE TABLE public.rbac_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rbac_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_audit_log ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_rbac_permissions_role_id ON public.rbac_permissions(role_id);
CREATE INDEX idx_rbac_permissions_module ON public.rbac_permissions(module);
CREATE INDEX idx_rbac_user_roles_user_id ON public.rbac_user_roles(user_id);
CREATE INDEX idx_rbac_user_roles_role_id ON public.rbac_user_roles(role_id);
CREATE INDEX idx_rbac_audit_log_performed_by ON public.rbac_audit_log(performed_by);
CREATE INDEX idx_rbac_audit_log_created_at ON public.rbac_audit_log(created_at DESC);

-- RLS Policies: Only admins can manage RBAC
CREATE POLICY "Admins can manage roles" ON public.rbac_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage permissions" ON public.rbac_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own role assignments" ON public.rbac_user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user role assignments" ON public.rbac_user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read audit log" ON public.rbac_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit log" ON public.rbac_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_rbac_roles_updated_at
  BEFORE UPDATE ON public.rbac_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system roles
INSERT INTO public.rbac_roles (name, description, is_system) VALUES
  ('Super Admin', 'Full organisation control with all permissions', true),
  ('Admin', 'Administrative access with most permissions', true),
  ('Manager', 'Team and project management access', true),
  ('Staff', 'Standard employee access', true);

-- Function to check RBAC permission
CREATE OR REPLACE FUNCTION public.has_rbac_permission(
  _user_id UUID,
  _module TEXT,
  _action TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Super Admins and platform admins bypass all checks
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    -- Check RBAC role-based permission
    SELECT 1
    FROM public.rbac_user_roles ur
    JOIN public.rbac_roles r ON r.id = ur.role_id
    JOIN public.rbac_permissions p ON p.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.is_active = true
      AND p.module = _module
      AND p.action = _action
      AND p.granted = true
  )
$$;

-- Function to get all modules a user can access
CREATE OR REPLACE FUNCTION public.get_user_accessible_modules(_user_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Admins get all modules
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
    THEN ARRAY(SELECT DISTINCT module FROM public.rbac_permissions)
    ELSE ARRAY(
      SELECT DISTINCT p.module
      FROM public.rbac_user_roles ur
      JOIN public.rbac_roles r ON r.id = ur.role_id
      JOIN public.rbac_permissions p ON p.role_id = r.id
      WHERE ur.user_id = _user_id
        AND r.is_active = true
        AND p.action = 'view'
        AND p.granted = true
    )
  END
$$;
