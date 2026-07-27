
-- Tighten the INSERT policy to require assigned_to = auth.uid()
DROP POLICY "Users can insert leads" ON public.leads;
CREATE POLICY "Users can insert leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (assigned_to = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
