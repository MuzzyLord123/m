-- The CRM calls crm_set_lifecycle_stage whenever a stage is set (record
-- view, pipeline board drag, bulk change stage). The function was
-- declared in the generated types but never existed in the database, so
-- every stage change returned "Could not find the function" - the error
-- the owner reported. This restores it: it moves the stage, records the
-- move in crm_lifecycle_history (which fires the workflow dispatch
-- trigger and feeds the record timeline), and carries an optional note.
CREATE OR REPLACE FUNCTION public.crm_set_lifecycle_stage(
  _entity_type text, _entity_id uuid, _new_stage_id uuid, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org uuid;
  v_from uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  IF _entity_type = 'company' THEN
    SELECT org_id, lifecycle_stage_id INTO v_org, v_from FROM public.crm_companies WHERE id = _entity_id;
  ELSIF _entity_type = 'contact' THEN
    SELECT org_id, lifecycle_stage_id INTO v_org, v_from FROM public.crm_contacts WHERE id = _entity_id;
  ELSIF _entity_type = 'opportunity' THEN
    SELECT org_id, lifecycle_stage_id INTO v_org, v_from FROM public.crm_opportunities WHERE id = _entity_id;
  ELSE
    RAISE EXCEPTION 'Unknown entity_type: %', _entity_type;
  END IF;

  IF v_org IS NULL THEN RAISE EXCEPTION 'Record not found'; END IF;
  IF NOT (public.has_role(auth.uid(), 'admin') OR v_org = public.get_primary_admin_id() OR v_org = auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  IF _new_stage_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.crm_lifecycle_stages s WHERE s.id = _new_stage_id AND s.org_id = v_org
  ) THEN
    RAISE EXCEPTION 'That stage does not belong to this workspace';
  END IF;

  IF _new_stage_id IS NOT DISTINCT FROM v_from THEN RETURN; END IF;

  IF _entity_type = 'company' THEN
    UPDATE public.crm_companies SET lifecycle_stage_id = _new_stage_id, updated_at = now() WHERE id = _entity_id;
  ELSIF _entity_type = 'contact' THEN
    UPDATE public.crm_contacts SET lifecycle_stage_id = _new_stage_id, updated_at = now() WHERE id = _entity_id;
  ELSE
    UPDATE public.crm_opportunities SET lifecycle_stage_id = _new_stage_id, updated_at = now() WHERE id = _entity_id;
  END IF;

  INSERT INTO public.crm_lifecycle_history (org_id, entity_type, entity_id, from_stage_id, to_stage_id, changed_by, note)
  VALUES (v_org, _entity_type, _entity_id, v_from, _new_stage_id, auth.uid(), NULLIF(btrim(COALESCE(_note, '')), ''));
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_set_lifecycle_stage(text, uuid, uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
