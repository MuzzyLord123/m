-- Team calls: per-admin statistics every admin can see side by side,
-- and a per-admin call feed with notes and transcripts. Owners can read
-- any admin's calls; a sub-admin can only read their own. Mirror of the
-- applied migration team_calls_stats_and_feed.

CREATE OR REPLACE FUNCTION public.team_call_stats()
RETURNS TABLE(
  user_id uuid, email text, full_name text, is_owner boolean, is_me boolean,
  last_sign_in_at timestamptz,
  calls_today bigint, calls_week bigint, calls_total bigint,
  talk_seconds bigint, avg_duration_seconds numeric,
  connected bigint, callback bigint, voicemail bigint,
  no_answer bigint, wrong_number bigint,
  notes_logged bigint, transcripts bigint,
  conversions bigint, last_call_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    u.id, u.email::text,
    COALESCE(p.full_name, u.raw_user_meta_data->>'full_name')::text,
    public.is_platform_owner(u.id),
    u.id = auth.uid(),
    u.last_sign_in_at,
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.started_at >= date_trunc('day', now())),
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.started_at >= now() - interval '7 days'),
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id),
    (SELECT COALESCE(sum(c.duration_seconds), 0) FROM public.crm_call_logs c WHERE c.admin_id = u.id),
    (SELECT round(avg(c.duration_seconds)) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.duration_seconds IS NOT NULL),
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.outcome = 'connected'),
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.outcome = 'callback'),
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.outcome = 'voicemail'),
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.outcome = 'no_answer'),
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.outcome = 'wrong_number'),
    (SELECT count(*) FROM public.crm_call_logs c WHERE c.admin_id = u.id AND c.notes IS NOT NULL AND btrim(c.notes) <> ''),
    (SELECT count(*) FROM public.crm_call_transcripts t WHERE t.admin_id = u.id AND btrim(t.content) <> ''),
    (SELECT count(*) FROM public.crm_lifecycle_history h
       JOIN public.crm_lifecycle_stages s ON s.id = h.to_stage_id
      WHERE h.changed_by = u.id AND s.category = 'customer'),
    (SELECT max(c.started_at) FROM public.crm_call_logs c WHERE c.admin_id = u.id)
  FROM auth.users u
  JOIN public.user_roles r ON r.user_id = u.id AND r.role = 'admin'
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY public.is_platform_owner(u.id) DESC, u.created_at;
$$;
GRANT EXECUTE ON FUNCTION public.team_call_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.team_admin_calls(_admin_id uuid, _limit integer DEFAULT 200)
RETURNS TABLE(
  call_id uuid, admin_id uuid, admin_email text, admin_name text,
  entity_type text, entity_id uuid, entity_name text, phone text,
  source text, started_at timestamptz, ended_at timestamptz,
  duration_seconds integer, outcome text, notes text, transcript text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT c.id, c.admin_id, u.email::text,
         COALESCE(p.full_name, u.raw_user_meta_data->>'full_name')::text,
         c.entity_type, c.entity_id, c.entity_name, c.phone,
         c.source, c.started_at, c.ended_at, c.duration_seconds,
         c.outcome, c.notes, t.content
  FROM public.crm_call_logs c
  JOIN auth.users u ON u.id = c.admin_id
  LEFT JOIN public.profiles p ON p.user_id = c.admin_id
  LEFT JOIN public.crm_call_transcripts t ON t.call_id = c.id
  WHERE c.admin_id = _admin_id
    AND public.has_role(auth.uid(), 'admin')
    AND (_admin_id = auth.uid() OR public.is_platform_owner(auth.uid()))
  ORDER BY c.started_at DESC
  LIMIT _limit;
$$;
GRANT EXECUTE ON FUNCTION public.team_admin_calls(uuid, integer) TO authenticated;

NOTIFY pgrst, 'reload schema';
