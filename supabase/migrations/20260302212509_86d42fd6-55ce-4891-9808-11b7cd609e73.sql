-- Add Discord-style fields to rbac_roles
ALTER TABLE public.rbac_roles
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#99AAB5',
  ADD COLUMN IF NOT EXISTS position integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hoist boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS icon text DEFAULT NULL;

-- Set positions for existing system roles based on hierarchy
UPDATE public.rbac_roles SET position = 100, color = '#E74C3C' WHERE name = 'Super Admin' AND is_system = true;
UPDATE public.rbac_roles SET position = 90, color = '#E67E22' WHERE name = 'Admin' AND is_system = true;
UPDATE public.rbac_roles SET position = 70, color = '#3498DB' WHERE name = 'Manager' AND is_system = true;
UPDATE public.rbac_roles SET position = 50, color = '#2ECC71' WHERE name = 'Staff' AND is_system = true;

-- Create index for position ordering
CREATE INDEX IF NOT EXISTS idx_rbac_roles_position ON public.rbac_roles (position DESC);