-- First, create security_logs table for audit logging
CREATE TABLE public.security_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  portal_attempted text,
  actual_role text,
  ip_address text,
  user_agent text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view security logs"
ON public.security_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Service role can insert (for edge functions)
CREATE POLICY "Service can insert security logs"
ON public.security_logs
FOR INSERT
WITH CHECK (true);

-- Add index for efficient queries
CREATE INDEX idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX idx_security_logs_created_at ON public.security_logs(created_at DESC);

-- Assign admin role to the two specified admin accounts
-- First, get user IDs for the admin emails and ensure they have admin role
DO $$
DECLARE
  finley_id uuid;
  zak_id uuid;
BEGIN
  -- Get Finley's user ID
  SELECT id INTO finley_id FROM auth.users WHERE email = 'Finleyevans2005@gmail.com';
  IF finley_id IS NOT NULL THEN
    -- Delete existing role if any and insert admin
    DELETE FROM public.user_roles WHERE user_id = finley_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (finley_id, 'admin');
  END IF;

  -- Get Zak's user ID
  SELECT id INTO zak_id FROM auth.users WHERE email = 'Zakmuzzy100@gmail.com';
  IF zak_id IS NOT NULL THEN
    -- Delete existing role if any and insert admin
    DELETE FROM public.user_roles WHERE user_id = zak_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (zak_id, 'admin');
  END IF;
END $$;