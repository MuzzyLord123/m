-- Create all encryption trigger functions first
CREATE OR REPLACE FUNCTION public.encrypt_security_log_ip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ip_address IS NOT NULL AND NEW.ip_address != '' AND NOT NEW.ip_address LIKE 'ENC:%' THEN
    NEW.ip_address := public.encrypt_pii(NEW.ip_address);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.encrypt_profile_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NOT NEW.phone LIKE 'ENC:%' THEN
    NEW.phone := public.encrypt_pii(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.encrypt_enquiry_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NOT NEW.phone LIKE 'ENC:%' THEN
    NEW.phone := public.encrypt_pii(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.encrypt_lead_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NOT NEW.phone LIKE 'ENC:%' THEN
    NEW.phone := public.encrypt_pii(NEW.phone);
  END IF;
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NOT NEW.email LIKE 'ENC:%' THEN
    NEW.email := public.encrypt_pii(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.encrypt_blocked_ip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ip_address IS NOT NULL AND NEW.ip_address != '' AND NOT NEW.ip_address LIKE 'ENC:%' THEN
    NEW.ip_address := public.encrypt_pii(NEW.ip_address);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.encrypt_whitelisted_ip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ip_address IS NOT NULL AND NEW.ip_address != '' AND NOT NEW.ip_address LIKE 'ENC:%' THEN
    NEW.ip_address := public.encrypt_pii(NEW.ip_address);
  END IF;
  RETURN NEW;
END;
$$;