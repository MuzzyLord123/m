-- Owners tier, call logging with transcripts, phone pairing, and
-- per-admin controls (owner-approved build, 2026-07-30). Mirror of the
-- applied migration owners_calls_admin_controls.

CREATE TABLE IF NOT EXISTS public.platform_owners (
  user_id uuid PRIMARY KEY,
  added_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_owners_read ON public.platform_owners;
CREATE POLICY platform_owners_read ON public.platform_owners FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.platform_owners TO authenticated;

INSERT INTO public.platform_owners (user_id)
SELECT id FROM auth.users WHERE lower(email) IN ('finleyevans2005@gmail.com', 'zakmuzzy100@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_platform_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.platform_owners WHERE user_id = _user_id); $$;
GRANT EXECUTE ON FUNCTION public.is_platform_owner(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.am_i_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.is_platform_owner(auth.uid()); $$;
GRANT EXECUTE ON FUNCTION public.am_i_platform_owner() TO authenticated;

CREATE TABLE IF NOT EXISTS public.crm_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  entity_type text,
  entity_id uuid,
  entity_name text,
  phone text NOT NULL,
  source text NOT NULL DEFAULT 'desktop',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  outcome text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_call_logs_admin ON public.crm_call_logs (admin_id, started_at DESC);
ALTER TABLE public.crm_call_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_call_logs_select ON public.crm_call_logs;
CREATE POLICY crm_call_logs_select ON public.crm_call_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND (admin_id = auth.uid() OR public.is_platform_owner(auth.uid())));
DROP POLICY IF EXISTS crm_call_logs_insert ON public.crm_call_logs;
CREATE POLICY crm_call_logs_insert ON public.crm_call_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid());
DROP POLICY IF EXISTS crm_call_logs_update ON public.crm_call_logs;
CREATE POLICY crm_call_logs_update ON public.crm_call_logs FOR UPDATE TO authenticated
  USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());
GRANT SELECT, INSERT, UPDATE ON public.crm_call_logs TO authenticated;

CREATE TABLE IF NOT EXISTS public.crm_call_transcripts (
  call_id uuid PRIMARY KEY REFERENCES public.crm_call_logs(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  method text NOT NULL DEFAULT 'device microphone',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_call_transcripts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_call_transcripts_select ON public.crm_call_transcripts;
CREATE POLICY crm_call_transcripts_select ON public.crm_call_transcripts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND (admin_id = auth.uid() OR public.is_platform_owner(auth.uid())));
DROP POLICY IF EXISTS crm_call_transcripts_write ON public.crm_call_transcripts;
CREATE POLICY crm_call_transcripts_write ON public.crm_call_transcripts FOR ALL TO authenticated
  USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_call_transcripts TO authenticated;

CREATE TABLE IF NOT EXISTS public.crm_phone_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  device_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  last_seen_at timestamptz
);
ALTER TABLE public.crm_phone_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_phone_links_own ON public.crm_phone_links;
CREATE POLICY crm_phone_links_own ON public.crm_phone_links FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_phone_links TO authenticated;

CREATE TABLE IF NOT EXISTS public.crm_call_pushes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  entity_type text,
  entity_id uuid,
  entity_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  handled_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_crm_call_pushes_user ON public.crm_call_pushes (user_id, created_at DESC);
ALTER TABLE public.crm_call_pushes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_call_pushes_own ON public.crm_call_pushes;
CREATE POLICY crm_call_pushes_own ON public.crm_call_pushes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_call_pushes TO authenticated;

CREATE TABLE IF NOT EXISTS public.admin_controls (
  user_id uuid PRIMARY KEY,
  hidden_tabs text[] NOT NULL DEFAULT '{}',
  can_create_accounts boolean NOT NULL DEFAULT true,
  can_manage_admins boolean NOT NULL DEFAULT false,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_controls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_controls_select ON public.admin_controls;
CREATE POLICY admin_controls_select ON public.admin_controls FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_owner(auth.uid()));
DROP POLICY IF EXISTS admin_controls_write ON public.admin_controls;
CREATE POLICY admin_controls_write ON public.admin_controls FOR ALL TO authenticated
  USING (public.is_platform_owner(auth.uid()))
  WITH CHECK (public.is_platform_owner(auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_controls TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_admin_stats()
RETURNS TABLE(
  user_id uuid, email text, full_name text, is_owner boolean,
  last_sign_in_at timestamptz, created_at timestamptz,
  calls_today bigint, calls_week bigint, calls_total bigint,
  avg_duration_seconds numeric, connected bigint, no_answer bigint,
  companies_assigned bigint, contacts_assigned bigint, conversions bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    u.id, u.email::text,
    COALESCE(p.full_name, u.raw_user_meta_data->>'full_name')::text,
    public.is_platform_owner(u.id),
    u.last_sign_in_at, u.created_at,
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.started_at >= date_trunc('day', now())),
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.started_at >= now() - interval '7 days'),
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id),
    (SELECT round(avg(c.duration_seconds)) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.duration_seconds IS NOT NULL),
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.outcome = 'connected'),
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.outcome = 'no_answer'),
    (SELECT count(*) FROM public.crm_companies co WHERE co.owner_id = u.id),
    (SELECT count(*) FROM public.crm_contacts ct WHERE ct.owner_id = u.id),
    (SELECT count(*) FROM public.crm_lifecycle_history h
       JOIN public.crm_lifecycle_stages s ON s.id = h.to_stage_id
      WHERE h.changed_by = u.id AND s.category = 'customer')
  FROM auth.users u
  JOIN public.user_roles r ON r.user_id = u.id AND r.role = 'admin'
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE public.is_platform_owner(auth.uid())
  ORDER BY public.is_platform_owner(u.id) DESC, u.created_at;
$$;
GRANT EXECUTE ON FUNCTION public.owner_admin_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_call_feed(_limit integer DEFAULT 80)
RETURNS TABLE(
  call_id uuid, admin_id uuid, admin_email text, admin_name text,
  entity_type text, entity_id uuid, entity_name text, phone text,
  source text, started_at timestamptz, duration_seconds integer,
  outcome text, notes text, transcript text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT c.id, c.admin_id, u.email::text,
         COALESCE(p.full_name, u.raw_user_meta_data->>'full_name')::text,
         c.entity_type, c.entity_id, c.entity_name, c.phone,
         c.source, c.started_at, c.duration_seconds, c.outcome, c.notes,
         t.content
  FROM public.crm_call_logs c
  JOIN auth.users u ON u.id = c.admin_id
  LEFT JOIN public.profiles p ON p.user_id = c.admin_id
  LEFT JOIN public.crm_call_transcripts t ON t.call_id = c.id
  WHERE public.is_platform_owner(auth.uid())
  ORDER BY c.started_at DESC
  LIMIT _limit;
$$;
GRANT EXECUTE ON FUNCTION public.owner_call_feed(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_set_channel_member(_channel_id uuid, _user_id uuid, _member boolean)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_platform_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF _member THEN
    INSERT INTO public.comm_channel_members (channel_id, user_id, role)
    VALUES (_channel_id, _user_id, 'member')
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.comm_channel_members WHERE channel_id = _channel_id AND user_id = _user_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.owner_set_channel_member(uuid, uuid, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';
