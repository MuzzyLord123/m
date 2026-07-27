-- Simplify handle_new_user to just mark OAuth emails as verified
-- Welcome emails will be sent from client-side
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_oauth_signup boolean;
BEGIN
  -- Detect OAuth signup (Google, etc.)
  is_oauth_signup := NEW.app_metadata->>'provider' IS NOT NULL AND NEW.app_metadata->>'provider' != 'email';
  
  -- Insert profile with email_verified set based on OAuth status
  INSERT INTO public.profiles (user_id, email, full_name, email_verified)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', is_oauth_signup);
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;