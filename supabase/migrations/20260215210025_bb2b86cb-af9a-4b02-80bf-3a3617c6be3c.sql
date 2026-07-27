
-- Fix infinite recursion in comm_channel_members SELECT policy
DROP POLICY IF EXISTS "Members can view channel memberships" ON public.comm_channel_members;
CREATE POLICY "Members can view channel memberships"
ON public.comm_channel_members FOR SELECT
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix infinite recursion in comm_channels SELECT policy
DROP POLICY IF EXISTS "Users can view public channels" ON public.comm_channels;
CREATE POLICY "Users can view public channels"
ON public.comm_channels FOR SELECT
USING (
  channel_type IN ('public', 'announcement')
  OR id IN (SELECT channel_id FROM public.comm_channel_members WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Also allow authenticated users (not just admins) to create channels
DROP POLICY IF EXISTS "Admins can manage channels" ON public.comm_channels;
CREATE POLICY "Authenticated users can create channels"
ON public.comm_channels FOR INSERT
WITH CHECK (auth.uid() = created_by);
