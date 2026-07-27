-- Create a function to check if an IP is blocked (handles encrypted IPs)
-- This uses RPC with service role to bypass RLS
CREATE OR REPLACE FUNCTION public.check_ip_blocked(p_ip_address text)
RETURNS TABLE(blocked boolean, reason text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_ip text;
  decrypted_ip text;
  block_record RECORD;
BEGIN
  -- Loop through blocked IPs and compare
  FOR block_record IN SELECT * FROM public.blocked_ips
  LOOP
    stored_ip := block_record.ip_address;
    
    -- Check if stored IP is encrypted
    IF stored_ip LIKE 'ENC:%' THEN
      decrypted_ip := public.decrypt_pii(stored_ip);
    ELSE
      decrypted_ip := stored_ip;
    END IF;
    
    -- Compare with incoming IP
    IF decrypted_ip = p_ip_address THEN
      -- Check if block has expired
      IF block_record.expires_at IS NOT NULL AND block_record.expires_at < now() THEN
        -- Block expired, remove it
        DELETE FROM public.blocked_ips WHERE id = block_record.id;
        CONTINUE;
      END IF;
      
      RETURN QUERY SELECT true, block_record.reason, block_record.expires_at;
      RETURN;
    END IF;
  END LOOP;
  
  -- Not blocked
  RETURN QUERY SELECT false::boolean, NULL::text, NULL::timestamptz;
  RETURN;
END;
$$;

-- Create a function to check if an IP is whitelisted
CREATE OR REPLACE FUNCTION public.check_ip_whitelisted(p_ip_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_ip text;
  decrypted_ip text;
  whitelist_record RECORD;
BEGIN
  FOR whitelist_record IN SELECT * FROM public.whitelisted_ips
  LOOP
    stored_ip := whitelist_record.ip_address;
    
    IF stored_ip LIKE 'ENC:%' THEN
      decrypted_ip := public.decrypt_pii(stored_ip);
    ELSE
      decrypted_ip := stored_ip;
    END IF;
    
    IF decrypted_ip = p_ip_address THEN
      RETURN true;
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$;

-- Create a function to get blocked IPs with decrypted data (admin only)
CREATE OR REPLACE FUNCTION public.get_blocked_ips_decrypted()
RETURNS TABLE(
  id uuid,
  ip_address text,
  blocked_by uuid,
  reason text,
  is_auto_blocked boolean,
  failed_attempts integer,
  blocked_at timestamptz,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    CASE 
      WHEN b.ip_address LIKE 'ENC:%' THEN public.decrypt_pii(b.ip_address)
      ELSE b.ip_address
    END as ip_address,
    b.blocked_by,
    b.reason,
    b.is_auto_blocked,
    b.failed_attempts,
    b.blocked_at,
    b.expires_at
  FROM public.blocked_ips b
  ORDER BY b.blocked_at DESC;
END;
$$;

-- Create a function to get whitelisted IPs with decrypted data (admin only)
CREATE OR REPLACE FUNCTION public.get_whitelisted_ips_decrypted()
RETURNS TABLE(
  id uuid,
  ip_address text,
  added_by uuid,
  notes text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    CASE 
      WHEN w.ip_address LIKE 'ENC:%' THEN public.decrypt_pii(w.ip_address)
      ELSE w.ip_address
    END as ip_address,
    w.added_by,
    w.notes,
    w.created_at
  FROM public.whitelisted_ips w
  ORDER BY w.created_at DESC;
END;
$$;

-- Create function to decrypt security log IPs for admin viewing
CREATE OR REPLACE FUNCTION public.get_security_logs_decrypted(p_limit integer DEFAULT 100)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  event_type text,
  portal_attempted text,
  actual_role text,
  ip_address text,
  user_agent text,
  details jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.event_type,
    s.portal_attempted,
    s.actual_role,
    CASE 
      WHEN s.ip_address LIKE 'ENC:%' THEN public.decrypt_pii(s.ip_address)
      ELSE s.ip_address
    END as ip_address,
    s.user_agent,
    s.details::jsonb,
    s.created_at
  FROM public.security_logs s
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$$;