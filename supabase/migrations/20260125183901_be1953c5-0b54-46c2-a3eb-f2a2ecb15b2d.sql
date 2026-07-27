-- Create rate_limits table for tracking API rate limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  ip_address TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(key, endpoint)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow the system (via service role) to manage rate limits
-- No client-side access
CREATE POLICY "No direct access to rate_limits"
  ON public.rate_limits
  FOR ALL
  USING (false);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_endpoint ON public.rate_limits(key, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);

-- Create function to cleanup old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '24 hours';
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE public.rate_limits IS 'Stores rate limit tracking for API endpoints. Managed by edge functions only.';