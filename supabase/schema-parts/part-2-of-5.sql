SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;
--
-- Name: ad_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    platform text NOT NULL,
    campaign_name text NOT NULL,
    creative_url text,
    creative_type text DEFAULT 'image'::text,
    status text DEFAULT 'running'::text NOT NULL,
    objective text,
    start_date date,
    monthly_budget numeric(10,2),
    notes text,
    last_updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ad_campaigns_creative_type_check CHECK ((creative_type = ANY (ARRAY['image'::text, 'video'::text]))),
    CONSTRAINT ad_campaigns_objective_check CHECK ((objective = ANY (ARRAY['leads'::text, 'traffic'::text, 'sales'::text, 'awareness'::text, 'engagement'::text]))),
    CONSTRAINT ad_campaigns_platform_check CHECK ((platform = ANY (ARRAY['meta'::text, 'tiktok'::text, 'google'::text, 'linkedin'::text, 'twitter'::text]))),
    CONSTRAINT ad_campaigns_status_check CHECK ((status = ANY (ARRAY['running'::text, 'paused'::text, 'completed'::text, 'scheduled'::text])))
);
--
-- Name: ai_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text DEFAULT 'New conversation'::text NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: ai_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);
--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    key_name text NOT NULL,
    key_prefix text NOT NULL,
    key_hash text NOT NULL,
    permissions jsonb DEFAULT '["read"]'::jsonb,
    rate_limit integer DEFAULT 100,
    last_used_at timestamp with time zone,
    usage_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: app_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_name text NOT NULL,
    project_type text DEFAULT 'dashboard'::text NOT NULL,
    description text,
    status text DEFAULT 'planning'::text NOT NULL,
    priority text DEFAULT 'normal'::text,
    estimated_hours integer,
    actual_hours integer DEFAULT 0,
    start_date date,
    target_completion_date date,
    completed_at timestamp with time zone,
    features jsonb DEFAULT '[]'::jsonb,
    tech_stack jsonb DEFAULT '[]'::jsonb,
    milestones jsonb DEFAULT '[]'::jsonb,
    notes text,
    admin_notes text,
    preview_url text,
    production_url text,
    repository_url text,
    assigned_to text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: asset_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    parent_id uuid,
    color text DEFAULT '#00b8d4'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: asset_tag_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_tag_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: asset_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#00b8d4'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: automation_rule_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_rule_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rule_id uuid NOT NULL,
    trigger_data jsonb DEFAULT '{}'::jsonb,
    action_result jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'success'::text NOT NULL,
    error_message text,
    executed_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: automation_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    trigger_event text NOT NULL,
    trigger_config jsonb DEFAULT '{}'::jsonb,
    conditions jsonb DEFAULT '[]'::jsonb,
    action_type text NOT NULL,
    action_config jsonb DEFAULT '{}'::jsonb,
    last_triggered_at timestamp with time zone,
    trigger_count integer DEFAULT 0 NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: automation_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    workflow_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    duration_ms integer,
    node_results jsonb,
    error_message text,
    trigger_type text,
    trigger_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: automation_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    workflow_id uuid,
    schedule_name text NOT NULL,
    cron_expression text DEFAULT '0 9 * * 1'::text NOT NULL,
    is_active boolean DEFAULT true,
    last_run_at timestamp with time zone,
    next_run_at timestamp with time zone,
    run_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: billing_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_value jsonb,
    new_value jsonb,
    performed_by uuid,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: blocked_ips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocked_ips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_address text NOT NULL,
    blocked_by uuid,
    reason text,
    is_auto_blocked boolean DEFAULT false,
    failed_attempts integer DEFAULT 0,
    blocked_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: booking_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    staff_id uuid,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);
--
-- Name: booking_blocked_dates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_blocked_dates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    staff_id uuid,
    blocked_date date NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now()
);
--
-- Name: booking_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    site_id uuid,
    name text NOT NULL,
    description text,
    duration_minutes integer DEFAULT 60 NOT NULL,
    buffer_minutes integer DEFAULT 0 NOT NULL,
    price numeric(10,2) DEFAULT 0,
    currency text DEFAULT 'GBP'::text,
    max_bookings_per_slot integer DEFAULT 1,
    is_active boolean DEFAULT true,
    color text DEFAULT '#3b82f6'::text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
--
-- Name: booking_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_name text,
    business_slug text,
    timezone text DEFAULT 'Europe/London'::text,
    booking_page_enabled boolean DEFAULT true,
    embed_enabled boolean DEFAULT true,
    require_payment boolean DEFAULT false,
    auto_confirm boolean DEFAULT true,
    allow_cancellation boolean DEFAULT true,
    cancellation_hours integer DEFAULT 24,
    allow_reschedule boolean DEFAULT true,
    reschedule_hours integer DEFAULT 24,
    booking_notice_hours integer DEFAULT 1,
    max_advance_days integer DEFAULT 90,
    confirmation_message text DEFAULT 'Your booking has been confirmed!'::text,
    branding_color text DEFAULT '#3b82f6'::text,
    branding_logo text,
    notification_email boolean DEFAULT true,
    notification_sms boolean DEFAULT false,
    stripe_account_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
--
-- Name: booking_staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_staff (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    avatar_url text,
    bio text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
--
-- Name: booking_staff_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_staff_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id uuid NOT NULL,
    service_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    service_id uuid,
    staff_id uuid,
    site_id uuid,
    booking_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    duration_minutes integer DEFAULT 60 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    source text DEFAULT 'direct'::text NOT NULL,
    customer_name text,
    customer_email text,
    customer_phone text,
    notes text,
    price numeric(10,2) DEFAULT 0,
    currency text DEFAULT 'GBP'::text,
    payment_status text DEFAULT 'unpaid'::text,
    payment_intent_id text,
    reminder_sent boolean DEFAULT false,
    confirmation_sent boolean DEFAULT false,
    cancellation_reason text,
    cancelled_at timestamp with time zone,
    rescheduled_from uuid,
    external_calendar_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
--
-- Name: brand_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brand_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    team_id uuid,
    logo_url text,
    primary_color text DEFAULT '#3b82f6'::text,
    secondary_color text DEFAULT '#6366f1'::text,
    accent_color text DEFAULT '#8b5cf6'::text,
    company_name text,
    custom_domain text,
    email_header_url text,
    login_background_url text,
    report_template text DEFAULT 'executive_summary'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: business_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    report_type text DEFAULT 'weekly_summary'::text NOT NULL,
    title text NOT NULL,
    content text,
    ai_analysis jsonb,
    charts_data jsonb,
    period_start timestamp with time zone,
    period_end timestamp with time zone,
    status text DEFAULT 'generated'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: cad_autosaves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cad_autosaves (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid,
    drawing_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: cad_project_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cad_project_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    version_number integer NOT NULL,
    version_name text,
    drawing_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    entity_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: cad_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cad_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'Untitled Drawing'::text NOT NULL,
    description text,
    tags text[] DEFAULT '{}'::text[],
    folder text DEFAULT ''::text,
    units text DEFAULT 'mm'::text NOT NULL,
    thumbnail_url text,
    drawing_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    is_template boolean DEFAULT false NOT NULL,
    template_category text,
    shared_mode text DEFAULT 'private'::text,
    share_token uuid,
    entity_count integer DEFAULT 0 NOT NULL,
    layer_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: calculator_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calculator_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    expression text NOT NULL,
    result text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
--
-- Name: calendar_event_exceptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_event_exceptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    exception_date date NOT NULL,
    modified_event_data jsonb,
    is_cancelled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    is_all_day boolean DEFAULT false NOT NULL,
    location text,
    color text DEFAULT '#3b82f6'::text NOT NULL,
    is_recurring boolean DEFAULT false NOT NULL,
    recurrence_rule jsonb,
    reminders jsonb DEFAULT '[]'::jsonb,
    attendees jsonb DEFAULT '[]'::jsonb,
    meeting_link text,
    attachments jsonb DEFAULT '[]'::jsonb,
    calendar_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: call_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.call_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    caller_id uuid NOT NULL,
    callee_id uuid NOT NULL,
    channel_id uuid,
    call_type text DEFAULT 'audio'::text NOT NULL,
    status text DEFAULT 'ringing'::text NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT call_sessions_call_type_check CHECK ((call_type = ANY (ARRAY['audio'::text, 'video'::text]))),
    CONSTRAINT call_sessions_status_check CHECK ((status = ANY (ARRAY['ringing'::text, 'accepted'::text, 'declined'::text, 'ended'::text, 'missed'::text, 'busy'::text])))
);
--
-- Name: client_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    folder_id uuid,
    file_name text NOT NULL,
    original_name text NOT NULL,
    file_path text NOT NULL,
    file_type text NOT NULL,
    mime_type text NOT NULL,
    file_size bigint DEFAULT 0 NOT NULL,
    description text,
    is_starred boolean DEFAULT false,
    download_count integer DEFAULT 0,
    last_accessed_at timestamp with time zone,
    is_encrypted boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: client_billing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_billing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_name text DEFAULT 'Starter'::text NOT NULL,
    plan_price numeric DEFAULT 0 NOT NULL,
    billing_cycle text DEFAULT 'monthly'::text NOT NULL,
    services jsonb DEFAULT '[]'::jsonb,
    add_ons jsonb DEFAULT '[]'::jsonb,
    one_off_charges jsonb DEFAULT '[]'::jsonb,
    next_billing_date date,
    payment_status text DEFAULT 'pending'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: client_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    title text NOT NULL,
    document_url text,
    document_type text DEFAULT 'contract'::text,
    signed_at timestamp with time zone,
    expires_at timestamp with time zone,
    status text DEFAULT 'draft'::text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    crm_company_id uuid,
    crm_opportunity_id uuid,
    CONSTRAINT client_contracts_document_type_check CHECK ((document_type = ANY (ARRAY['contract'::text, 'proposal'::text, 'agreement'::text, 'sow'::text]))),
    CONSTRAINT client_contracts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'signed'::text, 'expired'::text, 'cancelled'::text])))
);
--
-- Name: client_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    invoice_number text NOT NULL,
    amount numeric NOT NULL,
    tax_amount numeric DEFAULT 0,
    total_amount numeric NOT NULL,
    currency text DEFAULT 'GBP'::text,
    status text DEFAULT 'draft'::text,
    due_date date,
    paid_at timestamp with time zone,
    payment_method text,
    items jsonb DEFAULT '[]'::jsonb,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    crm_company_id uuid,
    CONSTRAINT client_invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'sent'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])))
);
--
-- Name: client_onboarding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_onboarding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    deal_id uuid,
    client_name text NOT NULL,
    client_email text,
    company_name text,
    status text DEFAULT 'pending'::text NOT NULL,
    account_created boolean DEFAULT false NOT NULL,
    account_created_at timestamp with time zone,
    portal_configured boolean DEFAULT false NOT NULL,
    portal_configured_at timestamp with time zone,
    welcome_sent boolean DEFAULT false NOT NULL,
    welcome_sent_at timestamp with time zone,
    info_checklist_sent boolean DEFAULT false NOT NULL,
    info_checklist_sent_at timestamp with time zone,
    assets_requested boolean DEFAULT false NOT NULL,
    assets_requested_at timestamp with time zone,
    timeline_generated boolean DEFAULT false NOT NULL,
    timeline_generated_at timestamp with time zone,
    checklist_items jsonb DEFAULT '[]'::jsonb,
    timeline_data jsonb DEFAULT '{}'::jsonb,
    onboarding_notes text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: client_pricing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_pricing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    service_type text NOT NULL,
    service_name text NOT NULL,
    description text,
    negotiated_price numeric NOT NULL,
    is_recurring boolean DEFAULT false,
    billing_frequency text,
    is_visible boolean DEFAULT true,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_pricing_billing_frequency_check CHECK ((billing_frequency = ANY (ARRAY['one-time'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text])))
);
--
-- Name: client_teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    primary_account_id uuid NOT NULL,
    team_code text NOT NULL,
    team_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: cms_collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_collections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    icon text DEFAULT 'file-text'::text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: cms_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    collection_id uuid NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: comm_channel_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_channel_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    is_muted boolean DEFAULT false NOT NULL,
    last_read_at timestamp with time zone DEFAULT now(),
    notification_preference text DEFAULT 'all'::text,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT comm_channel_members_notification_preference_check CHECK ((notification_preference = ANY (ARRAY['all'::text, 'mentions'::text, 'none'::text]))),
    CONSTRAINT comm_channel_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text, 'member'::text])))
);
--
-- Name: comm_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    channel_type text DEFAULT 'public'::text NOT NULL,
    icon text DEFAULT '#'::text,
    color text,
    created_by uuid NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    pinned_message_ids uuid[] DEFAULT '{}'::uuid[],
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    join_code text,
    CONSTRAINT comm_channels_channel_type_check CHECK ((channel_type = ANY (ARRAY['public'::text, 'private'::text, 'direct'::text, 'announcement'::text])))
);
--
-- Name: comm_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    message_type text DEFAULT 'text'::text NOT NULL,
    parent_id uuid,
    thread_count integer DEFAULT 0 NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_edited boolean DEFAULT false NOT NULL,
    edited_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_pinned boolean DEFAULT false NOT NULL,
    mentions uuid[] DEFAULT '{}'::uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT comm_messages_message_type_check CHECK ((message_type = ANY (ARRAY['text'::text, 'file'::text, 'image'::text, 'voice'::text, 'system'::text, 'code'::text, 'poll'::text])))
);
--
-- Name: comm_presence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_presence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'offline'::text NOT NULL,
    custom_status text,
    custom_emoji text,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT comm_presence_status_check CHECK ((status = ANY (ARRAY['online'::text, 'away'::text, 'busy'::text, 'dnd'::text, 'offline'::text, 'invisible'::text])))
);
--
-- Name: comm_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_reactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id uuid NOT NULL,
    user_id uuid NOT NULL,
    emoji text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: comm_read_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_read_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel_id uuid NOT NULL,
    user_id uuid NOT NULL,
    last_read_message_id uuid,
    last_read_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: comm_user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_user_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    show_read_receipts boolean DEFAULT true,
    show_typing_indicator boolean DEFAULT true,
    show_last_seen boolean DEFAULT true,
    notification_sound boolean DEFAULT true,
    quiet_hours_start time without time zone,
    quiet_hours_end time without time zone,
    email_digest text DEFAULT 'none'::text,
    theme_preference text DEFAULT 'system'::text,
    compact_mode boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT comm_user_settings_email_digest_check CHECK ((email_digest = ANY (ARRAY['none'::text, 'hourly'::text, 'daily'::text, 'weekly'::text])))
);
--
-- Name: content_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    request_type text NOT NULL,
    title text NOT NULL,
    description text,
    reference_urls text[],
    reference_files text[],
    status text DEFAULT 'pending'::text NOT NULL,
    assigned_to text,
    admin_notes text,
    delivered_content text,
    delivered_files text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    scheduled_date date,
    priority text DEFAULT 'normal'::text,
    CONSTRAINT content_requests_request_type_check CHECK ((request_type = ANY (ARRAY['blog'::text, 'social_post'::text, 'ad_copy'::text, 'website_section'::text]))),
    CONSTRAINT content_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'delivered'::text])))
);
--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    assigned_admin_id uuid,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    CONSTRAINT conversations_status_check CHECK ((status = ANY (ARRAY['open'::text, 'waiting'::text, 'closed'::text])))
);
--
-- Name: crm_activity_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_activity_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    communication_id uuid NOT NULL,
    contact_id uuid,
    user_id uuid,
    role text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: crm_communication_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_communication_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    communication_id uuid NOT NULL,
    platform_file_id uuid,
    filename text,
    file_url text,
    content_type text,
    size_bytes bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: crm_communications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_communications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    owner_id uuid,
    company_id uuid,
    contact_id uuid,
    opportunity_id uuid,
    kind public.crm_comm_kind NOT NULL,
    direction public.crm_comm_direction DEFAULT 'outbound'::public.crm_comm_direction NOT NULL,
    subject text,
    body text,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    duration_seconds integer,
    from_address text,
    to_addresses text[] DEFAULT '{}'::text[],
    cc_addresses text[] DEFAULT '{}'::text[],
    status text,
    external_id text,
    external_source text,
    tags text[] DEFAULT '{}'::text[],
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_communications_check CHECK (((company_id IS NOT NULL) OR (contact_id IS NOT NULL) OR (opportunity_id IS NOT NULL)))
);
--
-- Name: crm_companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    owner_id uuid,
    name text NOT NULL,
    legal_name text,
    domain text,
    website text,
    industry text,
    size text,
    phone text,
    email text,
    address_line1 text,
    address_line2 text,
    city text,
    region text,
    postal_code text,
    country text,
    notes text,
    tags text[] DEFAULT '{}'::text[],
    source text,
    relationship_type public.crm_relationship_type[] DEFAULT '{prospect}'::public.crm_relationship_type[] NOT NULL,
    status public.crm_entity_status DEFAULT 'active'::public.crm_entity_status NOT NULL,
    lifecycle_stage_id uuid,
    linked_lead_id uuid,
    linked_client_team_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: crm_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    owner_id uuid,
    company_id uuid,
    first_name text,
    last_name text,
    full_name text,
    email text,
    phone text,
    mobile text,
    job_title text,
    notes text,
    tags text[] DEFAULT '{}'::text[],
    relationship_type public.crm_relationship_type[] DEFAULT '{prospect}'::public.crm_relationship_type[] NOT NULL,
    status public.crm_entity_status DEFAULT 'active'::public.crm_entity_status NOT NULL,
    lifecycle_stage_id uuid,
    is_primary boolean DEFAULT false NOT NULL,
    linked_lead_id uuid,
    source text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: crm_deal_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_deal_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deal_id uuid NOT NULL,
    user_id uuid NOT NULL,
    activity_type text NOT NULL,
    old_value text,
    new_value text,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: crm_deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_deals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lead_id uuid,
    deal_name text NOT NULL,
    stage text DEFAULT 'qualification'::text NOT NULL,
    probability integer DEFAULT 20 NOT NULL,
    deal_value numeric(12,2) DEFAULT 0 NOT NULL,
    currency text DEFAULT 'GBP'::text NOT NULL,
    expected_close_date date,
    actual_close_date date,
    won boolean,
    contact_name text,
    company_name text,
    description text,
    tags text[],
    notes text,
    lost_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_deals_probability_check CHECK (((probability >= 0) AND (probability <= 100)))
);
--
-- Name: crm_opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_opportunities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    owner_id uuid,
    company_id uuid,
    contact_id uuid,
    title text NOT NULL,
    description text,
    value numeric(19,2) DEFAULT 0,
    currency text DEFAULT 'GBP'::text,
    stage text DEFAULT 'lead'::text NOT NULL,
    probability integer DEFAULT 0,
    expected_close_date date,
    actual_close_date date,
    source text,
    tags text[] DEFAULT '{}'::text[],
    notes text,
    lifecycle_stage_id uuid,
    status public.crm_entity_status DEFAULT 'active'::public.crm_entity_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: crm_deals_compat; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.crm_deals_compat AS
 SELECT id,
    org_id,
    owner_id AS assigned_to,
    title,
    description,
    value AS amount,
    currency,
    stage,
    probability,
    expected_close_date,
    actual_close_date,
    company_id,
    contact_id,
    source,
    tags,
    notes,
    (status)::text AS deal_status,
    created_at,
    updated_at
   FROM public.crm_opportunities o;
--
-- Name: crm_financial_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_financial_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    finance_type text NOT NULL,
    finance_id uuid NOT NULL,
    amount numeric(18,2),
    currency text DEFAULT 'GBP'::text,
    status text,
    occurred_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_financial_links_entity_type_check CHECK ((entity_type = ANY (ARRAY['company'::text, 'contact'::text, 'opportunity'::text]))),
    CONSTRAINT crm_financial_links_finance_type_check CHECK ((finance_type = ANY (ARRAY['acc_customer'::text, 'ar_invoice'::text, 'ar_payment'::text, 'ap_bill'::text, 'ap_payment'::text, 'proposal'::text, 'contract'::text, 'client_invoice'::text])))
);
--
-- Name: crm_lifecycle_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_lifecycle_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    from_stage_id uuid,
    to_stage_id uuid,
    changed_by uuid,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: crm_lifecycle_stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_lifecycle_stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    category public.crm_lifecycle_category DEFAULT 'other'::public.crm_lifecycle_category NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    color text,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: crm_workflow_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_workflow_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    workflow_id uuid,
    entity_type text,
    entity_id uuid,
    trigger_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    actions_executed jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text DEFAULT 'success'::text NOT NULL,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_workflow_runs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'partial'::text, 'failed'::text, 'skipped'::text])))
);
--
-- Name: crm_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    trigger_event text NOT NULL,
    trigger_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    actions jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 100 NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_workflows_trigger_event_check CHECK ((trigger_event = ANY (ARRAY['lifecycle_change'::text, 'entity_created'::text, 'tag_added'::text, 'renewal_due'::text, 'no_activity'::text, 'manual'::text])))
);
--
-- Name: customer_uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    notes text,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'pending'::text
);
--
-- Name: dashboard_metrics_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_metrics_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    metric_key text NOT NULL,
    metric_value jsonb DEFAULT '{}'::jsonb NOT NULL,
    period text DEFAULT 'weekly'::text NOT NULL,
    computed_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: designer_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designer_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    site_id uuid,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text,
    file_size integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: designer_components; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designer_components (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'Custom'::text,
    elements jsonb DEFAULT '[]'::jsonb NOT NULL,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: designer_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designer_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    page_name text DEFAULT 'Untitled Page'::text NOT NULL,
    slug text DEFAULT '/'::text NOT NULL,
    elements jsonb DEFAULT '[]'::jsonb,
    page_settings jsonb DEFAULT '{}'::jsonb,
    seo_title text,
    seo_description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_homepage boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: designer_sites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designer_sites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    site_name text NOT NULL,
    description text,
    template_id text,
    status text DEFAULT 'draft'::text NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    global_styles jsonb DEFAULT '{}'::jsonb,
    published_url text,
    published_at timestamp with time zone
);
--
-- Name: document_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    selection_from integer,
    selection_to integer,
    selected_text text,
    is_resolved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: document_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content jsonb,
    title text,
    word_count integer DEFAULT 0,
    version_number integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: ecommerce_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecommerce_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    order_number text DEFAULT concat('ORD-', to_char(now(), 'YYMMDD'::text), '-', substr((gen_random_uuid())::text, 1, 6)) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    customer_email text,
    customer_name text,
    customer_phone text,
    shipping_address jsonb,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    currency text DEFAULT 'GBP'::text NOT NULL,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    shipping_cost numeric(10,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    payment_provider text DEFAULT 'none'::text NOT NULL,
    payment_status text DEFAULT 'unpaid'::text NOT NULL,
    payment_intent_id text,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ecommerce_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text, 'refunded'::text])))
);
--
-- Name: ecommerce_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecommerce_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_name text DEFAULT 'My Store'::text NOT NULL,
    contact_email text,
    support_url text,
    currency text DEFAULT 'GBP'::text NOT NULL,
    timezone text DEFAULT 'Europe/London'::text NOT NULL,
    brand_color text DEFAULT '#111111'::text NOT NULL,
    checkout_accent text DEFAULT '#111111'::text NOT NULL,
    logo_url text,
    shipping_enabled boolean DEFAULT true NOT NULL,
    shipping_flat_rate numeric(10,2) DEFAULT 0 NOT NULL,
    shipping_free_over numeric(10,2),
    tax_enabled boolean DEFAULT false NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0 NOT NULL,
    tax_inclusive boolean DEFAULT false NOT NULL,
    payments_provider text DEFAULT 'none'::text NOT NULL,
    payments_configured boolean DEFAULT false NOT NULL,
    payments_test_mode boolean DEFAULT true NOT NULL,
    checkout_success_url text,
    checkout_cancel_url text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ecommerce_settings_payments_provider_check CHECK ((payments_provider = ANY (ARRAY['none'::text, 'stripe'::text, 'paddle'::text, 'manual'::text])))
);
--
-- Name: email_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider text NOT NULL,
    email_address text NOT NULL,
    display_name text,
    color text DEFAULT '#6366f1'::text,
    access_token text,
    refresh_token text,
    token_expires_at timestamp with time zone,
    imap_host text,
    imap_port integer,
    smtp_host text,
    smtp_port integer,
    imap_username text,
    imap_password text,
    use_ssl boolean DEFAULT true,
    is_active boolean DEFAULT true,
    last_sync_at timestamp with time zone,
    sync_cursor text,
    status text DEFAULT 'pending'::text,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT email_accounts_provider_check CHECK ((provider = ANY (ARRAY['gmail'::text, 'outlook'::text, 'yahoo'::text, 'icloud'::text, 'custom'::text]))),
    CONSTRAINT email_accounts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'error'::text, 'disconnected'::text])))
);
--
-- Name: email_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    account_id uuid,
    to_addresses jsonb DEFAULT '[]'::jsonb,
    cc_addresses jsonb DEFAULT '[]'::jsonb,
    bcc_addresses jsonb DEFAULT '[]'::jsonb,
    subject text DEFAULT ''::text,
    body_html text DEFAULT ''::text,
    body_text text DEFAULT ''::text,
    attachments jsonb DEFAULT '[]'::jsonb,
    in_reply_to text,
    is_scheduled boolean DEFAULT false,
    scheduled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: email_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    user_id uuid NOT NULL,
    provider_message_id text NOT NULL,
    thread_id text,
    from_name text,
    from_email text,
    to_addresses jsonb DEFAULT '[]'::jsonb,
    cc_addresses jsonb DEFAULT '[]'::jsonb,
    bcc_addresses jsonb DEFAULT '[]'::jsonb,
    subject text,
    snippet text,
    body_html text,
    body_text text,
    date timestamp with time zone NOT NULL,
    is_read boolean DEFAULT false,
    is_starred boolean DEFAULT false,
    is_draft boolean DEFAULT false,
    has_attachments boolean DEFAULT false,
    attachments jsonb DEFAULT '[]'::jsonb,
    labels text[] DEFAULT '{}'::text[],
    folder text DEFAULT 'inbox'::text,
    category text DEFAULT 'primary'::text,
    raw_headers jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: enquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    company text,
    phone text,
    interest text,
    project_details text,
    page_count text,
    budget text,
    status text DEFAULT 'new'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    first_name text,
    last_name text,
    business_type text,
    business_address text,
    website text,
    employee_count text,
    years_in_business text,
    selected_package text,
    timeline text,
    has_existing_site text,
    primary_goal text,
    must_have_features text[],
    competitors text,
    brand_colors text,
    inspiration_sites text,
    how_did_you_hear text,
    social_media text,
    additional_notes text,
    resume_token uuid DEFAULT gen_random_uuid(),
    form_step integer DEFAULT 1,
    is_draft boolean DEFAULT false
);
--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    currency text DEFAULT 'GBP'::text,
    category text DEFAULT 'Other'::text NOT NULL,
    category_color text DEFAULT '#64748b'::text,
    vendor text DEFAULT ''::text,
    expense_date date DEFAULT CURRENT_DATE NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    has_receipt boolean DEFAULT false,
    receipt_url text DEFAULT ''::text,
    project text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
--
-- Name: greeting_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.greeting_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    message text DEFAULT ''::text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: hr_candidates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_candidates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    department text DEFAULT 'engineering'::text NOT NULL,
    stage text DEFAULT 'applied'::text NOT NULL,
    applied_date date DEFAULT CURRENT_DATE NOT NULL,
    email text DEFAULT ''::text,
    rating numeric DEFAULT 0,
    notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now()
);
--
-- Name: hr_employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    employee_id text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    department text DEFAULT 'engineering'::text NOT NULL,
    email text NOT NULL,
    phone text DEFAULT ''::text,
    location text DEFAULT ''::text,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    status text DEFAULT 'probation'::text NOT NULL,
    avatar text DEFAULT ''::text,
    salary numeric DEFAULT 0,
    manager text DEFAULT 'TBD'::text,
    skills text[] DEFAULT '{}'::text[],
    performance numeric DEFAULT 0,
    leave_vacation integer DEFAULT 25,
    leave_sick integer DEFAULT 10,
    leave_personal integer DEFAULT 3,
    emergency_contact text DEFAULT 'Not set'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
--
-- Name: hr_performance_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_performance_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    employee_id uuid,
    employee_name text NOT NULL,
    period text NOT NULL,
    rating numeric DEFAULT 0,
    goals jsonb DEFAULT '[]'::jsonb,
    feedback text DEFAULT ''::text,
    reviewer text NOT NULL,
    review_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
--
-- Name: hr_time_off_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_time_off_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    employee_id uuid,
    employee_name text NOT NULL,
    type text DEFAULT 'vacation'::text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    days integer DEFAULT 1 NOT NULL,
    reason text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now()
);
--
-- Name: inv_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: inv_companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    address text,
    status text DEFAULT 'active'::text NOT NULL,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: inv_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    address text,
    manager_name text,
    manager_contact text,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: inv_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    sku text NOT NULL,
    barcode text,
    description text,
    category_id uuid,
    unit text DEFAULT 'pieces'::text NOT NULL,
    reorder_level integer DEFAULT 0 NOT NULL,
    reorder_qty integer DEFAULT 0 NOT NULL,
    cost_price numeric(12,2) DEFAULT 0 NOT NULL,
    selling_price numeric(12,2) DEFAULT 0 NOT NULL,
    supplier_name text,
    supplier_contact text,
    lead_time_days integer,
    image_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid
);
--
-- Name: inv_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    multi_location_enabled boolean DEFAULT false NOT NULL,
    low_stock_notifications boolean DEFAULT true NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: inv_stock_count_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_stock_count_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    count_id uuid NOT NULL,
    product_id uuid NOT NULL,
    expected_qty integer DEFAULT 0 NOT NULL,
    counted_qty integer,
    discrepancy integer GENERATED ALWAYS AS ((COALESCE(counted_qty, 0) - expected_qty)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: inv_stock_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_stock_counts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    location_id uuid,
    status text DEFAULT 'draft'::text NOT NULL,
    name text,
    notes text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finalized_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inv_stock_counts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'in_progress'::text, 'finalized'::text])))
);
--
-- Name: inv_stock_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_stock_levels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    location_id uuid NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    last_counted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: inv_stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_stock_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    location_id uuid,
    to_location_id uuid,
    movement_type text NOT NULL,
    quantity integer NOT NULL,
    reason text,
    reference text,
    notes text,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inv_stock_movements_movement_type_check CHECK ((movement_type = ANY (ARRAY['in'::text, 'out'::text, 'transfer'::text, 'adjustment'::text])))
);
--
-- Name: knowledge_base; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_base (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    status text DEFAULT 'draft'::text NOT NULL,
    author_id uuid NOT NULL,
    last_edited_by uuid,
    pinned boolean DEFAULT false NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: kpi_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    metric_name text NOT NULL,
    target_value numeric NOT NULL,
    current_value numeric DEFAULT 0,
    unit text DEFAULT ''::text,
    period text DEFAULT 'monthly'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: lead_imports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_imports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    imported_by uuid NOT NULL,
    source_type public.lead_source NOT NULL,
    total_count integer DEFAULT 0,
    added_count integer DEFAULT 0,
    skipped_count integer DEFAULT 0,
    duplicate_count integer DEFAULT 0,
    import_log jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: lead_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: lead_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    changed_by uuid NOT NULL,
    old_status public.lead_status,
    new_status public.lead_status NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_name text,
    personal_name text,
    contact_name text,
    is_personal boolean DEFAULT false,
    phone text,
    email text,
    website_url text,
    location_city text,
    location_postcode text,
    google_rating numeric(2,1),
    review_count integer DEFAULT 0,
    category text,
    source public.lead_source DEFAULT 'manual'::public.lead_source,
    status public.lead_status DEFAULT 'new'::public.lead_status,
    assigned_to uuid,
    last_contacted_at timestamp with time zone,
    tags jsonb DEFAULT '[]'::jsonb,
    converted_client_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    enquiry_id uuid,
    enquiry_data jsonb
);
--
-- Name: marketing_page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketing_page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    path text NOT NULL,
    referrer text,
    user_agent text,
    country text,
    session_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_project_updates boolean DEFAULT true NOT NULL,
    email_payments boolean DEFAULT true NOT NULL,
    email_file_uploads boolean DEFAULT false NOT NULL,
    email_approvals boolean DEFAULT true NOT NULL,
    email_deadlines boolean DEFAULT true NOT NULL,
    in_app_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    icon text DEFAULT 'bell'::text,
    link text,
    is_read boolean DEFAULT false NOT NULL,
    is_email_sent boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone
);
--
-- Name: office_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text DEFAULT 'Untitled Document'::text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb,
    document_type text DEFAULT 'word'::text NOT NULL,
    page_size text DEFAULT 'a4'::text,
    page_orientation text DEFAULT 'portrait'::text,
    margins jsonb DEFAULT '{"top": 72, "left": 72, "right": 72, "bottom": 72}'::jsonb,
    is_template boolean DEFAULT false,
    is_starred boolean DEFAULT false,
    word_count integer DEFAULT 0,
    last_edited_by uuid,
    shared_with jsonb DEFAULT '[]'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT office_documents_document_type_check CHECK ((document_type = ANY (ARRAY['word'::text, 'sheet'::text, 'presentation'::text])))
);
--
-- Name: office_poll_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_poll_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    poll_id uuid NOT NULL,
    text text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);
--
-- Name: office_poll_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_poll_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    poll_id uuid NOT NULL,
    option_id uuid NOT NULL,
    voter_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
--
-- Name: office_polls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_polls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    question text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);
--
-- Name: password_vault_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_vault_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    vault_name text DEFAULT 'Password Vault'::text NOT NULL,
    password_hash text NOT NULL,
    totp_secret_encrypted text NOT NULL,
    security_questions jsonb NOT NULL,
    master_key_hash text NOT NULL,
    master_key_encrypted text NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    failed_attempts integer DEFAULT 0 NOT NULL,
    last_failed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: password_vault_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_vault_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    vault_id uuid NOT NULL,
    title_encrypted text NOT NULL,
    username_encrypted text,
    password_encrypted text,
    url_encrypted text,
    notes_encrypted text,
    category text DEFAULT 'logins'::text NOT NULL,
    has_2fa boolean DEFAULT false NOT NULL,
    starred boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: planner_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    team_id uuid,
    title text NOT NULL,
    description text DEFAULT ''::text,
    status text DEFAULT 'todo'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    category text DEFAULT 'general'::text,
    due_date timestamp with time zone,
    start_date timestamp with time zone,
    completed_at timestamp with time zone,
    assigned_to uuid,
    tags text[] DEFAULT '{}'::text[],
    progress integer DEFAULT 0,
    estimated_hours numeric(6,1),
    actual_hours numeric(6,1),
    parent_task_id uuid,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT planner_tasks_priority_check CHECK ((priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text]))),
    CONSTRAINT planner_tasks_progress_check CHECK (((progress >= 0) AND (progress <= 100))),
    CONSTRAINT planner_tasks_status_check CHECK ((status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'paused'::text, 'in_review'::text, 'completed'::text, 'cancelled'::text])))
);
--
-- Name: platform_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_type text NOT NULL,
    app_source text NOT NULL,
    source_id text,
    source_route text,
    folder_path text DEFAULT '/'::text NOT NULL,
    description text,
    thumbnail_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    file_size_bytes bigint DEFAULT 0,
    is_starred boolean DEFAULT false NOT NULL,
    is_trashed boolean DEFAULT false NOT NULL,
    trashed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: platform_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    folder_name text NOT NULL,
    parent_path text DEFAULT '/'::text NOT NULL,
    full_path text NOT NULL,
    color text,
    icon text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: poll_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.poll_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    poll_id text NOT NULL,
    option_index integer NOT NULL,
    user_id uuid NOT NULL,
    channel_id uuid,
    message_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: pomodoro_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pomodoro_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_type text DEFAULT 'focus'::text NOT NULL,
    duration_minutes integer DEFAULT 25 NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    site_id uuid,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    name text NOT NULL,
    sku text,
    price numeric(10,2),
    compare_at_price numeric(10,2),
    inventory_count integer DEFAULT 0,
    options jsonb DEFAULT '{}'::jsonb,
    image_url text,
    is_default boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    site_id uuid,
    category_id uuid,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    short_description text,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    compare_at_price numeric(10,2),
    cost_price numeric(10,2),
    currency text DEFAULT 'GBP'::text NOT NULL,
    sku text,
    barcode text,
    track_inventory boolean DEFAULT false,
    inventory_count integer DEFAULT 0,
    weight numeric(8,2),
    weight_unit text DEFAULT 'kg'::text,
    status text DEFAULT 'draft'::text NOT NULL,
    is_featured boolean DEFAULT false,
    is_digital boolean DEFAULT false,
    images jsonb DEFAULT '[]'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    seo_title text,
    seo_description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'archived'::text])))
);
--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_id text,
    plan text,
    page_count text,
    status text DEFAULT 'active'::text,
    company text,
    phone text,
    notes text,
    website_status text DEFAULT 'design'::text,
    preview_url text,
    site_published_at timestamp with time zone,
    avatar_url text,
    domain_name text,
    ssl_status text DEFAULT 'pending'::text,
    hosting_provider text DEFAULT 'Lovable Cloud'::text,
    last_updated_at timestamp with time zone DEFAULT now(),
    site_files_url text,
    version_history jsonb DEFAULT '[]'::jsonb,
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret text,
    backup_codes jsonb DEFAULT '[]'::jsonb,
    two_factor_verified_at timestamp with time zone,
    known_ips text[] DEFAULT '{}'::text[],
    email_verified boolean DEFAULT false,
    verification_token uuid,
    verification_sent_at timestamp with time zone,
    verification_expires_at timestamp with time zone,
    verification_resend_count integer DEFAULT 0,
    verification_resend_reset_at timestamp with time zone,
    industry text,
    enquiry_id uuid,
    enquiry_data jsonb,
    is_owner boolean DEFAULT false NOT NULL,
    account_type text DEFAULT 'paid_client'::text NOT NULL,
    CONSTRAINT profiles_account_type_check CHECK ((account_type = ANY (ARRAY['paid_client'::text, 'live_preview'::text, 'viewer_only'::text, 'business_management'::text, 'admin'::text]))),
    CONSTRAINT valid_website_status CHECK ((website_status = ANY (ARRAY['pending'::text, 'design'::text, 'development'::text, 'review'::text, 'live'::text, 'not_published'::text])))
);
--
-- Name: proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lead_id uuid,
    deal_id uuid,
    proposal_number text NOT NULL,
    template_type text DEFAULT 'website_design'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    client_name text,
    client_email text,
    client_company text,
    client_phone text,
    title text DEFAULT 'Proposal'::text NOT NULL,
    introduction text,
    scope_items jsonb DEFAULT '[]'::jsonb,
    pricing_items jsonb DEFAULT '[]'::jsonb,
    total_amount numeric DEFAULT 0,
    currency text DEFAULT 'GBP'::text,
    valid_until date,
    terms text,
    notes text,
    accepted_at timestamp with time zone,
    accepted_by_name text,
    accepted_by_email text,
    accepted_ip text,
    acceptance_token uuid DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_at timestamp with time zone,
    crm_company_id uuid,
    crm_contact_id uuid,
    crm_opportunity_id uuid
);
--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    ip_address text,
    user_id uuid,
    endpoint text NOT NULL,
    attempts integer DEFAULT 1 NOT NULL,
    window_start timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: rbac_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rbac_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    performed_by uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_value jsonb,
    new_value jsonb,
    details text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: rbac_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rbac_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    module text NOT NULL,
    action text NOT NULL,
    granted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: rbac_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rbac_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    color text DEFAULT '#99AAB5'::text,
    "position" integer DEFAULT 0,
    hoist boolean DEFAULT false,
    icon text
);
--
-- Name: rbac_user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rbac_user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: resource_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    deal_id uuid,
    user_id uuid NOT NULL,
    assigned_to text NOT NULL,
    hours_allocated numeric DEFAULT 0 NOT NULL,
    hours_spent numeric DEFAULT 0 NOT NULL,
    week_start date NOT NULL,
    task_description text,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'planned'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: security_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event_type text NOT NULL,
    portal_attempted text,
    actual_role text,
    ip_address text,
    user_agent text,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: site_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    visitor_id uuid,
    user_id uuid NOT NULL,
    service_name text NOT NULL,
    booking_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone,
    duration_minutes integer DEFAULT 60,
    price numeric(10,2),
    currency text DEFAULT 'GBP'::text,
    status text DEFAULT 'pending'::text,
    customer_name text,
    customer_email text,
    customer_phone text,
    notes text,
    payment_intent_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT site_bookings_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'no_show'::text])))
);
--
-- Name: site_carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    session_id text NOT NULL,
    visitor_email text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    subtotal numeric(10,2) DEFAULT 0,
    currency text DEFAULT 'GBP'::text,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT site_carts_status_check CHECK ((status = ANY (ARRAY['active'::text, 'abandoned'::text, 'converted'::text])))
);
--
-- Name: site_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_key text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: site_deployments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_deployments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    version_number integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    subdomain text,
    custom_domain text,
    live_url text,
    storage_path text,
    file_count integer DEFAULT 0,
    total_size_bytes bigint DEFAULT 0,
    build_log jsonb DEFAULT '[]'::jsonb,
    page_count integer DEFAULT 0,
    deployed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: site_domains; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_domains (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    domain_type text DEFAULT 'subdomain'::text NOT NULL,
    domain_name text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    dns_verified boolean DEFAULT false,
    ssl_active boolean DEFAULT false,
    dns_instructions jsonb,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: site_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    order_number text NOT NULL,
    customer_email text NOT NULL,
    customer_name text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0,
    shipping_amount numeric(10,2) DEFAULT 0,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    currency text DEFAULT 'GBP'::text,
    status text DEFAULT 'pending'::text,
    payment_intent_id text,
    shipping_address jsonb,
    billing_address jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT site_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text, 'refunded'::text])))
);
--
-- Name: site_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    inv_product_id uuid,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric DEFAULT 0 NOT NULL,
    compare_at_price numeric,
    currency text DEFAULT 'GBP'::text NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    category text,
    tags text[] DEFAULT '{}'::text[],
    sort_order integer DEFAULT 0,
    track_inventory boolean DEFAULT true,
    inventory_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: site_visitors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_visitors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    phone text,
    password_hash text,
    is_verified boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: social_media_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_media_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    platform text NOT NULL,
    account_handle text NOT NULL,
    account_name text,
    profile_url text,
    managed_by text DEFAULT 'Echelon Team'::text,
    posting_frequency text DEFAULT 'Weekly'::text,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT social_media_accounts_platform_check CHECK ((platform = ANY (ARRAY['instagram'::text, 'facebook'::text, 'tiktok'::text, 'linkedin'::text, 'twitter'::text, 'youtube'::text]))),
    CONSTRAINT social_media_accounts_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'disconnected'::text])))
);
--
-- Name: social_media_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_media_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text,
    media_url text,
    media_type text DEFAULT 'image'::text,
    scheduled_at timestamp with time zone,
    posted_at timestamp with time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT social_media_posts_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text, 'carousel'::text, 'story'::text, 'reel'::text]))),
    CONSTRAINT social_media_posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'posted'::text, 'failed'::text])))
);
--
-- Name: sticky_walls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sticky_walls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'Untitled Wall'::text NOT NULL,
    is_starred boolean DEFAULT false NOT NULL,
    notes jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: storage_quotas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.storage_quotas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    quota_bytes bigint DEFAULT '5368709120'::bigint NOT NULL,
    used_bytes bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: subscription_site_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_site_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_site_id uuid NOT NULL,
    event_type text NOT NULL,
    detail jsonb,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    actor_user_id uuid,
    actor text,
    CONSTRAINT subscription_site_events_event_type_check CHECK ((event_type = ANY (ARRAY['created'::text, 'paused'::text, 'resumed'::text, 'cancelled'::text, 'payment_failed'::text, 'renewed'::text, 'hero_image_updated'::text, 'hosting_status_changed'::text, 'notes_updated'::text, 'edited'::text])))
);
--
-- Name: subscription_sites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_sites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_user_id uuid NOT NULL,
    client_company_id uuid,
    client_name text,
    site_name text NOT NULL,
    site_url text,
    hero_image_url text,
    template_used text,
    status text DEFAULT 'trial'::text NOT NULL,
    billing_amount numeric(12,2) DEFAULT 0,
    billing_currency text DEFAULT 'GBP'::text,
    billing_cycle text DEFAULT 'monthly'::text,
    subscription_start_date date,
    next_billing_date date,
    next_renewal_date date,
    hosting_provider text DEFAULT 'vercel'::text,
    hosting_status text DEFAULT 'not_deployed'::text NOT NULL,
    is_hosted_only boolean DEFAULT false NOT NULL,
    account_manager_user_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    acc_org_id uuid,
    acc_customer_id uuid,
    acc_revenue_account_id uuid,
    auto_invoice boolean DEFAULT false NOT NULL,
    last_invoiced_on date,
    CONSTRAINT subscription_sites_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'annual'::text]))),
    CONSTRAINT subscription_sites_hosting_provider_check CHECK ((hosting_provider = ANY (ARRAY['vercel'::text, 'netlify'::text, 'cloudflare'::text, 'other'::text]))),
    CONSTRAINT subscription_sites_hosting_status_check CHECK ((hosting_status = ANY (ARRAY['live'::text, 'building'::text, 'error'::text, 'not_deployed'::text]))),
    CONSTRAINT subscription_sites_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'cancelled'::text, 'trial'::text])))
);
--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reference_id text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    priority text DEFAULT 'standard'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    ai_conversation_id uuid,
    message_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: team_branding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_branding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    manager_id uuid NOT NULL,
    default_logo_url text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: team_inbox_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_inbox_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    last_active_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: team_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    member_role text DEFAULT 'member'::text NOT NULL,
    display_name text,
    invited_by uuid,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT team_memberships_member_role_check CHECK ((member_role = ANY (ARRAY['owner'::text, 'financial'::text, 'project'::text])))
);
--
-- Name: time_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    task text DEFAULT ''::text NOT NULL,
    project text DEFAULT ''::text NOT NULL,
    project_color text DEFAULT '#3b82f6'::text,
    client text DEFAULT ''::text,
    tags text[] DEFAULT '{}'::text[],
    start_time timestamp with time zone DEFAULT now() NOT NULL,
    duration_minutes integer DEFAULT 0 NOT NULL,
    billable boolean DEFAULT true,
    rate numeric DEFAULT 0,
    notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now()
);
--
-- Name: two_factor_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.two_factor_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    ip_address text,
    attempt_type text DEFAULT 'verify'::text NOT NULL,
    success boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);
--
-- Name: user_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    feature_name text NOT NULL,
    visited_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: user_branding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_branding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    logo_url text,
    hide_platform_badge boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: user_calendars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_calendars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'My Calendar'::text NOT NULL,
    color text DEFAULT '#3b82f6'::text NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: user_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider text NOT NULL,
    credentials jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_connected boolean DEFAULT false NOT NULL,
    connected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: user_onboarding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_onboarding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    completed_profile boolean DEFAULT false NOT NULL,
    explored_website boolean DEFAULT false NOT NULL,
    sent_message boolean DEFAULT false NOT NULL,
    uploaded_file boolean DEFAULT false NOT NULL,
    checked_calendar boolean DEFAULT false NOT NULL,
    dismissed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: user_sidebar_layout; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sidebar_layout (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    layout_data jsonb DEFAULT '{"folders": [], "itemOrder": []}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: vault_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vault_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    password_hash text NOT NULL,
    totp_secret_encrypted text NOT NULL,
    security_questions jsonb DEFAULT '[]'::jsonb NOT NULL,
    master_key_hash text NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    failed_attempts integer DEFAULT 0 NOT NULL,
    last_failed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: vault_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vault_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    item_type text DEFAULT 'file'::text NOT NULL,
    name_encrypted text NOT NULL,
    description_encrypted text,
    content_encrypted text,
    file_path text,
    file_size bigint DEFAULT 0,
    mime_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: whitelisted_ips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whitelisted_ips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_address text NOT NULL,
    added_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
--
-- Name: wiki_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wiki_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text DEFAULT ''::text,
    category text DEFAULT 'Processes'::text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    is_starred boolean DEFAULT false,
    last_edited_by text DEFAULT ''::text,
    status text DEFAULT 'published'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
--
-- Name: workflow_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'running'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    trigger_data jsonb DEFAULT '{}'::jsonb,
    node_results jsonb DEFAULT '[]'::jsonb,
    error text,
    duration_ms integer
);
--
-- Name: workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'Untitled Workflow'::text NOT NULL,
    description text,
    nodes jsonb DEFAULT '[]'::jsonb NOT NULL,
    connections jsonb DEFAULT '[]'::jsonb NOT NULL,
    viewport jsonb DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    workflow_type text DEFAULT 'execute'::text NOT NULL,
    template_id text,
    last_run_at timestamp with time zone,
    run_count integer DEFAULT 0 NOT NULL
);
--
-- Name: acc_accountant_invites acc_accountant_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_accountant_invites
    ADD CONSTRAINT acc_accountant_invites_pkey PRIMARY KEY (id);
--
-- Name: acc_accountant_invites acc_accountant_invites_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_accountant_invites
    ADD CONSTRAINT acc_accountant_invites_token_key UNIQUE (token);
--
-- Name: acc_accounting_periods acc_accounting_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_accounting_periods
    ADD CONSTRAINT acc_accounting_periods_pkey PRIMARY KEY (id);
--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_bill_id_line_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bill_lines
    ADD CONSTRAINT acc_ap_bill_lines_bill_id_line_no_key UNIQUE (bill_id, line_no);
--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bill_lines
    ADD CONSTRAINT acc_ap_bill_lines_pkey PRIMARY KEY (id);
--
-- Name: acc_ap_bills acc_ap_bills_org_id_bill_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_org_id_bill_number_key UNIQUE (org_id, bill_number);
--
-- Name: acc_ap_bills acc_ap_bills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_pkey PRIMARY KEY (id);
--
-- Name: acc_ap_payments acc_ap_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_payments
    ADD CONSTRAINT acc_ap_payments_pkey PRIMARY KEY (id);
--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_invoice_id_line_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoice_lines
    ADD CONSTRAINT acc_ar_invoice_lines_invoice_id_line_no_key UNIQUE (invoice_id, line_no);
--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoice_lines
    ADD CONSTRAINT acc_ar_invoice_lines_pkey PRIMARY KEY (id);
--
-- Name: acc_ar_invoices acc_ar_invoices_org_id_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_org_id_invoice_number_key UNIQUE (org_id, invoice_number);
--
-- Name: acc_ar_invoices acc_ar_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_pkey PRIMARY KEY (id);
--
-- Name: acc_ar_payments acc_ar_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_payments
    ADD CONSTRAINT acc_ar_payments_pkey PRIMARY KEY (id);
--
-- Name: acc_audit_log acc_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_audit_log
    ADD CONSTRAINT acc_audit_log_pkey PRIMARY KEY (id);
--
-- Name: acc_bank_accounts acc_bank_accounts_org_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_accounts
    ADD CONSTRAINT acc_bank_accounts_org_id_name_key UNIQUE (org_id, name);
--
-- Name: acc_bank_accounts acc_bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_accounts
    ADD CONSTRAINT acc_bank_accounts_pkey PRIMARY KEY (id);
--
-- Name: acc_bank_reconciliations acc_bank_reconciliations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_reconciliations
    ADD CONSTRAINT acc_bank_reconciliations_pkey PRIMARY KEY (id);
--
-- Name: acc_bank_transactions acc_bank_transactions_bank_account_id_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_transactions
    ADD CONSTRAINT acc_bank_transactions_bank_account_id_external_id_key UNIQUE (bank_account_id, external_id);
--
-- Name: acc_bank_transactions acc_bank_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_transactions
    ADD CONSTRAINT acc_bank_transactions_pkey PRIMARY KEY (id);
--
-- Name: acc_chart_of_accounts acc_chart_of_accounts_org_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_chart_of_accounts
    ADD CONSTRAINT acc_chart_of_accounts_org_id_code_key UNIQUE (org_id, code);
--
-- Name: acc_chart_of_accounts acc_chart_of_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_chart_of_accounts
    ADD CONSTRAINT acc_chart_of_accounts_pkey PRIMARY KEY (id);
--
-- Name: acc_customers acc_customers_org_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_org_id_name_key UNIQUE (org_id, name);
--
-- Name: acc_customers acc_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_pkey PRIMARY KEY (id);
--
-- Name: acc_depreciation_lines acc_depreciation_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_lines
    ADD CONSTRAINT acc_depreciation_lines_pkey PRIMARY KEY (id);
--
-- Name: acc_depreciation_lines acc_depreciation_lines_run_id_asset_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_lines
    ADD CONSTRAINT acc_depreciation_lines_run_id_asset_id_key UNIQUE (run_id, asset_id);
--
-- Name: acc_depreciation_runs acc_depreciation_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_runs
    ADD CONSTRAINT acc_depreciation_runs_pkey PRIMARY KEY (id);
--
-- Name: acc_employees acc_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_employees
    ADD CONSTRAINT acc_employees_pkey PRIMARY KEY (id);
--
-- Name: acc_fixed_assets acc_fixed_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_pkey PRIMARY KEY (id);
--
-- Name: acc_fx_rates acc_fx_rates_org_id_rate_date_from_currency_to_currency_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fx_rates
    ADD CONSTRAINT acc_fx_rates_org_id_rate_date_from_currency_to_currency_key UNIQUE (org_id, rate_date, from_currency, to_currency);
--
-- Name: acc_fx_rates acc_fx_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fx_rates
    ADD CONSTRAINT acc_fx_rates_pkey PRIMARY KEY (id);
--
-- Name: acc_journal_entries acc_journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_entries
    ADD CONSTRAINT acc_journal_entries_pkey PRIMARY KEY (id);
--
-- Name: acc_journal_lines acc_journal_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_lines
    ADD CONSTRAINT acc_journal_lines_pkey PRIMARY KEY (id);
--
-- Name: acc_org_members acc_org_members_org_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_org_members
    ADD CONSTRAINT acc_org_members_org_id_user_id_key UNIQUE (org_id, user_id);
--
-- Name: acc_org_members acc_org_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_org_members
    ADD CONSTRAINT acc_org_members_pkey PRIMARY KEY (id);
--
-- Name: acc_organizations acc_organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_organizations
    ADD CONSTRAINT acc_organizations_pkey PRIMARY KEY (id);
--
-- Name: acc_pay_runs acc_pay_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_pay_runs
    ADD CONSTRAINT acc_pay_runs_pkey PRIMARY KEY (id);
--
-- Name: acc_payslips acc_payslips_pay_run_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_payslips
    ADD CONSTRAINT acc_payslips_pay_run_id_employee_id_key UNIQUE (pay_run_id, employee_id);
--
-- Name: acc_payslips acc_payslips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_payslips
    ADD CONSTRAINT acc_payslips_pkey PRIMARY KEY (id);
--
-- Name: acc_report_recalcs acc_report_recalcs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_report_recalcs
    ADD CONSTRAINT acc_report_recalcs_pkey PRIMARY KEY (id);
--
-- Name: acc_suppliers acc_suppliers_org_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_suppliers
    ADD CONSTRAINT acc_suppliers_org_id_name_key UNIQUE (org_id, name);
--
-- Name: acc_suppliers acc_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_suppliers
    ADD CONSTRAINT acc_suppliers_pkey PRIMARY KEY (id);
--
-- Name: acc_user_roles acc_user_roles_org_id_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_user_roles
    ADD CONSTRAINT acc_user_roles_org_id_user_id_role_key UNIQUE (org_id, user_id, role);
--
-- Name: acc_user_roles acc_user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_user_roles
    ADD CONSTRAINT acc_user_roles_pkey PRIMARY KEY (id);
--
-- Name: acc_vat_returns acc_vat_returns_period_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_vat_returns
    ADD CONSTRAINT acc_vat_returns_period_unique UNIQUE (org_id, period_start, period_end);
--
-- Name: acc_vat_returns acc_vat_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_vat_returns
    ADD CONSTRAINT acc_vat_returns_pkey PRIMARY KEY (id);
--
-- Name: account_type_presets account_type_presets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_type_presets
    ADD CONSTRAINT account_type_presets_pkey PRIMARY KEY (account_type);
--
-- Name: ad_campaigns ad_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_pkey PRIMARY KEY (id);
--
-- Name: ai_conversations ai_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_pkey PRIMARY KEY (id);
--
-- Name: ai_messages ai_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_pkey PRIMARY KEY (id);
--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);
--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);
--
-- Name: app_projects app_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_projects
    ADD CONSTRAINT app_projects_pkey PRIMARY KEY (id);
--
-- Name: asset_folders asset_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_folders
    ADD CONSTRAINT asset_folders_pkey PRIMARY KEY (id);
--
-- Name: asset_tag_assignments asset_tag_assignments_asset_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_tag_assignments
    ADD CONSTRAINT asset_tag_assignments_asset_id_tag_id_key UNIQUE (asset_id, tag_id);
--
-- Name: asset_tag_assignments asset_tag_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_tag_assignments
    ADD CONSTRAINT asset_tag_assignments_pkey PRIMARY KEY (id);
--
-- Name: asset_tags asset_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_tags
    ADD CONSTRAINT asset_tags_pkey PRIMARY KEY (id);
--
-- Name: automation_rule_logs automation_rule_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rule_logs
    ADD CONSTRAINT automation_rule_logs_pkey PRIMARY KEY (id);
--
-- Name: automation_rules automation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_pkey PRIMARY KEY (id);
--
-- Name: automation_runs automation_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_runs
    ADD CONSTRAINT automation_runs_pkey PRIMARY KEY (id);
--
-- Name: automation_schedules automation_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_schedules
    ADD CONSTRAINT automation_schedules_pkey PRIMARY KEY (id);
--
-- Name: billing_audit_log billing_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_audit_log
    ADD CONSTRAINT billing_audit_log_pkey PRIMARY KEY (id);
--
-- Name: blocked_ips blocked_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_ips
    ADD CONSTRAINT blocked_ips_pkey PRIMARY KEY (id);
--
-- Name: booking_availability booking_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_availability
    ADD CONSTRAINT booking_availability_pkey PRIMARY KEY (id);
--
-- Name: booking_blocked_dates booking_blocked_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_blocked_dates
    ADD CONSTRAINT booking_blocked_dates_pkey PRIMARY KEY (id);
--
-- Name: booking_services booking_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT booking_services_pkey PRIMARY KEY (id);
--
-- Name: booking_settings booking_settings_business_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_settings
    ADD CONSTRAINT booking_settings_business_slug_key UNIQUE (business_slug);
--
-- Name: booking_settings booking_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_settings
    ADD CONSTRAINT booking_settings_pkey PRIMARY KEY (id);
--
-- Name: booking_settings booking_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_settings
    ADD CONSTRAINT booking_settings_user_id_key UNIQUE (user_id);
--
-- Name: booking_staff booking_staff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_staff
    ADD CONSTRAINT booking_staff_pkey PRIMARY KEY (id);
--
-- Name: booking_staff_services booking_staff_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_staff_services
    ADD CONSTRAINT booking_staff_services_pkey PRIMARY KEY (id);
--
-- Name: booking_staff_services booking_staff_services_staff_id_service_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_staff_services
    ADD CONSTRAINT booking_staff_services_staff_id_service_id_key UNIQUE (staff_id, service_id);
--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);
--
-- Name: brand_settings brand_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_settings
    ADD CONSTRAINT brand_settings_pkey PRIMARY KEY (id);
--
-- Name: brand_settings brand_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_settings
    ADD CONSTRAINT brand_settings_user_id_key UNIQUE (user_id);
--
-- Name: business_reports business_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_reports
    ADD CONSTRAINT business_reports_pkey PRIMARY KEY (id);
--
-- Name: cad_autosaves cad_autosaves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_autosaves
    ADD CONSTRAINT cad_autosaves_pkey PRIMARY KEY (id);
--
-- Name: cad_project_versions cad_project_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_project_versions
    ADD CONSTRAINT cad_project_versions_pkey PRIMARY KEY (id);
--
-- Name: cad_projects cad_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_projects
    ADD CONSTRAINT cad_projects_pkey PRIMARY KEY (id);
--
-- Name: calculator_history calculator_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculator_history
    ADD CONSTRAINT calculator_history_pkey PRIMARY KEY (id);
--
-- Name: calendar_event_exceptions calendar_event_exceptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_event_exceptions
    ADD CONSTRAINT calendar_event_exceptions_pkey PRIMARY KEY (id);
--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);
--
-- Name: call_sessions call_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_sessions
    ADD CONSTRAINT call_sessions_pkey PRIMARY KEY (id);
--
-- Name: client_assets client_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_assets
    ADD CONSTRAINT client_assets_pkey PRIMARY KEY (id);
--
-- Name: client_billing client_billing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_billing
    ADD CONSTRAINT client_billing_pkey PRIMARY KEY (id);
--
-- Name: client_contracts client_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_pkey PRIMARY KEY (id);
--
-- Name: client_invoices client_invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_invoices
    ADD CONSTRAINT client_invoices_invoice_number_key UNIQUE (invoice_number);
--
-- Name: client_invoices client_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_invoices
    ADD CONSTRAINT client_invoices_pkey PRIMARY KEY (id);
--
-- Name: client_onboarding client_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_onboarding
    ADD CONSTRAINT client_onboarding_pkey PRIMARY KEY (id);
--
-- Name: client_pricing client_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_pricing
    ADD CONSTRAINT client_pricing_pkey PRIMARY KEY (id);
--
-- Name: client_teams client_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_teams
    ADD CONSTRAINT client_teams_pkey PRIMARY KEY (id);
--
-- Name: client_teams client_teams_team_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_teams
    ADD CONSTRAINT client_teams_team_code_key UNIQUE (team_code);
--
-- Name: cms_collections cms_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_collections
    ADD CONSTRAINT cms_collections_pkey PRIMARY KEY (id);
--
-- Name: cms_collections cms_collections_site_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_collections
    ADD CONSTRAINT cms_collections_site_id_slug_key UNIQUE (site_id, slug);
--
-- Name: cms_entries cms_entries_collection_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_entries
    ADD CONSTRAINT cms_entries_collection_id_slug_key UNIQUE (collection_id, slug);
--
-- Name: cms_entries cms_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_entries
    ADD CONSTRAINT cms_entries_pkey PRIMARY KEY (id);
--
-- Name: comm_channel_members comm_channel_members_channel_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channel_members
    ADD CONSTRAINT comm_channel_members_channel_id_user_id_key UNIQUE (channel_id, user_id);
--
-- Name: comm_channel_members comm_channel_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channel_members
    ADD CONSTRAINT comm_channel_members_pkey PRIMARY KEY (id);
--
-- Name: comm_channels comm_channels_join_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channels
    ADD CONSTRAINT comm_channels_join_code_key UNIQUE (join_code);
--
-- Name: comm_channels comm_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channels
    ADD CONSTRAINT comm_channels_pkey PRIMARY KEY (id);
--
-- Name: comm_channels comm_channels_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channels
    ADD CONSTRAINT comm_channels_slug_key UNIQUE (slug);
--
-- Name: comm_messages comm_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_messages
    ADD CONSTRAINT comm_messages_pkey PRIMARY KEY (id);
--
-- Name: comm_presence comm_presence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_presence
    ADD CONSTRAINT comm_presence_pkey PRIMARY KEY (id);
--
-- Name: comm_presence comm_presence_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_presence
    ADD CONSTRAINT comm_presence_user_id_key UNIQUE (user_id);
--
-- Name: comm_reactions comm_reactions_message_id_user_id_emoji_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_reactions
    ADD CONSTRAINT comm_reactions_message_id_user_id_emoji_key UNIQUE (message_id, user_id, emoji);
--
-- Name: comm_reactions comm_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_reactions
    ADD CONSTRAINT comm_reactions_pkey PRIMARY KEY (id);
--
-- Name: comm_read_receipts comm_read_receipts_channel_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_read_receipts
    ADD CONSTRAINT comm_read_receipts_channel_id_user_id_key UNIQUE (channel_id, user_id);
--
-- Name: comm_read_receipts comm_read_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_read_receipts
    ADD CONSTRAINT comm_read_receipts_pkey PRIMARY KEY (id);
--
-- Name: comm_user_settings comm_user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_user_settings
    ADD CONSTRAINT comm_user_settings_pkey PRIMARY KEY (id);
--
-- Name: comm_user_settings comm_user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_user_settings
    ADD CONSTRAINT comm_user_settings_user_id_key UNIQUE (user_id);
--
-- Name: content_requests content_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_requests
    ADD CONSTRAINT content_requests_pkey PRIMARY KEY (id);
--
-- Name: conversations conversations_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_customer_id_key UNIQUE (customer_id);
--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);
--
-- Name: crm_activity_participants crm_activity_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_activity_participants
    ADD CONSTRAINT crm_activity_participants_pkey PRIMARY KEY (id);
--
-- Name: crm_communication_attachments crm_communication_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_communication_attachments
    ADD CONSTRAINT crm_communication_attachments_pkey PRIMARY KEY (id);
--
-- Name: crm_communications crm_communications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_communications
    ADD CONSTRAINT crm_communications_pkey PRIMARY KEY (id);
--
-- Name: crm_companies crm_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_companies
    ADD CONSTRAINT crm_companies_pkey PRIMARY KEY (id);
--
-- Name: crm_contacts crm_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contacts
    ADD CONSTRAINT crm_contacts_pkey PRIMARY KEY (id);
--
-- Name: crm_deal_activities crm_deal_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_deal_activities
    ADD CONSTRAINT crm_deal_activities_pkey PRIMARY KEY (id);
--
-- Name: crm_deals crm_deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_deals
    ADD CONSTRAINT crm_deals_pkey PRIMARY KEY (id);
--
-- Name: crm_financial_links crm_financial_links_entity_type_entity_id_finance_type_fina_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_financial_links
    ADD CONSTRAINT crm_financial_links_entity_type_entity_id_finance_type_fina_key UNIQUE (entity_type, entity_id, finance_type, finance_id);
--
-- Name: crm_financial_links crm_financial_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_financial_links
    ADD CONSTRAINT crm_financial_links_pkey PRIMARY KEY (id);
--
-- Name: crm_lifecycle_history crm_lifecycle_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_lifecycle_history
    ADD CONSTRAINT crm_lifecycle_history_pkey PRIMARY KEY (id);
--
-- Name: crm_lifecycle_stages crm_lifecycle_stages_org_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_lifecycle_stages
    ADD CONSTRAINT crm_lifecycle_stages_org_id_slug_key UNIQUE (org_id, slug);
--
-- Name: crm_lifecycle_stages crm_lifecycle_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_lifecycle_stages
    ADD CONSTRAINT crm_lifecycle_stages_pkey PRIMARY KEY (id);
--
-- Name: crm_opportunities crm_opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_opportunities
    ADD CONSTRAINT crm_opportunities_pkey PRIMARY KEY (id);
--
-- Name: crm_workflow_runs crm_workflow_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_workflow_runs
    ADD CONSTRAINT crm_workflow_runs_pkey PRIMARY KEY (id);
--
-- Name: crm_workflows crm_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_workflows
    ADD CONSTRAINT crm_workflows_pkey PRIMARY KEY (id);
--
-- Name: customer_uploads customer_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_uploads
    ADD CONSTRAINT customer_uploads_pkey PRIMARY KEY (id);
--
-- Name: dashboard_metrics_cache dashboard_metrics_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_metrics_cache
    ADD CONSTRAINT dashboard_metrics_cache_pkey PRIMARY KEY (id);
--
-- Name: dashboard_metrics_cache dashboard_metrics_cache_user_id_metric_key_period_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_metrics_cache
    ADD CONSTRAINT dashboard_metrics_cache_user_id_metric_key_period_key UNIQUE (user_id, metric_key, period);
--
-- Name: designer_assets designer_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designer_assets
    ADD CONSTRAINT designer_assets_pkey PRIMARY KEY (id);
--
-- Name: designer_components designer_components_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designer_components
    ADD CONSTRAINT designer_components_pkey PRIMARY KEY (id);
--
-- Name: designer_pages designer_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designer_pages
    ADD CONSTRAINT designer_pages_pkey PRIMARY KEY (id);
--
-- Name: designer_sites designer_sites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designer_sites
    ADD CONSTRAINT designer_sites_pkey PRIMARY KEY (id);
--
-- Name: document_comments document_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT document_comments_pkey PRIMARY KEY (id);
--
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);
--
-- Name: ecommerce_orders ecommerce_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecommerce_orders
    ADD CONSTRAINT ecommerce_orders_pkey PRIMARY KEY (id);
--
-- Name: ecommerce_settings ecommerce_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecommerce_settings
    ADD CONSTRAINT ecommerce_settings_pkey PRIMARY KEY (id);
--
-- Name: ecommerce_settings ecommerce_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecommerce_settings
    ADD CONSTRAINT ecommerce_settings_user_id_key UNIQUE (user_id);
--
-- Name: email_accounts email_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_accounts
    ADD CONSTRAINT email_accounts_pkey PRIMARY KEY (id);
--
-- Name: email_drafts email_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_drafts
    ADD CONSTRAINT email_drafts_pkey PRIMARY KEY (id);
--
-- Name: email_messages email_messages_account_id_provider_message_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_account_id_provider_message_id_key UNIQUE (account_id, provider_message_id);
--
-- Name: email_messages email_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_pkey PRIMARY KEY (id);
--
-- Name: enquiries enquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_pkey PRIMARY KEY (id);
--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);
--
-- Name: greeting_messages greeting_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.greeting_messages
    ADD CONSTRAINT greeting_messages_pkey PRIMARY KEY (id);
--
-- Name: greeting_messages greeting_messages_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.greeting_messages
    ADD CONSTRAINT greeting_messages_user_id_key UNIQUE (user_id);
--
-- Name: hr_candidates hr_candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_candidates
    ADD CONSTRAINT hr_candidates_pkey PRIMARY KEY (id);
--
-- Name: hr_employees hr_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_employees
    ADD CONSTRAINT hr_employees_pkey PRIMARY KEY (id);
--
-- Name: hr_performance_reviews hr_performance_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_performance_reviews
    ADD CONSTRAINT hr_performance_reviews_pkey PRIMARY KEY (id);
