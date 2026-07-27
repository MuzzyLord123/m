
-- Vault configuration per user (stores hashed credentials)
CREATE TABLE public.vault_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  totp_secret_encrypted TEXT NOT NULL,
  security_questions JSONB NOT NULL DEFAULT '[]',
  master_key_hash TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  failed_attempts INT NOT NULL DEFAULT 0,
  last_failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Vault items (encrypted files/secrets)
CREATE TABLE public.vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'file',
  name_encrypted TEXT NOT NULL,
  description_encrypted TEXT,
  content_encrypted TEXT,
  file_path TEXT,
  file_size BIGINT DEFAULT 0,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for vault_configs
CREATE POLICY "Users can view own vault config" ON public.vault_configs
  FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can insert own vault config" ON public.vault_configs
  FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users can update own vault config" ON public.vault_configs
  FOR UPDATE USING (public.is_owner(user_id));

-- RLS policies for vault_items
CREATE POLICY "Users can view own vault items" ON public.vault_items
  FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can insert own vault items" ON public.vault_items
  FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users can update own vault items" ON public.vault_items
  FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "Users can delete own vault items" ON public.vault_items
  FOR DELETE USING (public.is_owner(user_id));

-- Indexes
CREATE INDEX idx_vault_configs_user ON public.vault_configs(user_id);
CREATE INDEX idx_vault_items_user ON public.vault_items(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_vault_configs_updated_at BEFORE UPDATE ON public.vault_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vault_items_updated_at BEFORE UPDATE ON public.vault_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
