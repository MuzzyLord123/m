
-- Fix the overly permissive INSERT policy
DROP POLICY "Service role can insert notifications" ON public.notifications;

-- Only allow users to insert notifications for themselves (system inserts use service_role which bypasses RLS)
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_owner(user_id));
