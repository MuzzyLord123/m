-- Add 2FA fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret text,
ADD COLUMN IF NOT EXISTS backup_codes jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS two_factor_verified_at timestamp with time zone;

-- Create rate limiting table for 2FA attempts
CREATE TABLE IF NOT EXISTS public.two_factor_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text,
  attempt_type text NOT NULL DEFAULT 'verify', -- 'verify' or 'setup'
  success boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on rate limiting table
ALTER TABLE public.two_factor_attempts ENABLE ROW LEVEL SECURITY;

-- Only the system can manage 2FA attempts (via edge functions with service role)
CREATE POLICY "Service role can manage 2FA attempts"
ON public.two_factor_attempts
FOR ALL
USING (false)
WITH CHECK (false);

-- Index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_2fa_attempts_user_time ON public.two_factor_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_2fa ON public.profiles(two_factor_enabled);