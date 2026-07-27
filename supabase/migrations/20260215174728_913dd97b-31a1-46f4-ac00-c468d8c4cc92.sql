
-- Fix overly permissive admin policy by splitting into specific operations
DROP POLICY IF EXISTS "Admins can manage all deals" ON public.crm_deals;
CREATE POLICY "Admins can update all deals" ON public.crm_deals FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete all deals" ON public.crm_deals FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert deals" ON public.crm_deals FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
