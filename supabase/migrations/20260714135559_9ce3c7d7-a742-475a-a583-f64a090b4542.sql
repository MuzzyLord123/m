
-- Workflows definition table
CREATE TABLE public.crm_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL CHECK (trigger_event IN (
    'lifecycle_change','entity_created','tag_added','renewal_due','no_activity','manual'
  )),
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  priority int NOT NULL DEFAULT 100,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_workflows TO authenticated;
GRANT ALL ON public.crm_workflows TO service_role;

ALTER TABLE public.crm_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_workflows org access"
ON public.crm_workflows FOR ALL TO authenticated
USING (org_id = public.get_primary_admin_id())
WITH CHECK (org_id = public.get_primary_admin_id());

CREATE INDEX idx_crm_workflows_org_active ON public.crm_workflows (org_id, is_active, trigger_event);

CREATE TRIGGER trg_crm_workflows_updated_at
BEFORE UPDATE ON public.crm_workflows
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Workflow run audit
CREATE TABLE public.crm_workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  workflow_id uuid REFERENCES public.crm_workflows(id) ON DELETE CASCADE,
  entity_type text,
  entity_id uuid,
  trigger_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions_executed jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success','partial','failed','skipped')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.crm_workflow_runs TO authenticated;
GRANT ALL ON public.crm_workflow_runs TO service_role;

ALTER TABLE public.crm_workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_workflow_runs org read"
ON public.crm_workflow_runs FOR SELECT TO authenticated
USING (org_id = public.get_primary_admin_id());

CREATE POLICY "crm_workflow_runs org insert"
ON public.crm_workflow_runs FOR INSERT TO authenticated
WITH CHECK (org_id = public.get_primary_admin_id());

CREATE INDEX idx_crm_workflow_runs_workflow ON public.crm_workflow_runs (workflow_id, created_at DESC);
CREATE INDEX idx_crm_workflow_runs_entity ON public.crm_workflow_runs (entity_type, entity_id);

-- ============================================================
-- Executor: runs one workflow's actions against one entity
-- ============================================================
CREATE OR REPLACE FUNCTION public.crm_execute_workflow_actions(
  _workflow_id uuid,
  _entity_type text,
  _entity_id uuid,
  _payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wf record;
  action jsonb;
  executed jsonb := '[]'::jsonb;
  action_result jsonb;
  company_row public.crm_companies%ROWTYPE;
  contact_row public.crm_contacts%ROWTYPE;
  opp_row public.crm_opportunities%ROWTYPE;
  admin_id uuid := public.get_primary_admin_id();
BEGIN
  SELECT * INTO wf FROM public.crm_workflows WHERE id = _workflow_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','workflow not found'); END IF;

  IF _entity_type = 'company' THEN
    SELECT * INTO company_row FROM public.crm_companies WHERE id = _entity_id;
  ELSIF _entity_type = 'contact' THEN
    SELECT * INTO contact_row FROM public.crm_contacts WHERE id = _entity_id;
  ELSIF _entity_type = 'opportunity' THEN
    SELECT * INTO opp_row FROM public.crm_opportunities WHERE id = _entity_id;
  END IF;

  FOR action IN SELECT * FROM jsonb_array_elements(wf.actions) LOOP
    action_result := jsonb_build_object('type', action->>'type', 'ok', true);
    BEGIN
      CASE action->>'type'
        WHEN 'create_onboarding' THEN
          IF _entity_type = 'company' AND company_row.id IS NOT NULL THEN
            INSERT INTO public.client_onboarding (
              user_id, client_name, company_name, status, account_created, account_created_at
            ) VALUES (
              admin_id,
              COALESCE(company_row.name,'New Client'),
              company_row.name,
              'pending',
              false,
              now()
            )
            ON CONFLICT DO NOTHING;
          END IF;

        WHEN 'log_communication' THEN
          INSERT INTO public.crm_communications (
            org_id, kind, direction, subject, body, occurred_at,
            company_id, contact_id, opportunity_id, status, metadata
          ) VALUES (
            admin_id,
            'system',
            'internal',
            COALESCE(action->>'subject','Workflow event'),
            COALESCE(action->>'body', wf.name),
            now(),
            CASE WHEN _entity_type='company' THEN _entity_id END,
            CASE WHEN _entity_type='contact' THEN _entity_id END,
            CASE WHEN _entity_type='opportunity' THEN _entity_id END,
            'completed',
            jsonb_build_object('workflow_id', wf.id, 'workflow_name', wf.name)
          );

        WHEN 'add_tag' THEN
          IF _entity_type = 'company' THEN
            UPDATE public.crm_companies
              SET tags = COALESCE(tags,'{}') || ARRAY[action->>'tag']
            WHERE id = _entity_id AND NOT (COALESCE(tags,'{}') @> ARRAY[action->>'tag']);
          ELSIF _entity_type = 'contact' THEN
            UPDATE public.crm_contacts
              SET tags = COALESCE(tags,'{}') || ARRAY[action->>'tag']
            WHERE id = _entity_id AND NOT (COALESCE(tags,'{}') @> ARRAY[action->>'tag']);
          END IF;

        WHEN 'create_project' THEN
          IF _entity_type IN ('company','opportunity') THEN
            INSERT INTO public.app_projects (
              user_id, project_name, project_type, status, priority, description
            ) VALUES (
              admin_id,
              COALESCE(action->>'project_name',
                CASE WHEN _entity_type='company' THEN company_row.name ELSE opp_row.title END,
                'New Delivery'),
              COALESCE(action->>'project_type','website'),
              'planning',
              COALESCE(action->>'priority','medium'),
              'Auto-created by workflow: '||wf.name
            );
          END IF;

        WHEN 'notify_owner' THEN
          -- Insert a notification for the entity owner if we have one
          DECLARE owner uuid;
          BEGIN
            owner := CASE _entity_type
              WHEN 'company' THEN company_row.owner_id
              WHEN 'contact' THEN contact_row.owner_id
              WHEN 'opportunity' THEN opp_row.owner_id
            END;
            IF owner IS NOT NULL THEN
              INSERT INTO public.notifications (user_id, type, title, message, metadata)
              VALUES (owner, 'crm_workflow',
                COALESCE(action->>'title', wf.name),
                COALESCE(action->>'message','A CRM workflow was triggered.'),
                jsonb_build_object('workflow_id', wf.id, 'entity_type', _entity_type, 'entity_id', _entity_id));
            END IF;
          END;

        ELSE
          action_result := jsonb_set(action_result, '{ok}', 'false'::jsonb);
          action_result := jsonb_set(action_result, '{error}', to_jsonb('unknown action type'::text));
      END CASE;
    EXCEPTION WHEN OTHERS THEN
      action_result := jsonb_set(action_result, '{ok}', 'false'::jsonb);
      action_result := jsonb_set(action_result, '{error}', to_jsonb(SQLERRM));
    END;
    executed := executed || action_result;
  END LOOP;

  INSERT INTO public.crm_workflow_runs (
    org_id, workflow_id, entity_type, entity_id, trigger_payload, actions_executed,
    status
  ) VALUES (
    admin_id, wf.id, _entity_type, _entity_id, _payload, executed,
    CASE WHEN executed @> '[{"ok":false}]'::jsonb THEN 'partial' ELSE 'success' END
  );

  RETURN jsonb_build_object('workflow_id', wf.id, 'executed', executed);
END;
$$;

REVOKE ALL ON FUNCTION public.crm_execute_workflow_actions(uuid, text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_execute_workflow_actions(uuid, text, uuid, jsonb) TO authenticated;

-- ============================================================
-- Dispatcher: on lifecycle change, run matching workflows
-- ============================================================
CREATE OR REPLACE FUNCTION public.crm_dispatch_lifecycle_workflows()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wf record;
  from_slug text;
  to_slug text;
  target_stage text;
BEGIN
  SELECT slug INTO from_slug FROM public.crm_lifecycle_stages WHERE id = NEW.from_stage_id;
  SELECT slug INTO to_slug FROM public.crm_lifecycle_stages WHERE id = NEW.to_stage_id;

  FOR wf IN
    SELECT * FROM public.crm_workflows
    WHERE org_id = NEW.org_id
      AND is_active = true
      AND trigger_event = 'lifecycle_change'
      AND (trigger_config->>'entity_type' IS NULL OR trigger_config->>'entity_type' = NEW.entity_type)
    ORDER BY priority ASC
  LOOP
    target_stage := wf.trigger_config->>'to_stage';
    IF target_stage IS NULL OR target_stage = to_slug THEN
      IF wf.trigger_config->>'from_stage' IS NULL OR wf.trigger_config->>'from_stage' = from_slug THEN
        PERFORM public.crm_execute_workflow_actions(
          wf.id,
          NEW.entity_type,
          NEW.entity_id,
          jsonb_build_object('from_stage', from_slug, 'to_stage', to_slug, 'note', NEW.note)
        );
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_dispatch_lifecycle ON public.crm_lifecycle_history;
CREATE TRIGGER trg_crm_dispatch_lifecycle
AFTER INSERT ON public.crm_lifecycle_history
FOR EACH ROW EXECUTE FUNCTION public.crm_dispatch_lifecycle_workflows();

-- Manual run RPC
CREATE OR REPLACE FUNCTION public.crm_run_workflow(
  _workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.crm_execute_workflow_actions(_workflow_id, _entity_type, _entity_id, _payload);
$$;

REVOKE ALL ON FUNCTION public.crm_run_workflow(uuid, text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_run_workflow(uuid, text, uuid, jsonb) TO authenticated;

-- ============================================================
-- Seed 3 default workflows per admin org
-- ============================================================
INSERT INTO public.crm_workflows (org_id, name, description, trigger_event, trigger_config, actions, priority)
SELECT DISTINCT ls.org_id,
  'New Customer Onboarding',
  'When a company enters the Customer stage, create an onboarding record and log a note.',
  'lifecycle_change',
  jsonb_build_object('entity_type','company','to_stage','customer'),
  jsonb_build_array(
    jsonb_build_object('type','create_onboarding'),
    jsonb_build_object('type','log_communication','subject','Onboarding started','body','Customer onboarding was auto-initiated by workflow.'),
    jsonb_build_object('type','add_tag','tag','onboarding')
  ),
  10
FROM public.crm_lifecycle_stages ls
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_workflows w WHERE w.org_id = ls.org_id AND w.name = 'New Customer Onboarding'
);

INSERT INTO public.crm_workflows (org_id, name, description, trigger_event, trigger_config, actions, priority)
SELECT DISTINCT ls.org_id,
  'Lead Nurture Reminder',
  'When a contact enters the Contacted stage, log a follow-up-due note.',
  'lifecycle_change',
  jsonb_build_object('entity_type','contact','to_stage','contacted'),
  jsonb_build_array(
    jsonb_build_object('type','log_communication','subject','Follow-up due','body','Contact was marked as Contacted — schedule a follow-up within 3 days.'),
    jsonb_build_object('type','notify_owner','title','Follow-up due','message','You have a new contact to follow up with.')
  ),
  20
FROM public.crm_lifecycle_stages ls
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_workflows w WHERE w.org_id = ls.org_id AND w.name = 'Lead Nurture Reminder'
);

INSERT INTO public.crm_workflows (org_id, name, description, trigger_event, trigger_config, actions, priority)
SELECT DISTINCT ls.org_id,
  'Deal Won → Project',
  'When an opportunity enters the Customer stage, create a delivery project placeholder.',
  'lifecycle_change',
  jsonb_build_object('entity_type','opportunity','to_stage','customer'),
  jsonb_build_array(
    jsonb_build_object('type','create_project','project_type','website','priority','high'),
    jsonb_build_object('type','log_communication','subject','Delivery kick-off','body','Deal marked as won — a delivery project has been created.')
  ),
  30
FROM public.crm_lifecycle_stages ls
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_workflows w WHERE w.org_id = ls.org_id AND w.name = 'Deal Won → Project'
);
