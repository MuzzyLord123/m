
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'project_update', 'payment', 'file_upload', 'approval_needed', 'deadline', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT DEFAULT 'bell',
  link TEXT, -- optional route to navigate to
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_email_sent BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (public.is_owner(user_id));

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (public.is_owner(user_id));

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (public.is_owner(user_id));

-- Service role / admins can insert notifications for any user
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_project_updates BOOLEAN NOT NULL DEFAULT true,
  email_payments BOOLEAN NOT NULL DEFAULT true,
  email_file_uploads BOOLEAN NOT NULL DEFAULT false,
  email_approvals BOOLEAN NOT NULL DEFAULT true,
  email_deadlines BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences FOR SELECT
  USING (public.is_owner(user_id));

CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (public.is_owner(user_id));

CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences FOR UPDATE
  USING (public.is_owner(user_id));

-- Index for fast lookups
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger for updated_at on preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
