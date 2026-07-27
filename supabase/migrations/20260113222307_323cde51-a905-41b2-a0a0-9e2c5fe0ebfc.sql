-- Add columns to store individual form fields instead of just project_details
ALTER TABLE public.enquiries 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS business_type text,
ADD COLUMN IF NOT EXISTS business_address text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS employee_count text,
ADD COLUMN IF NOT EXISTS years_in_business text,
ADD COLUMN IF NOT EXISTS selected_package text,
ADD COLUMN IF NOT EXISTS timeline text,
ADD COLUMN IF NOT EXISTS has_existing_site text,
ADD COLUMN IF NOT EXISTS primary_goal text,
ADD COLUMN IF NOT EXISTS must_have_features text[],
ADD COLUMN IF NOT EXISTS competitors text,
ADD COLUMN IF NOT EXISTS brand_colors text,
ADD COLUMN IF NOT EXISTS inspiration_sites text,
ADD COLUMN IF NOT EXISTS how_did_you_hear text,
ADD COLUMN IF NOT EXISTS social_media text,
ADD COLUMN IF NOT EXISTS additional_notes text,
ADD COLUMN IF NOT EXISTS resume_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS form_step integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false;

-- Create index for resume token lookups
CREATE INDEX IF NOT EXISTS idx_enquiries_resume_token ON public.enquiries(resume_token);

-- Update RLS policy for draft enquiries to allow resume with token
CREATE POLICY "Public can resume drafts with token" 
ON public.enquiries 
FOR SELECT 
USING (is_draft = true AND resume_token IS NOT NULL);

CREATE POLICY "Public can update drafts with token" 
ON public.enquiries 
FOR UPDATE 
USING (is_draft = true AND resume_token IS NOT NULL)
WITH CHECK (is_draft = true);