-- Fix: Allow users to see ALL members of channels they belong to (not just their own row)
DROP POLICY IF EXISTS "Members can view channel memberships" ON comm_channel_members;

CREATE POLICY "Members can view channel memberships"
ON comm_channel_members FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR channel_id IN (
    SELECT channel_id FROM comm_channel_members WHERE user_id = auth.uid()
  )
);