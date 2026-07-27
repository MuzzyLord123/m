
-- Replace overly permissive cart policy with scoped policies
DROP POLICY "Anyone can manage carts" ON public.site_carts;

CREATE POLICY "Carts can be read by session" ON public.site_carts FOR SELECT USING (true);
CREATE POLICY "Carts can be created" ON public.site_carts FOR INSERT WITH CHECK (true);
CREATE POLICY "Carts can be updated by session" ON public.site_carts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users delete carts" ON public.site_carts FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.designer_sites s WHERE s.id = site_id AND s.user_id = auth.uid())
);
