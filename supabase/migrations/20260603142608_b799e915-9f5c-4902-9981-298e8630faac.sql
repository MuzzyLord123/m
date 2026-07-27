ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS enquiry_id uuid REFERENCES public.enquiries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS enquiry_data jsonb;

CREATE INDEX IF NOT EXISTS idx_leads_enquiry_id ON public.leads(enquiry_id);