-- Allow users to create their own client team (as primary account holder)
CREATE POLICY "Users can create their own team"
ON public.client_teams
FOR INSERT
WITH CHECK (auth.uid() = primary_account_id);

-- Allow users to insert their own membership after team creation
CREATE POLICY "Users can add themselves to team as owner"
ON public.team_memberships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Fix potential recursion by using a simpler policy for viewing own memberships
DROP POLICY IF EXISTS "Team members can view their team memberships" ON public.team_memberships;

CREATE POLICY "Users can view memberships in their teams"
ON public.team_memberships
FOR SELECT
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM client_teams ct 
    WHERE ct.id = team_memberships.team_id 
    AND ct.primary_account_id = auth.uid()
  )
);