-- Allow users to see profiles of other members in their comm channels
CREATE POLICY "Users can view profiles of channel co-members"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.comm_channel_members ccm1
    JOIN public.comm_channel_members ccm2 ON ccm1.channel_id = ccm2.channel_id
    WHERE ccm1.user_id = auth.uid()
    AND ccm2.user_id = profiles.user_id
  )
);