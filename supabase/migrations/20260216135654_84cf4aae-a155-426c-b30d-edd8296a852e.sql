
-- Table for storing user connection credentials (encrypted via PII functions)
CREATE TABLE public.user_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own connections
CREATE POLICY "Users can view own connections" ON public.user_connections
  FOR SELECT USING (public.is_owner(user_id));

CREATE POLICY "Users can insert own connections" ON public.user_connections
  FOR INSERT WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Users can update own connections" ON public.user_connections
  FOR UPDATE USING (public.is_owner(user_id));

CREATE POLICY "Users can delete own connections" ON public.user_connections
  FOR DELETE USING (public.is_owner(user_id));

-- Auto-update timestamp
CREATE TRIGGER update_user_connections_updated_at
  BEFORE UPDATE ON public.user_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_user_connections_user_id ON public.user_connections(user_id);
CREATE INDEX idx_user_connections_provider ON public.user_connections(user_id, provider);
