-- Fix the security_logs INSERT policy to only allow authenticated users to log their own events
DROP POLICY IF EXISTS "Service can insert security logs" ON public.security_logs;

-- Allow any authenticated user to insert their own security log entries
CREATE POLICY "Authenticated users can insert own security logs"
ON public.security_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);