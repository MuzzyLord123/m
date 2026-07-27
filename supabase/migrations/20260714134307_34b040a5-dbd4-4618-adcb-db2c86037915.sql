
-- 1) Seed default lifecycle stages for the primary admin org
INSERT INTO public.crm_lifecycle_stages (org_id, name, slug, category, order_index, color, is_default)
SELECT public.get_primary_admin_id(), s.name, s.slug, s.category::public.crm_lifecycle_category, s.order_index, s.color, s.is_default
FROM (VALUES
  ('New Lead',     'new-lead',     'lead',     10, '#94a3b8', true),
  ('Contacted',    'contacted',    'lead',     20, '#60a5fa', false),
  ('Qualified',    'qualified',    'prospect', 30, '#22d3ee', false),
  ('Proposal',     'proposal',     'prospect', 40, '#a78bfa', false),
  ('Negotiation',  'negotiation',  'prospect', 50, '#f59e0b', false),
  ('Customer',     'customer',     'customer', 60, '#10b981', false),
  ('Churned',      'churned',      'churned',  70, '#ef4444', false),
  ('Lost',         'lost',         'other',    80, '#6b7280', false)
) AS s(name, slug, category, order_index, color, is_default)
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_lifecycle_stages x
  WHERE x.org_id = public.get_primary_admin_id() AND x.slug = s.slug
);

-- 2) Trigger function: log every lifecycle stage change
CREATE OR REPLACE FUNCTION public.crm_log_lifecycle_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_type text;
BEGIN
  IF NEW.lifecycle_stage_id IS DISTINCT FROM OLD.lifecycle_stage_id THEN
    v_entity_type := CASE TG_TABLE_NAME
      WHEN 'crm_companies' THEN 'company'
      WHEN 'crm_contacts' THEN 'contact'
      WHEN 'crm_opportunities' THEN 'opportunity'
      ELSE TG_TABLE_NAME
    END;
    INSERT INTO public.crm_lifecycle_history
      (org_id, entity_type, entity_id, from_stage_id, to_stage_id, changed_by)
    VALUES
      (NEW.org_id, v_entity_type, NEW.id, OLD.lifecycle_stage_id, NEW.lifecycle_stage_id, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_companies_lifecycle ON public.crm_companies;
CREATE TRIGGER trg_crm_companies_lifecycle
  AFTER UPDATE OF lifecycle_stage_id ON public.crm_companies
  FOR EACH ROW EXECUTE FUNCTION public.crm_log_lifecycle_change();

DROP TRIGGER IF EXISTS trg_crm_contacts_lifecycle ON public.crm_contacts;
CREATE TRIGGER trg_crm_contacts_lifecycle
  AFTER UPDATE OF lifecycle_stage_id ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.crm_log_lifecycle_change();

DROP TRIGGER IF EXISTS trg_crm_opps_lifecycle ON public.crm_opportunities;
CREATE TRIGGER trg_crm_opps_lifecycle
  AFTER UPDATE OF lifecycle_stage_id ON public.crm_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.crm_log_lifecycle_change();

-- 3) Helper RPC to move an entity to a stage with an optional note
CREATE OR REPLACE FUNCTION public.crm_set_lifecycle_stage(
  _entity_type text,
  _entity_id uuid,
  _new_stage_id uuid,
  _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_from uuid;
BEGIN
  IF _entity_type = 'company' THEN
    SELECT org_id, lifecycle_stage_id INTO v_org, v_from FROM public.crm_companies WHERE id = _entity_id;
    UPDATE public.crm_companies SET lifecycle_stage_id = _new_stage_id WHERE id = _entity_id;
  ELSIF _entity_type = 'contact' THEN
    SELECT org_id, lifecycle_stage_id INTO v_org, v_from FROM public.crm_contacts WHERE id = _entity_id;
    UPDATE public.crm_contacts SET lifecycle_stage_id = _new_stage_id WHERE id = _entity_id;
  ELSIF _entity_type = 'opportunity' THEN
    SELECT org_id, lifecycle_stage_id INTO v_org, v_from FROM public.crm_opportunities WHERE id = _entity_id;
    UPDATE public.crm_opportunities SET lifecycle_stage_id = _new_stage_id WHERE id = _entity_id;
  ELSE
    RAISE EXCEPTION 'Unknown entity_type: %', _entity_type;
  END IF;

  IF v_org IS NULL THEN RAISE EXCEPTION 'Entity not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR v_org = public.get_primary_admin_id()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  IF _note IS NOT NULL AND v_from IS NOT DISTINCT FROM _new_stage_id THEN
    INSERT INTO public.crm_lifecycle_history (org_id, entity_type, entity_id, from_stage_id, to_stage_id, changed_by, note)
    VALUES (v_org, _entity_type, _entity_id, v_from, _new_stage_id, auth.uid(), _note);
  ELSIF _note IS NOT NULL THEN
    -- update the just-written trigger row with the note
    UPDATE public.crm_lifecycle_history
      SET note = _note
      WHERE id = (
        SELECT id FROM public.crm_lifecycle_history
        WHERE entity_type = _entity_type AND entity_id = _entity_id
        ORDER BY created_at DESC LIMIT 1
      );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_set_lifecycle_stage(text, uuid, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.crm_set_lifecycle_stage(text, uuid, uuid, text) TO authenticated;

-- 4) Backfill: set every existing migrated company/contact to "New Lead"
UPDATE public.crm_companies c
SET lifecycle_stage_id = s.id
FROM public.crm_lifecycle_stages s
WHERE c.lifecycle_stage_id IS NULL
  AND s.org_id = c.org_id
  AND s.slug = CASE WHEN 'customer' = ANY(c.relationship_type) THEN 'customer' ELSE 'new-lead' END;

UPDATE public.crm_contacts c
SET lifecycle_stage_id = s.id
FROM public.crm_lifecycle_stages s
WHERE c.lifecycle_stage_id IS NULL
  AND s.org_id = c.org_id
  AND s.slug = 'new-lead';
