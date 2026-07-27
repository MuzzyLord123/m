-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Public can submit enquiries with validation" ON public.enquiries;

-- Create a new more permissive INSERT policy that allows all form data
CREATE POLICY "Anyone can submit enquiries"
ON public.enquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL 
  AND email IS NOT NULL 
  AND length(name) > 0 
  AND length(name) <= 200
  AND length(email) > 0 
  AND length(email) <= 255
  AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);