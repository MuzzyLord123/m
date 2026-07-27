
-- Allow authenticated users to manage leads assigned to them or unassigned
CREATE POLICY "Users can view their assigned leads"
ON public.leads FOR SELECT TO authenticated
USING (assigned_to = auth.uid() OR assigned_to IS NULL OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their assigned leads"
ON public.leads FOR UPDATE TO authenticated
USING (assigned_to = auth.uid() OR assigned_to IS NULL OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their assigned leads"
ON public.leads FOR DELETE TO authenticated
USING (assigned_to = auth.uid() OR assigned_to IS NULL OR has_role(auth.uid(), 'admin'::app_role));

-- lead_notes policies for users
CREATE POLICY "Users can view notes for accessible leads"
ON public.lead_notes FOR SELECT TO authenticated
USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert notes"
ON public.lead_notes FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own notes"
ON public.lead_notes FOR UPDATE TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Users can delete own notes"
ON public.lead_notes FOR DELETE TO authenticated
USING (author_id = auth.uid());

-- lead_status_history policies for users
CREATE POLICY "Users can view status history"
ON public.lead_status_history FOR SELECT TO authenticated
USING (changed_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert status history"
ON public.lead_status_history FOR INSERT TO authenticated
WITH CHECK (changed_by = auth.uid());
