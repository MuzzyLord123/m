-- Add performance indexes on frequently queried columns
-- These are idempotent (IF NOT EXISTS)

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events (user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events (start_time);

CREATE INDEX IF NOT EXISTS idx_content_requests_user_id ON public.content_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_status ON public.content_requests (status);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_user_id ON public.ad_campaigns (user_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON public.ad_campaigns (status);

CREATE INDEX IF NOT EXISTS idx_client_assets_user_id ON public.client_assets (user_id);
CREATE INDEX IF NOT EXISTS idx_client_assets_folder_id ON public.client_assets (folder_id);

CREATE INDEX IF NOT EXISTS idx_crm_deals_user_id ON public.crm_deals (user_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON public.crm_deals (stage);

CREATE INDEX IF NOT EXISTS idx_comm_messages_channel_id ON public.comm_messages (channel_id);
CREATE INDEX IF NOT EXISTS idx_comm_messages_created_at ON public.comm_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_messages_sender_id ON public.comm_messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_comm_channel_members_user_id ON public.comm_channel_members (user_id);
CREATE INDEX IF NOT EXISTS idx_comm_channel_members_channel_id ON public.comm_channel_members (channel_id);

CREATE INDEX IF NOT EXISTS idx_email_messages_user_id ON public.email_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_account_id ON public.email_messages (account_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_date ON public.email_messages (date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages (conversation_id);

CREATE INDEX IF NOT EXISTS idx_app_projects_user_id ON public.app_projects (user_id);
CREATE INDEX IF NOT EXISTS idx_app_projects_status ON public.app_projects (status);

CREATE INDEX IF NOT EXISTS idx_designer_sites_user_id ON public.designer_sites (user_id);
CREATE INDEX IF NOT EXISTS idx_designer_pages_site_id ON public.designer_pages (site_id);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries (status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs (created_at DESC);
