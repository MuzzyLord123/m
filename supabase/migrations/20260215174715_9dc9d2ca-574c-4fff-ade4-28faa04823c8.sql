
-- Create deal_stages enum-style config
CREATE TABLE IF NOT EXISTS public.crm_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  deal_name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'qualification',
  probability INTEGER NOT NULL DEFAULT 20 CHECK (probability >= 0 AND probability <= 100),
  deal_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  expected_close_date DATE,
  actual_close_date DATE,
  won BOOLEAN,
  contact_name TEXT,
  company_name TEXT,
  description TEXT,
  tags TEXT[],
  notes TEXT,
  lost_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deal activity log
CREATE TABLE IF NOT EXISTS public.crm_deal_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- stage_change, note, call, email, meeting
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deal_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for deals
CREATE POLICY "Users can view own deals" ON public.crm_deals FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can create own deals" ON public.crm_deals FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users can update own deals" ON public.crm_deals FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "Users can delete own deals" ON public.crm_deals FOR DELETE USING (public.is_owner(user_id));

-- Admin override for deals
CREATE POLICY "Admins can view all deals" ON public.crm_deals FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all deals" ON public.crm_deals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for deal activities
CREATE POLICY "Users can view own deal activities" ON public.crm_deal_activities FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can create deal activities" ON public.crm_deal_activities FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Admins can view all deal activities" ON public.crm_deal_activities FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_crm_deals_user_id ON public.crm_deals(user_id);
CREATE INDEX idx_crm_deals_stage ON public.crm_deals(stage);
CREATE INDEX idx_crm_deals_expected_close ON public.crm_deals(expected_close_date);
CREATE INDEX idx_crm_deal_activities_deal_id ON public.crm_deal_activities(deal_id);

-- Auto-update timestamp trigger
CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON public.crm_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
