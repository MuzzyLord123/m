
-- Enums
DO $$ BEGIN
  CREATE TYPE public.crm_comm_kind AS ENUM ('email','call','meeting','note','sms','chat','task','file','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_comm_direction AS ENUM ('inbound','outbound','internal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- crm_communications
CREATE TABLE IF NOT EXISTS public.crm_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  owner_id uuid,
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  kind public.crm_comm_kind NOT NULL,
  direction public.crm_comm_direction NOT NULL DEFAULT 'outbound',
  subject text,
  body text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds int,
  from_address text,
  to_addresses text[] DEFAULT '{}',
  cc_addresses text[] DEFAULT '{}',
  status text,
  external_id text,
  external_source text,
  tags text[] DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (company_id IS NOT NULL OR contact_id IS NOT NULL OR opportunity_id IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_communications TO authenticated;
GRANT ALL ON public.crm_communications TO service_role;
ALTER TABLE public.crm_communications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org members manage crm_communications" ON public.crm_communications;
CREATE POLICY "org members manage crm_communications"
  ON public.crm_communications FOR ALL
  USING (org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_crm_comm_org ON public.crm_communications(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_comm_company ON public.crm_communications(company_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_comm_contact ON public.crm_communications(contact_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_comm_opp ON public.crm_communications(opportunity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_comm_kind ON public.crm_communications(kind);
CREATE INDEX IF NOT EXISTS idx_crm_comm_external ON public.crm_communications(external_source, external_id);

DROP TRIGGER IF EXISTS trg_crm_comm_updated ON public.crm_communications;
CREATE TRIGGER trg_crm_comm_updated BEFORE UPDATE ON public.crm_communications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- crm_activity_participants
CREATE TABLE IF NOT EXISTS public.crm_activity_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_id uuid NOT NULL REFERENCES public.crm_communications(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  user_id uuid,
  role text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_activity_participants TO authenticated;
GRANT ALL ON public.crm_activity_participants TO service_role;
ALTER TABLE public.crm_activity_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org members manage activity_participants" ON public.crm_activity_participants;
CREATE POLICY "org members manage activity_participants"
  ON public.crm_activity_participants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.crm_communications c
    WHERE c.id = communication_id
      AND (c.org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_communications c
    WHERE c.id = communication_id
      AND (c.org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'))
  ));

CREATE INDEX IF NOT EXISTS idx_crm_participants_comm ON public.crm_activity_participants(communication_id);

-- crm_communication_attachments
CREATE TABLE IF NOT EXISTS public.crm_communication_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_id uuid NOT NULL REFERENCES public.crm_communications(id) ON DELETE CASCADE,
  platform_file_id uuid,
  filename text,
  file_url text,
  content_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_communication_attachments TO authenticated;
GRANT ALL ON public.crm_communication_attachments TO service_role;
ALTER TABLE public.crm_communication_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org members manage crm_comm_attachments" ON public.crm_communication_attachments;
CREATE POLICY "org members manage crm_comm_attachments"
  ON public.crm_communication_attachments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.crm_communications c
    WHERE c.id = communication_id
      AND (c.org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_communications c
    WHERE c.id = communication_id
      AND (c.org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'))
  ));

CREATE INDEX IF NOT EXISTS idx_crm_comm_att_comm ON public.crm_communication_attachments(communication_id);

-- Unified timeline RPC
CREATE OR REPLACE FUNCTION public.crm_timeline(
  _entity_type text,
  _entity_id uuid,
  _limit int DEFAULT 50,
  _before timestamptz DEFAULT NULL
)
RETURNS TABLE (
  event_id uuid,
  event_type text,       -- 'communication' | 'lifecycle'
  kind text,             -- comm kind or 'lifecycle'
  direction text,
  subject text,
  body text,
  occurred_at timestamptz,
  actor_id uuid,
  metadata jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
BEGIN
  -- Resolve org & authorize
  IF _entity_type = 'company' THEN
    SELECT org_id INTO v_org FROM public.crm_companies WHERE id = _entity_id;
  ELSIF _entity_type = 'contact' THEN
    SELECT org_id INTO v_org FROM public.crm_contacts WHERE id = _entity_id;
  ELSIF _entity_type = 'opportunity' THEN
    SELECT org_id INTO v_org FROM public.crm_opportunities WHERE id = _entity_id;
  ELSE
    RAISE EXCEPTION 'Unknown entity_type: %', _entity_type;
  END IF;

  IF v_org IS NULL THEN RETURN; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR v_org = public.get_primary_admin_id()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  RETURN QUERY
  (
    SELECT c.id, 'communication'::text, c.kind::text, c.direction::text,
           c.subject, c.body, c.occurred_at, c.owner_id,
           jsonb_build_object('from', c.from_address, 'to', c.to_addresses,
                              'status', c.status, 'duration', c.duration_seconds,
                              'tags', c.tags) || c.metadata
    FROM public.crm_communications c
    WHERE (_before IS NULL OR c.occurred_at < _before)
      AND (
        (_entity_type = 'company'     AND c.company_id     = _entity_id) OR
        (_entity_type = 'contact'     AND c.contact_id     = _entity_id) OR
        (_entity_type = 'opportunity' AND c.opportunity_id = _entity_id)
      )
  )
  UNION ALL
  (
    SELECT h.id, 'lifecycle'::text, 'lifecycle'::text, NULL::text,
           COALESCE(s2.name, 'Stage changed'),
           h.note,
           h.created_at, h.changed_by,
           jsonb_build_object('from_stage', s1.name, 'to_stage', s2.name)
    FROM public.crm_lifecycle_history h
    LEFT JOIN public.crm_lifecycle_stages s1 ON s1.id = h.from_stage_id
    LEFT JOIN public.crm_lifecycle_stages s2 ON s2.id = h.to_stage_id
    WHERE h.entity_type = _entity_type
      AND h.entity_id = _entity_id
      AND (_before IS NULL OR h.created_at < _before)
  )
  ORDER BY 7 DESC
  LIMIT _limit;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_timeline(text, uuid, int, timestamptz) FROM public;
GRANT EXECUTE ON FUNCTION public.crm_timeline(text, uuid, int, timestamptz) TO authenticated;

-- Convenience RPC to log a communication (validates org + auto-fills)
CREATE OR REPLACE FUNCTION public.crm_log_communication(
  _kind text,
  _direction text DEFAULT 'outbound',
  _subject text DEFAULT NULL,
  _body text DEFAULT NULL,
  _company_id uuid DEFAULT NULL,
  _contact_id uuid DEFAULT NULL,
  _opportunity_id uuid DEFAULT NULL,
  _occurred_at timestamptz DEFAULT now(),
  _from_address text DEFAULT NULL,
  _to_addresses text[] DEFAULT '{}',
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid := public.get_primary_admin_id();
  v_id uuid;
BEGIN
  IF _company_id IS NULL AND _contact_id IS NULL AND _opportunity_id IS NULL THEN
    RAISE EXCEPTION 'At least one of company/contact/opportunity is required';
  END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR v_org IS NOT NULL) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  INSERT INTO public.crm_communications
    (org_id, owner_id, company_id, contact_id, opportunity_id,
     kind, direction, subject, body, occurred_at,
     from_address, to_addresses, metadata)
  VALUES
    (v_org, auth.uid(), _company_id, _contact_id, _opportunity_id,
     _kind::public.crm_comm_kind, _direction::public.crm_comm_direction,
     _subject, _body, _occurred_at,
     _from_address, _to_addresses, _metadata)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_log_communication(text, text, text, text, uuid, uuid, uuid, timestamptz, text, text[], jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.crm_log_communication(text, text, text, text, uuid, uuid, uuid, timestamptz, text, text[], jsonb) TO authenticated;
