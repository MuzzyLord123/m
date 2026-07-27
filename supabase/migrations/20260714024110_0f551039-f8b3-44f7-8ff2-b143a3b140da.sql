CREATE POLICY "Admins can view all subscription sites" ON public.subscription_sites FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert subscription sites" ON public.subscription_sites FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update subscription sites" ON public.subscription_sites FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete subscription sites" ON public.subscription_sites FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view subscription events" ON public.subscription_site_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'));