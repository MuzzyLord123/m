
-- ═══════════════════════════════════════════════════════
-- TEAM COMMUNICATION HUB - Complete Schema
-- ═══════════════════════════════════════════════════════

-- 1. CHANNELS
CREATE TABLE public.comm_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  channel_type TEXT NOT NULL DEFAULT 'public' CHECK (channel_type IN ('public', 'private', 'direct', 'announcement')),
  icon TEXT DEFAULT '#',
  color TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  pinned_message_ids UUID[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comm_channels ENABLE ROW LEVEL SECURITY;

-- 2. CHANNEL MEMBERS
CREATE TABLE public.comm_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.comm_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  is_muted BOOLEAN NOT NULL DEFAULT false,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  notification_preference TEXT DEFAULT 'all' CHECK (notification_preference IN ('all', 'mentions', 'none')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.comm_channel_members ENABLE ROW LEVEL SECURITY;

-- 3. MESSAGES
CREATE TABLE public.comm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.comm_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'voice', 'system', 'code')),
  parent_id UUID REFERENCES public.comm_messages(id) ON DELETE SET NULL,
  thread_count INTEGER NOT NULL DEFAULT 0,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comm_messages ENABLE ROW LEVEL SECURITY;

-- 4. MESSAGE REACTIONS
CREATE TABLE public.comm_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.comm_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.comm_reactions ENABLE ROW LEVEL SECURITY;

-- 5. READ RECEIPTS
CREATE TABLE public.comm_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.comm_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES public.comm_messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.comm_read_receipts ENABLE ROW LEVEL SECURITY;

-- 6. USER PRESENCE
CREATE TABLE public.comm_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'dnd', 'offline', 'invisible')),
  custom_status TEXT,
  custom_emoji TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comm_presence ENABLE ROW LEVEL SECURITY;

-- 7. COMM ADMIN SETTINGS (per-user feature toggles)
CREATE TABLE public.comm_user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  show_read_receipts BOOLEAN DEFAULT true,
  show_typing_indicator BOOLEAN DEFAULT true,
  show_last_seen BOOLEAN DEFAULT true,
  notification_sound BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  email_digest TEXT DEFAULT 'none' CHECK (email_digest IN ('none', 'hourly', 'daily', 'weekly')),
  theme_preference TEXT DEFAULT 'system',
  compact_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comm_user_settings ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════

-- Channels: authenticated users can view public/default channels; members can view private
CREATE POLICY "Users can view public channels" ON public.comm_channels
  FOR SELECT TO authenticated
  USING (
    channel_type IN ('public', 'announcement') 
    OR EXISTS (SELECT 1 FROM public.comm_channel_members WHERE channel_id = id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage channels" ON public.comm_channels
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update channels" ON public.comm_channels
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete channels" ON public.comm_channels
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Channel members
CREATE POLICY "Members can view channel memberships" ON public.comm_channel_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.comm_channel_members cm WHERE cm.channel_id = channel_id AND cm.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage members" ON public.comm_channel_members
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

CREATE POLICY "Users can update own membership" ON public.comm_channel_members
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can leave channels" ON public.comm_channel_members
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Messages: channel members can read/write
CREATE POLICY "Channel members can view messages" ON public.comm_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.comm_channel_members WHERE channel_id = comm_messages.channel_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Channel members can send messages" ON public.comm_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM public.comm_channel_members WHERE channel_id = comm_messages.channel_id AND user_id = auth.uid())
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Users can edit own messages" ON public.comm_messages
  FOR UPDATE TO authenticated USING (sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own messages" ON public.comm_messages
  FOR DELETE TO authenticated USING (sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Reactions
CREATE POLICY "Channel members can view reactions" ON public.comm_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.comm_messages m 
      JOIN public.comm_channel_members cm ON cm.channel_id = m.channel_id 
      WHERE m.id = message_id AND cm.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can add reactions" ON public.comm_reactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own reactions" ON public.comm_reactions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Read receipts
CREATE POLICY "Users can manage own read receipts" ON public.comm_read_receipts
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can view channel read receipts" ON public.comm_read_receipts
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.comm_channel_members WHERE channel_id = comm_read_receipts.channel_id AND user_id = auth.uid())
  );

-- Presence
CREATE POLICY "Authenticated users can view presence" ON public.comm_presence
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own presence" ON public.comm_presence
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own presence" ON public.comm_presence
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- User settings
CREATE POLICY "Users can manage own comm settings" ON public.comm_user_settings
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════
CREATE INDEX idx_comm_messages_channel ON public.comm_messages(channel_id, created_at DESC);
CREATE INDEX idx_comm_messages_parent ON public.comm_messages(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comm_messages_sender ON public.comm_messages(sender_id);
CREATE INDEX idx_comm_channel_members_user ON public.comm_channel_members(user_id);
CREATE INDEX idx_comm_channel_members_channel ON public.comm_channel_members(channel_id);
CREATE INDEX idx_comm_reactions_message ON public.comm_reactions(message_id);
CREATE INDEX idx_comm_presence_user ON public.comm_presence(user_id);
CREATE INDEX idx_comm_presence_status ON public.comm_presence(status);

-- ═══════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════
CREATE TRIGGER update_comm_channels_updated_at BEFORE UPDATE ON public.comm_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comm_messages_updated_at BEFORE UPDATE ON public.comm_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comm_presence_updated_at BEFORE UPDATE ON public.comm_presence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comm_user_settings_updated_at BEFORE UPDATE ON public.comm_user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════
-- REALTIME
-- ═══════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.comm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comm_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comm_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comm_channel_members;

-- ═══════════════════════════════════════════════════════
-- THREAD COUNT TRIGGER
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_thread_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.comm_messages SET thread_count = thread_count + 1 WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.comm_messages SET thread_count = GREATEST(0, thread_count - 1) WHERE id = OLD.parent_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_message_thread_count
  AFTER INSERT OR DELETE ON public.comm_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_thread_count();
