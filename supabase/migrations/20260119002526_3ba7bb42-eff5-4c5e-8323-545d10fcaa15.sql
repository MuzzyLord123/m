-- Conversations table for tracking chat status
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL,
  assigned_admin_id uuid,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'closed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  UNIQUE(customer_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can view own conversation"
  ON public.conversations FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can create own conversation"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can view all conversations"
  ON public.conversations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all conversations"
  ON public.conversations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Team inbox settings table
CREATE TABLE public.team_inbox_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL UNIQUE,
  is_available boolean NOT NULL DEFAULT true,
  is_primary boolean NOT NULL DEFAULT false,
  last_active_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_inbox_settings ENABLE ROW LEVEL SECURITY;

-- Policies for team inbox settings
CREATE POLICY "Admins can view team inbox settings"
  ON public.team_inbox_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage team inbox settings"
  ON public.team_inbox_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Function to get available admin for new chats
CREATE OR REPLACE FUNCTION public.get_available_admin_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- First try to get primary available admin
    (SELECT admin_id FROM public.team_inbox_settings 
     WHERE is_available = true AND is_primary = true 
     LIMIT 1),
    -- Then any available admin
    (SELECT admin_id FROM public.team_inbox_settings 
     WHERE is_available = true 
     ORDER BY last_active_at DESC NULLS LAST 
     LIMIT 1),
    -- Fallback to first admin in user_roles
    (SELECT user_id FROM public.user_roles 
     WHERE role = 'admin' 
     ORDER BY created_at ASC 
     LIMIT 1)
  );
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;