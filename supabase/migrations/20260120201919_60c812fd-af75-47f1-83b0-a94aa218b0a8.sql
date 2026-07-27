-- Create lead status enum type
CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'engaged',
  'live_preview_wanted',
  'converted',
  'lost',
  'do_not_contact'
);

-- Create lead source enum type
CREATE TYPE lead_source AS ENUM (
  'google_maps',
  'manual',
  'csv_import',
  'html_import'
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT,
  personal_name TEXT,
  contact_name TEXT,
  is_personal BOOLEAN DEFAULT false,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  location_city TEXT,
  location_postcode TEXT,
  google_rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  category TEXT,
  source lead_source DEFAULT 'manual',
  status lead_status DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id),
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  tags JSONB DEFAULT '[]'::jsonb,
  converted_client_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_notes table
CREATE TABLE public.lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_status_history table
CREATE TABLE public.lead_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  old_status lead_status,
  new_status lead_status NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_imports table
CREATE TABLE public.lead_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imported_by UUID NOT NULL REFERENCES auth.users(id),
  source_type lead_source NOT NULL,
  total_count INTEGER DEFAULT 0,
  added_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  import_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads table (admin only)
CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lead_notes table (admin only)
CREATE POLICY "Admins can view all lead notes"
  ON public.lead_notes FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert lead notes"
  ON public.lead_notes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lead notes"
  ON public.lead_notes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete lead notes"
  ON public.lead_notes FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lead_status_history table (admin only)
CREATE POLICY "Admins can view lead status history"
  ON public.lead_status_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert lead status history"
  ON public.lead_status_history FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lead_imports table (admin only)
CREATE POLICY "Admins can view lead imports"
  ON public.lead_imports FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert lead imports"
  ON public.lead_imports FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_phone ON public.leads(phone);
CREATE INDEX idx_leads_business_name ON public.leads(business_name);
CREATE INDEX idx_leads_location_city ON public.leads(location_city);
CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX idx_lead_status_history_lead_id ON public.lead_status_history(lead_id);

-- Create trigger for updated_at on leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create trigger for updated_at on lead_notes
CREATE TRIGGER update_lead_notes_updated_at
  BEFORE UPDATE ON public.lead_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();