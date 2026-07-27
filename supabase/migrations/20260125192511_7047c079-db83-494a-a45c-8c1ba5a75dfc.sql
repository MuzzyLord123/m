-- Add email verification fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token uuid UNIQUE,
ADD COLUMN IF NOT EXISTS verification_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verification_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verification_resend_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_resend_reset_at timestamp with time zone;

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON public.profiles(verification_token) WHERE verification_token IS NOT NULL;

-- Function to generate verification token
CREATE OR REPLACE FUNCTION public.generate_verification_token(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token uuid;
BEGIN
  new_token := gen_random_uuid();
  
  UPDATE public.profiles
  SET 
    verification_token = new_token,
    verification_sent_at = now(),
    verification_expires_at = now() + interval '24 hours'
  WHERE user_id = p_user_id;
  
  RETURN new_token;
END;
$$;

-- Function to verify email token
CREATE OR REPLACE FUNCTION public.verify_email_token(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record public.profiles%ROWTYPE;
  result json;
BEGIN
  -- Find profile with matching token
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE verification_token = p_token;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid verification token');
  END IF;
  
  -- Check if token expired
  IF profile_record.verification_expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Verification token has expired');
  END IF;
  
  -- Mark email as verified and clear token
  UPDATE public.profiles
  SET 
    email_verified = true,
    verification_token = NULL,
    verification_sent_at = NULL,
    verification_expires_at = NULL,
    verification_resend_count = 0
  WHERE user_id = profile_record.user_id;
  
  RETURN json_build_object(
    'success', true, 
    'user_id', profile_record.user_id,
    'email', profile_record.email
  );
END;
$$;

-- Function to check resend rate limit (max 3 per 24 hours)
CREATE OR REPLACE FUNCTION public.check_verification_resend_limit(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('allowed', false, 'error', 'User not found');
  END IF;
  
  -- Reset counter if 24 hours have passed
  IF profile_record.verification_resend_reset_at IS NULL OR 
     profile_record.verification_resend_reset_at < now() - interval '24 hours' THEN
    UPDATE public.profiles
    SET 
      verification_resend_count = 0,
      verification_resend_reset_at = now()
    WHERE user_id = p_user_id;
    
    RETURN json_build_object('allowed', true, 'remaining', 3);
  END IF;
  
  -- Check if limit reached
  IF profile_record.verification_resend_count >= 3 THEN
    RETURN json_build_object(
      'allowed', false, 
      'error', 'Maximum resend limit reached. Try again in 24 hours.',
      'reset_at', profile_record.verification_resend_reset_at + interval '24 hours'
    );
  END IF;
  
  RETURN json_build_object(
    'allowed', true, 
    'remaining', 3 - profile_record.verification_resend_count
  );
END;
$$;

-- Function to increment resend counter
CREATE OR REPLACE FUNCTION public.increment_verification_resend(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    verification_resend_count = COALESCE(verification_resend_count, 0) + 1,
    verification_resend_reset_at = COALESCE(verification_resend_reset_at, now())
  WHERE user_id = p_user_id;
END;
$$;