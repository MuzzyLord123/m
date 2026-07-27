-- =====================================================
-- COMPREHENSIVE RLS SECURITY HARDENING (Idempotent)
-- =====================================================

-- 1. Create ownership helper function for cleaner policies
CREATE OR REPLACE FUNCTION public.is_owner(row_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN auth.uid() = row_user_id;
END;
$$;

-- 2. Create function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE team_id = p_team_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.client_teams
    WHERE id = p_team_id AND primary_account_id = auth.uid()
  );
$$;

-- =====================================================
-- STORAGE_QUOTAS - Add missing policies
-- =====================================================

-- Admins can view all quotas for management
DO $$ BEGIN
  CREATE POLICY "Admins can view all storage quotas"
    ON public.storage_quotas FOR SELECT
    USING (has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update storage quotas"
    ON public.storage_quotas FOR UPDATE
    USING (has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- CONVERSATIONS - Add missing DELETE policy
-- =====================================================

DO $$ BEGIN
  CREATE POLICY "Admins can delete conversations"
    ON public.conversations FOR DELETE
    USING (has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- MESSAGES - Add admin management policies
-- =====================================================

DO $$ BEGIN
  CREATE POLICY "Admins can update messages"
    ON public.messages FOR UPDATE
    USING (has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete messages"
    ON public.messages FOR DELETE
    USING (has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- USER_ROLES - Ensure proper protection
-- =====================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can only view their own role
DO $$ BEGIN
  CREATE POLICY "Users can view own role"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only admins can manage roles (prevent privilege escalation)
DO $$ BEGIN
  CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert roles"
    ON public.user_roles FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update roles"
    ON public.user_roles FOR UPDATE
    USING (has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete roles"
    ON public.user_roles FOR DELETE
    USING (has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- Add indexes for RLS policy performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_team_memberships_user_id ON public.team_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_team_id ON public.team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_client_teams_primary_account ON public.client_teams(primary_account_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- =====================================================
-- Documentation comments
-- =====================================================

COMMENT ON FUNCTION public.is_owner IS 'Helper function to check if current user owns a row. Used in RLS policies.';
COMMENT ON FUNCTION public.is_team_member IS 'Helper function to check if current user is a member of a team. Used in RLS policies.';