
-- Password Vault configuration (mirrors vault_configs security model)
CREATE TABLE public.password_vault_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vault_name TEXT NOT NULL DEFAULT 'Password Vault',
  password_hash TEXT NOT NULL,
  totp_secret_encrypted TEXT NOT NULL,
  security_questions JSONB NOT NULL,
  master_key_hash TEXT NOT NULL,
  master_key_encrypted TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.password_vault_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own password vault configs"
  ON public.password_vault_configs FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can create own password vault configs"
  ON public.password_vault_configs FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users can update own password vault configs"
  ON public.password_vault_configs FOR UPDATE USING (public.is_owner(user_id));

CREATE INDEX idx_pw_vault_configs_user ON public.password_vault_configs(user_id);

-- Password Vault items (encrypted password entries)
CREATE TABLE public.password_vault_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vault_id UUID NOT NULL REFERENCES public.password_vault_configs(id) ON DELETE CASCADE,
  title_encrypted TEXT NOT NULL,
  username_encrypted TEXT,
  password_encrypted TEXT,
  url_encrypted TEXT,
  notes_encrypted TEXT,
  category TEXT NOT NULL DEFAULT 'logins',
  has_2fa BOOLEAN NOT NULL DEFAULT false,
  starred BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.password_vault_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own password vault items"
  ON public.password_vault_items FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can create own password vault items"
  ON public.password_vault_items FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users can update own password vault items"
  ON public.password_vault_items FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "Users can delete own password vault items"
  ON public.password_vault_items FOR DELETE USING (public.is_owner(user_id));

CREATE INDEX idx_pw_vault_items_vault ON public.password_vault_items(vault_id);
CREATE INDEX idx_pw_vault_items_user ON public.password_vault_items(user_id);

-- Updated_at triggers
CREATE TRIGGER update_pw_vault_configs_updated_at
  BEFORE UPDATE ON public.password_vault_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pw_vault_items_updated_at
  BEFORE UPDATE ON public.password_vault_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
