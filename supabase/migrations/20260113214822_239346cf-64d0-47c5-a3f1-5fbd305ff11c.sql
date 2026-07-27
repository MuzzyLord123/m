-- Drop old policies and create properly validated ones
DROP POLICY IF EXISTS "Authenticated users can view enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;

-- Recreate with proper validation if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin users can view enquiries' AND tablename = 'enquiries') THEN
    CREATE POLICY "Admin users can view enquiries"
    ON public.enquiries FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin users can delete enquiries' AND tablename = 'enquiries') THEN
    CREATE POLICY "Admin users can delete enquiries"
    ON public.enquiries FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Create enhanced insert policy with validation
CREATE POLICY "Public can submit enquiries with validation"
ON public.enquiries FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL AND email IS NOT NULL AND
  length(name) > 0 AND length(name) <= 100 AND
  length(email) > 0 AND length(email) <= 255 AND
  email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  (project_details IS NULL OR length(project_details) <= 5000) AND
  (phone IS NULL OR length(phone) <= 20) AND
  (company IS NULL OR length(company) <= 200) AND
  (interest IS NULL OR length(interest) <= 100) AND
  (page_count IS NULL OR length(page_count) <= 50) AND
  (budget IS NULL OR length(budget) <= 100)
);