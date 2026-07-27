-- Update handle_new_user to detect OAuth signups and send welcome email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_oauth_signup boolean;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Detect OAuth signup (Google, etc.)
  -- OAuth users have app_metadata.provider set and email is already verified
  is_oauth_signup := NEW.app_metadata->>'provider' IS NOT NULL AND NEW.app_metadata->>'provider' != 'email';
  
  IF is_oauth_signup THEN
    -- Mark email as verified for OAuth users
    UPDATE public.profiles
    SET email_verified = true
    WHERE user_id = NEW.id;
    
    -- Send welcome email via edge function (async - doesn't block)
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('user_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;