-- Create all encryption triggers
DROP TRIGGER IF EXISTS encrypt_security_log_ip_trigger ON public.security_logs;
CREATE TRIGGER encrypt_security_log_ip_trigger
  BEFORE INSERT OR UPDATE ON public.security_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_security_log_ip();

DROP TRIGGER IF EXISTS encrypt_profile_pii_trigger ON public.profiles;
CREATE TRIGGER encrypt_profile_pii_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_profile_pii();

DROP TRIGGER IF EXISTS encrypt_enquiry_pii_trigger ON public.enquiries;
CREATE TRIGGER encrypt_enquiry_pii_trigger
  BEFORE INSERT OR UPDATE ON public.enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_enquiry_pii();

DROP TRIGGER IF EXISTS encrypt_lead_pii_trigger ON public.leads;
CREATE TRIGGER encrypt_lead_pii_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_lead_pii();

DROP TRIGGER IF EXISTS encrypt_blocked_ip_trigger ON public.blocked_ips;
CREATE TRIGGER encrypt_blocked_ip_trigger
  BEFORE INSERT OR UPDATE ON public.blocked_ips
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_blocked_ip();

DROP TRIGGER IF EXISTS encrypt_whitelisted_ip_trigger ON public.whitelisted_ips;
CREATE TRIGGER encrypt_whitelisted_ip_trigger
  BEFORE INSERT OR UPDATE ON public.whitelisted_ips
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_whitelisted_ip();

-- Tighten RLS policies
-- Remove user insert on security_logs (use edge function instead)
DROP POLICY IF EXISTS "Authenticated users can insert own security logs" ON public.security_logs;

-- Tighten two_factor_attempts
DROP POLICY IF EXISTS "Service role can manage 2FA attempts" ON public.two_factor_attempts;
DROP POLICY IF EXISTS "Block all direct access to 2FA attempts" ON public.two_factor_attempts;
CREATE POLICY "Block all direct access to 2FA attempts"
  ON public.two_factor_attempts
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Tighten rate_limits
DROP POLICY IF EXISTS "No direct access to rate_limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Block all direct access to rate_limits" ON public.rate_limits;
CREATE POLICY "Block all direct access to rate_limits"
  ON public.rate_limits
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Make billing_audit_log truly append-only
DROP POLICY IF EXISTS "Block updates to billing audit log" ON public.billing_audit_log;
CREATE POLICY "Block updates to billing audit log"
  ON public.billing_audit_log
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "Block deletes from billing audit log" ON public.billing_audit_log;
CREATE POLICY "Block deletes from billing audit log"
  ON public.billing_audit_log
  FOR DELETE
  USING (false);