-- Fix update_updated_at function search path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Authenticated users can update enquiries" ON public.enquiries;

-- Create proper enquiry insert policy (anyone can submit from the website)
CREATE POLICY "Public can submit enquiries"
ON public.enquiries FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL AND 
  email IS NOT NULL AND
  length(name) > 0 AND 
  length(email) > 0
);

-- Only authenticated users can update enquiries
CREATE POLICY "Authenticated users can update enquiries"
ON public.enquiries FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);