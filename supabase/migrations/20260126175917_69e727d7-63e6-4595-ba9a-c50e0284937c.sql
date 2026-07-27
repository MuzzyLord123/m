-- Fix the handle_new_user trigger - app_metadata is not accessible via NEW in auth triggers
-- Instead, we need to use raw_app_meta_data which is the actual column name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_oauth_signup boolean;
BEGIN
  -- Detect OAuth signup using raw_app_meta_data (the actual column name)
  is_oauth_signup := NEW.raw_app_meta_data->>'provider' IS NOT NULL 
                     AND NEW.raw_app_meta_data->>'provider' != 'email';
  
  -- Insert profile with email_verified set based on OAuth status
  INSERT INTO public.profiles (user_id, email, full_name, email_verified)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    is_oauth_signup
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;