-- Add status column to customer_uploads table
ALTER TABLE public.customer_uploads 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add RLS policy for admins to update customer uploads
CREATE POLICY "Admins can update customer uploads"
ON public.customer_uploads
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));