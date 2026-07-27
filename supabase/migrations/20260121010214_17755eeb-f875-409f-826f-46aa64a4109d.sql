-- Fix 1: Add 'pending' to valid_website_status constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_website_status;

ALTER TABLE public.profiles ADD CONSTRAINT valid_website_status 
CHECK (website_status = ANY (ARRAY['pending'::text, 'design'::text, 'development'::text, 'review'::text, 'live'::text, 'not_published'::text]));

-- Fix 2: Drop problematic recursive policies on team_memberships
DROP POLICY IF EXISTS "Team owners can manage team members" ON public.team_memberships;
DROP POLICY IF EXISTS "Users can view memberships in their teams" ON public.team_memberships;

-- Fix 3: Create simpler non-recursive policies for team_memberships
-- Users can view their own memberships
CREATE POLICY "Users can view own membership"
ON public.team_memberships
FOR SELECT
USING (user_id = auth.uid());

-- Team owners can view all members (check team ownership via direct column, not join)
CREATE POLICY "Primary owners can view team members"
ON public.team_memberships
FOR SELECT
USING (
  team_id IN (
    SELECT id FROM public.client_teams WHERE primary_account_id = auth.uid()
  )
);

-- Team owners can update members in their team
CREATE POLICY "Primary owners can update team members"
ON public.team_memberships
FOR UPDATE
USING (
  team_id IN (
    SELECT id FROM public.client_teams WHERE primary_account_id = auth.uid()
  )
);

-- Team owners can delete members from their team
CREATE POLICY "Primary owners can delete team members"
ON public.team_memberships
FOR DELETE
USING (
  team_id IN (
    SELECT id FROM public.client_teams WHERE primary_account_id = auth.uid()
  )
);

-- Team owners can insert members to their team  
CREATE POLICY "Primary owners can insert team members"
ON public.team_memberships
FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT id FROM public.client_teams WHERE primary_account_id = auth.uid()
  )
);