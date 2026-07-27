
-- Create client onboarding tracking table
CREATE TABLE public.client_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  company_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Step tracking
  account_created BOOLEAN NOT NULL DEFAULT false,
  account_created_at TIMESTAMPTZ,
  portal_configured BOOLEAN NOT NULL DEFAULT false,
  portal_configured_at TIMESTAMPTZ,
  welcome_sent BOOLEAN NOT NULL DEFAULT false,
  welcome_sent_at TIMESTAMPTZ,
  info_checklist_sent BOOLEAN NOT NULL DEFAULT false,
  info_checklist_sent_at TIMESTAMPTZ,
  assets_requested BOOLEAN NOT NULL DEFAULT false,
  assets_requested_at TIMESTAMPTZ,
  timeline_generated BOOLEAN NOT NULL DEFAULT false,
  timeline_generated_at TIMESTAMPTZ,
  
  -- Metadata
  checklist_items JSONB DEFAULT '[]'::jsonb,
  timeline_data JSONB DEFAULT '{}'::jsonb,
  onboarding_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding records"
ON public.client_onboarding FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own onboarding records"
ON public.client_onboarding FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding records"
ON public.client_onboarding FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own onboarding records"
ON public.client_onboarding FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_client_onboarding_user ON public.client_onboarding(user_id);
CREATE INDEX idx_client_onboarding_deal ON public.client_onboarding(deal_id);
CREATE INDEX idx_client_onboarding_status ON public.client_onboarding(status);

-- Trigger for updated_at
CREATE TRIGGER update_client_onboarding_updated_at
BEFORE UPDATE ON public.client_onboarding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
