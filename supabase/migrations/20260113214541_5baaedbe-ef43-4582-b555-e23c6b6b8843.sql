-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Authenticated users can update enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;

-- Admin-only SELECT policy
CREATE POLICY "Admin users can view enquiries"
ON public.enquiries FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin-only UPDATE policy
CREATE POLICY "Admin users can update enquiries"
ON public.enquiries FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin-only DELETE policy
CREATE POLICY "Admin users can delete enquiries"
ON public.enquiries FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Enhanced public INSERT policy with validation
CREATE POLICY "Public can submit enquiries"
ON public.enquiries FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL AND 
  email IS NOT NULL AND
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