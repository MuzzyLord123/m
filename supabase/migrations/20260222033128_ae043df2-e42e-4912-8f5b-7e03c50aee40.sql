
-- Email accounts connected by users
CREATE TABLE public.email_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'yahoo', 'icloud', 'custom')),
  email_address TEXT NOT NULL,
  display_name TEXT,
  color TEXT DEFAULT '#6366f1',
  -- OAuth tokens (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  -- IMAP/SMTP for custom providers
  imap_host TEXT,
  imap_port INTEGER,
  smtp_host TEXT,
  smtp_port INTEGER,
  imap_username TEXT,
  imap_password TEXT,
  use_ssl BOOLEAN DEFAULT true,
  -- Sync state
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_cursor TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disconnected')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Synced email messages
CREATE TABLE public.email_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  provider_message_id TEXT NOT NULL,
  thread_id TEXT,
  from_name TEXT,
  from_email TEXT,
  to_addresses JSONB DEFAULT '[]',
  cc_addresses JSONB DEFAULT '[]',
  bcc_addresses JSONB DEFAULT '[]',
  subject TEXT,
  snippet TEXT,
  body_html TEXT,
  body_text TEXT,
  date TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  labels TEXT[] DEFAULT '{}',
  folder TEXT DEFAULT 'inbox',
  category TEXT DEFAULT 'primary',
  raw_headers JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, provider_message_id)
);

-- Email drafts
CREATE TABLE public.email_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.email_accounts(id) ON DELETE SET NULL,
  to_addresses JSONB DEFAULT '[]',
  cc_addresses JSONB DEFAULT '[]',
  bcc_addresses JSONB DEFAULT '[]',
  subject TEXT DEFAULT '',
  body_html TEXT DEFAULT '',
  body_text TEXT DEFAULT '',
  attachments JSONB DEFAULT '[]',
  in_reply_to TEXT,
  is_scheduled BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own email accounts" ON public.email_accounts FOR ALL USING (public.is_owner(user_id)) WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users manage own email messages" ON public.email_messages FOR ALL USING (public.is_owner(user_id)) WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users manage own email drafts" ON public.email_drafts FOR ALL USING (public.is_owner(user_id)) WITH CHECK (public.is_owner(user_id));

-- Indexes
CREATE INDEX idx_email_accounts_user ON public.email_accounts(user_id);
CREATE INDEX idx_email_messages_account ON public.email_messages(account_id);
CREATE INDEX idx_email_messages_user ON public.email_messages(user_id);
CREATE INDEX idx_email_messages_date ON public.email_messages(date DESC);
CREATE INDEX idx_email_messages_folder ON public.email_messages(folder);
CREATE INDEX idx_email_messages_thread ON public.email_messages(thread_id);
CREATE INDEX idx_email_drafts_user ON public.email_drafts(user_id);

-- Triggers
CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON public.email_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_messages_updated_at BEFORE UPDATE ON public.email_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_drafts_updated_at BEFORE UPDATE ON public.email_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_accounts;
