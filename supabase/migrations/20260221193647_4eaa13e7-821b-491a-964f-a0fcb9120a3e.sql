
-- Create security definer function to check channel membership
CREATE OR REPLACE FUNCTION public.is_channel_member(p_channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.comm_channel_members
    WHERE channel_id = p_channel_id AND user_id = auth.uid()
  );
$$;

-- Fix the recursive policy
DROP POLICY IF EXISTS "Members can view channel memberships" ON comm_channel_members;

CREATE POLICY "Members can view channel memberships"
ON comm_channel_members FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_channel_member(channel_id)
);

-- Also fix comm_channels SELECT if it has the same issue
DROP POLICY IF EXISTS "Members can view channels" ON comm_channels;
DROP POLICY IF EXISTS "Anyone can view non-archived channels" ON comm_channels;
DROP POLICY IF EXISTS "Users can view channels" ON comm_channels;

CREATE POLICY "Users can view channels"
ON comm_channels FOR SELECT
USING (
  NOT is_archived
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
