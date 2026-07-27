-- Create blocked_ips table for storing blocked/blacklisted IPs (team-wide)
CREATE TABLE public.blocked_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  blocked_by UUID REFERENCES auth.users(id),
  reason TEXT,
  is_auto_blocked BOOLEAN DEFAULT false,
  failed_attempts INTEGER DEFAULT 0,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whitelisted_ips table for IPs that should never be blocked (team-wide)
CREATE TABLE public.whitelisted_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  added_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster IP lookups
CREATE INDEX idx_blocked_ips_ip ON public.blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_expires ON public.blocked_ips(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_whitelisted_ips_ip ON public.whitelisted_ips(ip_address);

-- Enable RLS
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelisted_ips ENABLE ROW LEVEL SECURITY;

-- RLS policies for blocked_ips - All admins can view and manage
CREATE POLICY "Admins can view all blocked IPs"
  ON public.blocked_ips FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert blocked IPs"
  ON public.blocked_ips FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blocked IPs"
  ON public.blocked_ips FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blocked IPs"
  ON public.blocked_ips FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for whitelisted_ips - All admins can view and manage
CREATE POLICY "Admins can view all whitelisted IPs"
  ON public.whitelisted_ips FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert whitelisted IPs"
  ON public.whitelisted_ips FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update whitelisted IPs"
  ON public.whitelisted_ips FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete whitelisted IPs"
  ON public.whitelisted_ips FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));