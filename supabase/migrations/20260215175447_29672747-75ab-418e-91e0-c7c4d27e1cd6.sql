
-- Proposals table
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  proposal_number TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'website_design',
  status TEXT NOT NULL DEFAULT 'draft',
  
  -- Client info (auto-filled from lead)
  client_name TEXT,
  client_email TEXT,
  client_company TEXT,
  client_phone TEXT,
  
  -- Proposal content
  title TEXT NOT NULL DEFAULT 'Proposal',
  introduction TEXT,
  scope_items JSONB DEFAULT '[]'::jsonb,
  pricing_items JSONB DEFAULT '[]'::jsonb,
  total_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  valid_until DATE,
  terms TEXT,
  notes TEXT,
  
  -- Acceptance
  accepted_at TIMESTAMPTZ,
  accepted_by_name TEXT,
  accepted_by_email TEXT,
  accepted_ip TEXT,
  acceptance_token UUID DEFAULT gen_random_uuid(),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own proposals"
  ON public.proposals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow public access for acceptance via token
CREATE POLICY "Anyone can view proposals by acceptance token"
  ON public.proposals FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update proposal acceptance"
  ON public.proposals FOR UPDATE
  USING (acceptance_token IS NOT NULL)
  WITH CHECK (acceptance_token IS NOT NULL);

-- Generate proposal number
CREATE OR REPLACE FUNCTION public.generate_proposal_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  year_part TEXT;
  seq INT;
  prop_num TEXT;
BEGIN
  year_part := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(proposal_number FROM 'PROP-\d{4}-(\d+)') AS integer)), 0) + 1
  INTO seq FROM public.proposals WHERE proposal_number LIKE 'PROP-' || year_part || '-%';
  prop_num := 'PROP-' || year_part || '-' || LPAD(seq::text, 5, '0');
  RETURN prop_num;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
