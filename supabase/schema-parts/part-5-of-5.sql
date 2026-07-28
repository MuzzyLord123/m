SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;
--
-- Name: sticky_walls Users can view own sticky walls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sticky walls" ON public.sticky_walls FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: planner_tasks Users can view own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own tasks" ON public.planner_tasks FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (assigned_to = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR ((team_id IS NOT NULL) AND public.is_team_member(team_id))));
--
-- Name: vault_configs Users can view own vault config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own vault config" ON public.vault_configs FOR SELECT USING (public.is_owner(user_id));
--
-- Name: vault_items Users can view own vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own vault items" ON public.vault_items FOR SELECT USING (public.is_owner(user_id));
--
-- Name: rbac_permissions Users can view permissions for their roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view permissions for their roles" ON public.rbac_permissions FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid()) OR public.can_view_rbac_role(auth.uid(), role_id)));
--
-- Name: profiles Users can view profiles of channel co-members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view profiles of channel co-members" ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.comm_channel_members ccm1
     JOIN public.comm_channel_members ccm2 ON ((ccm1.channel_id = ccm2.channel_id)))
  WHERE ((ccm1.user_id = auth.uid()) AND (ccm2.user_id = profiles.user_id)))));
--
-- Name: comm_channels Users can view public channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view public channels" ON public.comm_channels FOR SELECT USING (((channel_type = ANY (ARRAY['public'::text, 'announcement'::text])) OR (id IN ( SELECT comm_channel_members.channel_id
   FROM public.comm_channel_members
  WHERE (comm_channel_members.user_id = auth.uid()))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: rbac_user_roles Users can view role assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view role assignments" ON public.rbac_user_roles FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid())));
--
-- Name: lead_status_history Users can view status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view status history" ON public.lead_status_history FOR SELECT TO authenticated USING (((changed_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: leads Users can view their assigned leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their assigned leads" ON public.leads FOR SELECT TO authenticated USING (((assigned_to = auth.uid()) OR (assigned_to IS NULL) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: ad_campaigns Users can view their own ad campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own ad campaigns" ON public.ad_campaigns FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: app_projects Users can view their own app projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own app projects" ON public.app_projects FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: call_sessions Users can view their own calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own calls" ON public.call_sessions FOR SELECT USING (((auth.uid() = caller_id) OR (auth.uid() = callee_id)));
--
-- Name: inv_companies Users can view their own companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own companies" ON public.inv_companies FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: content_requests Users can view their own content requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own content requests" ON public.content_requests FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: ai_conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.ai_conversations FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: designer_pages Users can view their own pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own pages" ON public.designer_pages FOR SELECT USING (public.is_owner(user_id));
--
-- Name: rbac_user_roles Users can view their own role assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own role assignments" ON public.rbac_user_roles FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (user_id = auth.uid()) OR (assigned_by = auth.uid())));
--
-- Name: designer_sites Users can view their own sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sites" ON public.designer_sites FOR SELECT USING (public.is_owner(user_id));
--
-- Name: social_media_accounts Users can view their own social media accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own social media accounts" ON public.social_media_accounts FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: social_media_posts Users can view their own social media posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own social media posts" ON public.social_media_posts FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: support_tickets Users can view their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: customer_uploads Users can view their own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own uploads" ON public.customer_uploads FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: workflows Users can view their own workflows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own workflows" ON public.workflows FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_activity_log Users insert own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own activity" ON public.user_activity_log FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: dashboard_metrics_cache Users insert own metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own metrics" ON public.dashboard_metrics_cache FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: inv_stock_count_items Users manage count items for own counts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage count items for own counts" ON public.inv_stock_count_items USING ((EXISTS ( SELECT 1
   FROM public.inv_stock_counts c
  WHERE ((c.id = inv_stock_count_items.count_id) AND (c.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.inv_stock_counts c
  WHERE ((c.id = inv_stock_count_items.count_id) AND (c.user_id = auth.uid())))));
--
-- Name: cms_collections Users manage own CMS collections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own CMS collections" ON public.cms_collections USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: cms_entries Users manage own CMS entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own CMS entries" ON public.cms_entries USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: hr_employees Users manage own HR employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own HR employees" ON public.hr_employees USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: booking_availability Users manage own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own availability" ON public.booking_availability USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: booking_blocked_dates Users manage own blocked dates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own blocked dates" ON public.booking_blocked_dates USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: booking_settings Users manage own booking settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own booking settings" ON public.booking_settings USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: bookings Users manage own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own bookings" ON public.bookings USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: site_bookings Users manage own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own bookings" ON public.site_bookings USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: calculator_history Users manage own calc history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own calc history" ON public.calculator_history USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: hr_candidates Users manage own candidates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own candidates" ON public.hr_candidates USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: inv_categories Users manage own categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own categories" ON public.inv_categories USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: product_categories Users manage own categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own categories" ON public.product_categories USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: ecommerce_settings Users manage own ecommerce settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own ecommerce settings" ON public.ecommerce_settings TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: email_accounts Users manage own email accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own email accounts" ON public.email_accounts USING (public.is_owner(user_id)) WITH CHECK (public.is_owner(user_id));
--
-- Name: email_drafts Users manage own email drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own email drafts" ON public.email_drafts USING (public.is_owner(user_id)) WITH CHECK (public.is_owner(user_id));
--
-- Name: email_messages Users manage own email messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own email messages" ON public.email_messages USING (public.is_owner(user_id)) WITH CHECK (public.is_owner(user_id));
--
-- Name: expenses Users manage own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own expenses" ON public.expenses USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: inv_locations Users manage own locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own locations" ON public.inv_locations USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: inv_stock_movements Users manage own movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own movements" ON public.inv_stock_movements USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: site_orders Users manage own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own orders" ON public.site_orders USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: office_polls Users manage own polls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own polls" ON public.office_polls USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: pomodoro_sessions Users manage own pomodoro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own pomodoro" ON public.pomodoro_sessions USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: inv_products Users manage own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own products" ON public.inv_products USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: products Users manage own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own products" ON public.products USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: hr_performance_reviews Users manage own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own reviews" ON public.hr_performance_reviews USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: booking_services Users manage own services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own services" ON public.booking_services USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: inv_settings Users manage own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own settings" ON public.inv_settings USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: site_products Users manage own site products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own site products" ON public.site_products USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: booking_staff Users manage own staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own staff" ON public.booking_staff USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: inv_stock_counts Users manage own stock counts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own stock counts" ON public.inv_stock_counts USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: time_entries Users manage own time entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own time entries" ON public.time_entries USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: hr_time_off_requests Users manage own time off; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own time off" ON public.hr_time_off_requests USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: product_variants Users manage own variants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own variants" ON public.product_variants USING ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_variants.product_id) AND (p.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_variants.product_id) AND (p.user_id = auth.uid())))));
--
-- Name: site_visitors Users manage own visitors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own visitors" ON public.site_visitors USING ((EXISTS ( SELECT 1
   FROM public.designer_sites s
  WHERE ((s.id = site_visitors.site_id) AND (s.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.designer_sites s
  WHERE ((s.id = site_visitors.site_id) AND (s.user_id = auth.uid())))));
--
-- Name: office_poll_votes Users manage own votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own votes" ON public.office_poll_votes USING ((auth.uid() = voter_id)) WITH CHECK ((auth.uid() = voter_id));
--
-- Name: wiki_pages Users manage own wiki pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own wiki pages" ON public.wiki_pages USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: inv_stock_levels Users manage stock for own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage stock for own products" ON public.inv_stock_levels USING ((EXISTS ( SELECT 1
   FROM public.inv_products p
  WHERE ((p.id = inv_stock_levels.product_id) AND (p.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.inv_products p
  WHERE ((p.id = inv_stock_levels.product_id) AND (p.user_id = auth.uid())))));
--
-- Name: greeting_messages Users read own enabled greeting; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own enabled greeting" ON public.greeting_messages FOR SELECT TO authenticated USING ((auth.uid() = user_id));
--
-- Name: dashboard_metrics_cache Users update own metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own metrics" ON public.dashboard_metrics_cache FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: user_activity_log Users view own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own activity" ON public.user_activity_log FOR SELECT USING (public.is_owner(user_id));
--
-- Name: dashboard_metrics_cache Users view own metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own metrics" ON public.dashboard_metrics_cache FOR SELECT USING (public.is_owner(user_id));
--
-- Name: acc_accountant_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_accountant_invites ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_accounting_periods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_accounting_periods ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_ap_bill_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_ap_bill_lines ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ap_bill_lines_admin_all ON public.acc_ap_bill_lines USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ap_bill_lines_org_member ON public.acc_ap_bill_lines USING ((EXISTS ( SELECT 1
   FROM public.acc_ap_bills b
  WHERE ((b.id = acc_ap_bill_lines.bill_id) AND public.acc_is_org_member(auth.uid(), b.org_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.acc_ap_bills b
  WHERE ((b.id = acc_ap_bill_lines.bill_id) AND public.acc_is_org_member(auth.uid(), b.org_id)))));
--
-- Name: acc_ap_bills; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_ap_bills ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_ap_bills acc_ap_bills_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ap_bills_admin_all ON public.acc_ap_bills USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: acc_ap_bills acc_ap_bills_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ap_bills_org_member ON public.acc_ap_bills USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
--
-- Name: acc_ap_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_ap_payments ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_ap_payments acc_ap_payments_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ap_payments_admin_all ON public.acc_ap_payments USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: acc_ap_payments acc_ap_payments_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ap_payments_org_member ON public.acc_ap_payments USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
--
-- Name: acc_ar_invoice_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_ar_invoice_lines ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ar_invoice_lines_admin_all ON public.acc_ar_invoice_lines USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ar_invoice_lines_org_member ON public.acc_ar_invoice_lines USING ((EXISTS ( SELECT 1
   FROM public.acc_ar_invoices i
  WHERE ((i.id = acc_ar_invoice_lines.invoice_id) AND public.acc_is_org_member(auth.uid(), i.org_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.acc_ar_invoices i
  WHERE ((i.id = acc_ar_invoice_lines.invoice_id) AND public.acc_is_org_member(auth.uid(), i.org_id)))));
--
-- Name: acc_ar_invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_ar_invoices ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_ar_invoices acc_ar_invoices_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ar_invoices_admin_all ON public.acc_ar_invoices USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: acc_ar_invoices acc_ar_invoices_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ar_invoices_org_member ON public.acc_ar_invoices USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
--
-- Name: acc_ar_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_ar_payments ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_ar_payments acc_ar_payments_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ar_payments_admin_all ON public.acc_ar_payments USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: acc_ar_payments acc_ar_payments_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_ar_payments_org_member ON public.acc_ar_payments USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
--
-- Name: acc_audit_log acc_audit insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_audit insert" ON public.acc_audit_log FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_audit_log acc_audit select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_audit select" ON public.acc_audit_log FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_audit_log ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_bank_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_bank_accounts ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_bank_accounts acc_bank_accounts_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_bank_accounts_admin_all ON public.acc_bank_accounts USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: acc_bank_accounts acc_bank_accounts_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_bank_accounts_org_member ON public.acc_bank_accounts USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
--
-- Name: acc_bank_reconciliations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_bank_reconciliations ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_bank_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_bank_transactions ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_bank_transactions acc_bank_txn_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_bank_txn_admin_all ON public.acc_bank_transactions USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: acc_bank_transactions acc_bank_txn_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_bank_txn_org_member ON public.acc_bank_transactions USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
--
-- Name: acc_chart_of_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_chart_of_accounts ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_chart_of_accounts acc_coa select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_coa select" ON public.acc_chart_of_accounts FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_chart_of_accounts acc_coa write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_coa write" ON public.acc_chart_of_accounts TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_customers ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_customers acc_customers_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_customers_admin_all ON public.acc_customers USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: acc_customers acc_customers_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_customers_org_member ON public.acc_customers USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
--
-- Name: acc_depreciation_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_depreciation_lines ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_depreciation_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_depreciation_runs ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_employees ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_fixed_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_fixed_assets ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_fx_rates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_fx_rates ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_accountant_invites acc_inv owner delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_inv owner delete" ON public.acc_accountant_invites FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_accountant_invites.org_id) AND (o.owner_user_id = auth.uid()))))));
--
-- Name: acc_accountant_invites acc_inv owner insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_inv owner insert" ON public.acc_accountant_invites FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_accountant_invites.org_id) AND (o.owner_user_id = auth.uid()))))));
--
-- Name: acc_accountant_invites acc_inv owner select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_inv owner select" ON public.acc_accountant_invites FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_accountant_invites.org_id) AND (o.owner_user_id = auth.uid()))))));
--
-- Name: acc_accountant_invites acc_inv owner update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_inv owner update" ON public.acc_accountant_invites FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_accountant_invites.org_id) AND (o.owner_user_id = auth.uid())))))) WITH CHECK (true);
--
-- Name: acc_journal_entries acc_je delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_je delete" ON public.acc_journal_entries FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_journal_entries acc_je insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_je insert" ON public.acc_journal_entries FOR INSERT TO authenticated WITH CHECK (((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)) AND (created_by = auth.uid())));
--
-- Name: acc_journal_entries acc_je select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_je select" ON public.acc_journal_entries FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_journal_entries acc_je update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_je update" ON public.acc_journal_entries FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_journal_lines acc_jl select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_jl select" ON public.acc_journal_lines FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.acc_journal_entries je
  WHERE ((je.id = acc_journal_lines.journal_entry_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), je.org_id))))));
--
-- Name: acc_journal_lines acc_jl write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_jl write" ON public.acc_journal_lines TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.acc_journal_entries je
  WHERE ((je.id = acc_journal_lines.journal_entry_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), je.org_id)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.acc_journal_entries je
  WHERE ((je.id = acc_journal_lines.journal_entry_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), je.org_id))))));
--
-- Name: acc_journal_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_journal_entries ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_journal_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_journal_lines ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_org_members acc_mem select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_mem select" ON public.acc_org_members FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_org_members.org_id) AND (o.owner_user_id = auth.uid()))))));
--
-- Name: acc_org_members acc_mem write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_mem write" ON public.acc_org_members TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_org_members.org_id) AND (o.owner_user_id = auth.uid())))))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_org_members.org_id) AND (o.owner_user_id = auth.uid()))))));
--
-- Name: acc_organizations acc_org delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_org delete" ON public.acc_organizations FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (owner_user_id = auth.uid())));
--
-- Name: acc_organizations acc_org insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_org insert" ON public.acc_organizations FOR INSERT TO authenticated WITH CHECK (((owner_user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: acc_organizations acc_org select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_org select" ON public.acc_organizations FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), id)));
--
-- Name: acc_organizations acc_org update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_org update" ON public.acc_organizations FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (owner_user_id = auth.uid()))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (owner_user_id = auth.uid())));
--
-- Name: acc_org_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_org_members ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_organizations ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_pay_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_pay_runs ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_payslips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_payslips ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_accounting_periods acc_per select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_per select" ON public.acc_accounting_periods FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_accounting_periods acc_per write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_per write" ON public.acc_accounting_periods TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_bank_reconciliations acc_recon_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_recon_admin_all ON public.acc_bank_reconciliations USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: acc_bank_reconciliations acc_recon_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_recon_org_member ON public.acc_bank_reconciliations USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
--
-- Name: acc_report_recalcs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_report_recalcs ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_suppliers ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_suppliers acc_suppliers_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_suppliers_admin_all ON public.acc_suppliers USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: acc_suppliers acc_suppliers_org_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acc_suppliers_org_member ON public.acc_suppliers USING (public.acc_is_org_member(auth.uid(), org_id)) WITH CHECK (public.acc_is_org_member(auth.uid(), org_id));
--
-- Name: acc_user_roles acc_ur select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_ur select" ON public.acc_user_roles FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (user_id = auth.uid()) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_user_roles acc_ur write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "acc_ur write" ON public.acc_user_roles TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_user_roles.org_id) AND (o.owner_user_id = auth.uid())))))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.acc_organizations o
  WHERE ((o.id = acc_user_roles.org_id) AND (o.owner_user_id = auth.uid()))))));
--
-- Name: acc_user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_user_roles ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_vat_returns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acc_vat_returns ENABLE ROW LEVEL SECURITY;
--
-- Name: account_type_presets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.account_type_presets ENABLE ROW LEVEL SECURITY;
--
-- Name: ad_campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
--
-- Name: ai_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
--
-- Name: ai_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
--
-- Name: app_projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_projects ENABLE ROW LEVEL SECURITY;
--
-- Name: asset_folders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.asset_folders ENABLE ROW LEVEL SECURITY;
--
-- Name: asset_folders asset_folders_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_folders_delete ON public.asset_folders FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: asset_folders asset_folders_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_folders_insert ON public.asset_folders FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: asset_folders asset_folders_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_folders_select ON public.asset_folders FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: asset_folders asset_folders_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_folders_update ON public.asset_folders FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: asset_tag_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.asset_tag_assignments ENABLE ROW LEVEL SECURITY;
--
-- Name: asset_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.asset_tags ENABLE ROW LEVEL SECURITY;
--
-- Name: asset_tags asset_tags_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_tags_delete ON public.asset_tags FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: asset_tags asset_tags_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_tags_insert ON public.asset_tags FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: asset_tags asset_tags_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_tags_select ON public.asset_tags FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: asset_tags asset_tags_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_tags_update ON public.asset_tags FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: automation_rule_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_rule_logs ENABLE ROW LEVEL SECURITY;
--
-- Name: automation_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
--
-- Name: automation_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
--
-- Name: automation_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_schedules ENABLE ROW LEVEL SECURITY;
--
-- Name: billing_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.billing_audit_log ENABLE ROW LEVEL SECURITY;
--
-- Name: blocked_ips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
--
-- Name: booking_availability; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_availability ENABLE ROW LEVEL SECURITY;
--
-- Name: booking_blocked_dates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_blocked_dates ENABLE ROW LEVEL SECURITY;
--
-- Name: booking_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
--
-- Name: booking_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;
--
-- Name: booking_staff; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_staff ENABLE ROW LEVEL SECURITY;
--
-- Name: booking_staff_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_staff_services ENABLE ROW LEVEL SECURITY;
--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
--
-- Name: brand_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
--
-- Name: business_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_reports ENABLE ROW LEVEL SECURITY;
--
-- Name: cad_autosaves; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cad_autosaves ENABLE ROW LEVEL SECURITY;
--
-- Name: cad_project_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cad_project_versions ENABLE ROW LEVEL SECURITY;
--
-- Name: cad_projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cad_projects ENABLE ROW LEVEL SECURITY;
--
-- Name: calculator_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calculator_history ENABLE ROW LEVEL SECURITY;
--
-- Name: calendar_event_exceptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_event_exceptions ENABLE ROW LEVEL SECURITY;
--
-- Name: calendar_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
--
-- Name: call_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
--
-- Name: client_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_assets ENABLE ROW LEVEL SECURITY;
--
-- Name: client_assets client_assets_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_assets_delete ON public.client_assets FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: client_assets client_assets_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_assets_insert ON public.client_assets FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: client_assets client_assets_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_assets_select ON public.client_assets FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: client_assets client_assets_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_assets_update ON public.client_assets FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: client_billing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_billing ENABLE ROW LEVEL SECURITY;
--
-- Name: client_contracts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_contracts ENABLE ROW LEVEL SECURITY;
--
-- Name: client_invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;
--
-- Name: client_onboarding; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;
--
-- Name: client_pricing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_pricing ENABLE ROW LEVEL SECURITY;
--
-- Name: client_teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_teams ENABLE ROW LEVEL SECURITY;
--
-- Name: cms_collections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_collections ENABLE ROW LEVEL SECURITY;
--
-- Name: cms_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_entries ENABLE ROW LEVEL SECURITY;
--
-- Name: comm_channel_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_channel_members ENABLE ROW LEVEL SECURITY;
--
-- Name: comm_channels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_channels ENABLE ROW LEVEL SECURITY;
--
-- Name: comm_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_messages ENABLE ROW LEVEL SECURITY;
--
-- Name: comm_presence; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_presence ENABLE ROW LEVEL SECURITY;
--
-- Name: comm_reactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_reactions ENABLE ROW LEVEL SECURITY;
--
-- Name: comm_read_receipts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_read_receipts ENABLE ROW LEVEL SECURITY;
--
-- Name: comm_user_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comm_user_settings ENABLE ROW LEVEL SECURITY;
--
-- Name: content_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_requests ENABLE ROW LEVEL SECURITY;
--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_activity_participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_activity_participants ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_communication_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_communication_attachments ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_communications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_communications ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_deal_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_deal_activities ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_deals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_financial_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_financial_links ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_financial_links crm_financial_links org access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "crm_financial_links org access" ON public.crm_financial_links TO authenticated USING ((org_id = public.get_primary_admin_id())) WITH CHECK ((org_id = public.get_primary_admin_id()));
--
-- Name: crm_lifecycle_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_lifecycle_history ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_lifecycle_stages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_lifecycle_stages ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_opportunities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_workflow_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_workflow_runs ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_workflow_runs crm_workflow_runs org insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "crm_workflow_runs org insert" ON public.crm_workflow_runs FOR INSERT TO authenticated WITH CHECK ((org_id = public.get_primary_admin_id()));
--
-- Name: crm_workflow_runs crm_workflow_runs org read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "crm_workflow_runs org read" ON public.crm_workflow_runs FOR SELECT TO authenticated USING ((org_id = public.get_primary_admin_id()));
--
-- Name: crm_workflows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_workflows ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_workflows crm_workflows org access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "crm_workflows org access" ON public.crm_workflows TO authenticated USING ((org_id = public.get_primary_admin_id())) WITH CHECK ((org_id = public.get_primary_admin_id()));
--
-- Name: customer_uploads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_uploads ENABLE ROW LEVEL SECURITY;
--
-- Name: dashboard_metrics_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dashboard_metrics_cache ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_depreciation_lines depr lines manageable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "depr lines manageable" ON public.acc_depreciation_lines TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_depreciation_lines depr lines viewable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "depr lines viewable" ON public.acc_depreciation_lines FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_depreciation_runs depr runs manageable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "depr runs manageable" ON public.acc_depreciation_runs TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_depreciation_runs depr runs viewable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "depr runs viewable" ON public.acc_depreciation_runs FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: designer_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.designer_assets ENABLE ROW LEVEL SECURITY;
--
-- Name: designer_components; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.designer_components ENABLE ROW LEVEL SECURITY;
--
-- Name: designer_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.designer_pages ENABLE ROW LEVEL SECURITY;
--
-- Name: designer_sites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.designer_sites ENABLE ROW LEVEL SECURITY;
--
-- Name: document_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;
--
-- Name: document_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
--
-- Name: ecommerce_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;
--
-- Name: ecommerce_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ecommerce_settings ENABLE ROW LEVEL SECURITY;
--
-- Name: email_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
--
-- Name: email_drafts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;
--
-- Name: email_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_employees employees manageable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "employees manageable by org members" ON public.acc_employees TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_employees employees viewable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "employees viewable by org members" ON public.acc_employees FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: enquiries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_fixed_assets fa manageable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "fa manageable by org members" ON public.acc_fixed_assets TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_fixed_assets fa viewable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "fa viewable by org members" ON public.acc_fixed_assets FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_fx_rates fx_rates_org_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fx_rates_org_read ON public.acc_fx_rates FOR SELECT TO authenticated USING ((org_id IN ( SELECT acc_organizations.id
   FROM public.acc_organizations
  WHERE (acc_organizations.owner_user_id = auth.uid())
UNION
 SELECT acc_org_members.org_id
   FROM public.acc_org_members
  WHERE (acc_org_members.user_id = auth.uid()))));
--
-- Name: acc_fx_rates fx_rates_org_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fx_rates_org_write ON public.acc_fx_rates TO authenticated USING ((org_id IN ( SELECT acc_organizations.id
   FROM public.acc_organizations
  WHERE (acc_organizations.owner_user_id = auth.uid())
UNION
 SELECT acc_org_members.org_id
   FROM public.acc_org_members
  WHERE (acc_org_members.user_id = auth.uid())))) WITH CHECK ((org_id IN ( SELECT acc_organizations.id
   FROM public.acc_organizations
  WHERE (acc_organizations.owner_user_id = auth.uid())
UNION
 SELECT acc_org_members.org_id
   FROM public.acc_org_members
  WHERE (acc_org_members.user_id = auth.uid()))));
--
-- Name: greeting_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.greeting_messages ENABLE ROW LEVEL SECURITY;
--
-- Name: hr_candidates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;
--
-- Name: hr_employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
--
-- Name: hr_performance_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hr_performance_reviews ENABLE ROW LEVEL SECURITY;
--
-- Name: hr_time_off_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hr_time_off_requests ENABLE ROW LEVEL SECURITY;
--
-- Name: inv_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_categories ENABLE ROW LEVEL SECURITY;
--
-- Name: inv_companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_companies ENABLE ROW LEVEL SECURITY;
--
-- Name: inv_locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_locations ENABLE ROW LEVEL SECURITY;
--
-- Name: inv_products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_products ENABLE ROW LEVEL SECURITY;
--
-- Name: inv_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_settings ENABLE ROW LEVEL SECURITY;
--
-- Name: inv_stock_count_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_stock_count_items ENABLE ROW LEVEL SECURITY;
--
-- Name: inv_stock_counts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_stock_counts ENABLE ROW LEVEL SECURITY;
--
-- Name: inv_stock_levels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_stock_levels ENABLE ROW LEVEL SECURITY;
--
-- Name: inv_stock_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inv_stock_movements ENABLE ROW LEVEL SECURITY;
--
-- Name: knowledge_base; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
--
-- Name: kpi_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpi_goals ENABLE ROW LEVEL SECURITY;
--
-- Name: lead_imports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_imports ENABLE ROW LEVEL SECURITY;
--
-- Name: lead_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
--
-- Name: lead_status_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;
--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
--
-- Name: marketing_page_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketing_page_views ENABLE ROW LEVEL SECURITY;
--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
--
-- Name: notification_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
--
-- Name: office_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.office_documents ENABLE ROW LEVEL SECURITY;
--
-- Name: office_poll_options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.office_poll_options ENABLE ROW LEVEL SECURITY;
--
-- Name: office_poll_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.office_poll_votes ENABLE ROW LEVEL SECURITY;
--
-- Name: office_polls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.office_polls ENABLE ROW LEVEL SECURITY;
--
-- Name: crm_lifecycle_history org members insert lifecycle_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members insert lifecycle_history" ON public.crm_lifecycle_history FOR INSERT WITH CHECK (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: crm_activity_participants org members manage activity_participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage activity_participants" ON public.crm_activity_participants USING ((EXISTS ( SELECT 1
   FROM public.crm_communications c
  WHERE ((c.id = crm_activity_participants.communication_id) AND ((c.org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.crm_communications c
  WHERE ((c.id = crm_activity_participants.communication_id) AND ((c.org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))))));
--
-- Name: crm_communication_attachments org members manage crm_comm_attachments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage crm_comm_attachments" ON public.crm_communication_attachments USING ((EXISTS ( SELECT 1
   FROM public.crm_communications c
  WHERE ((c.id = crm_communication_attachments.communication_id) AND ((c.org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.crm_communications c
  WHERE ((c.id = crm_communication_attachments.communication_id) AND ((c.org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))))));
--
-- Name: crm_communications org members manage crm_communications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage crm_communications" ON public.crm_communications USING (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: crm_companies org members manage crm_companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage crm_companies" ON public.crm_companies USING (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: crm_contacts org members manage crm_contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage crm_contacts" ON public.crm_contacts USING (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: crm_opportunities org members manage crm_opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage crm_opportunities" ON public.crm_opportunities USING (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: crm_lifecycle_stages org members manage lifecycle_stages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members manage lifecycle_stages" ON public.crm_lifecycle_stages USING (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: crm_lifecycle_history org members view lifecycle_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members view lifecycle_history" ON public.crm_lifecycle_history FOR SELECT USING (((org_id = public.get_primary_admin_id()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: password_vault_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.password_vault_configs ENABLE ROW LEVEL SECURITY;
--
-- Name: password_vault_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.password_vault_items ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_pay_runs pay runs manageable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "pay runs manageable by org members" ON public.acc_pay_runs TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_pay_runs pay runs viewable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "pay runs viewable by org members" ON public.acc_pay_runs FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_payslips payslips manageable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "payslips manageable by org members" ON public.acc_payslips TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_payslips payslips viewable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "payslips viewable by org members" ON public.acc_payslips FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: planner_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;
--
-- Name: platform_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.platform_files ENABLE ROW LEVEL SECURITY;
--
-- Name: platform_folders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.platform_folders ENABLE ROW LEVEL SECURITY;
--
-- Name: poll_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
--
-- Name: pomodoro_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
--
-- Name: product_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
--
-- Name: product_variants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
--
-- Name: proposals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
--
-- Name: rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
--
-- Name: rbac_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rbac_audit_log ENABLE ROW LEVEL SECURITY;
--
-- Name: rbac_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rbac_permissions ENABLE ROW LEVEL SECURITY;
--
-- Name: rbac_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rbac_roles ENABLE ROW LEVEL SECURITY;
--
-- Name: rbac_user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rbac_user_roles ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_report_recalcs recalcs insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "recalcs insert" ON public.acc_report_recalcs FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_report_recalcs recalcs select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "recalcs select" ON public.acc_report_recalcs FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: resource_allocations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.resource_allocations ENABLE ROW LEVEL SECURITY;
--
-- Name: security_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
--
-- Name: site_bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_bookings ENABLE ROW LEVEL SECURITY;
--
-- Name: site_carts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_carts ENABLE ROW LEVEL SECURITY;
--
-- Name: site_content; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
--
-- Name: site_deployments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_deployments ENABLE ROW LEVEL SECURITY;
--
-- Name: site_domains; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_domains ENABLE ROW LEVEL SECURITY;
--
-- Name: site_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_orders ENABLE ROW LEVEL SECURITY;
--
-- Name: site_products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_products ENABLE ROW LEVEL SECURITY;
--
-- Name: site_visitors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;
--
-- Name: social_media_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
--
-- Name: social_media_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
--
-- Name: sticky_walls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sticky_walls ENABLE ROW LEVEL SECURITY;
--
-- Name: storage_quotas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.storage_quotas ENABLE ROW LEVEL SECURITY;
--
-- Name: storage_quotas storage_quotas_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY storage_quotas_select ON public.storage_quotas FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: subscription_site_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_site_events ENABLE ROW LEVEL SECURITY;
--
-- Name: subscription_sites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_sites ENABLE ROW LEVEL SECURITY;
--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
--
-- Name: asset_tag_assignments tag_assignments_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tag_assignments_delete ON public.asset_tag_assignments FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.client_assets
  WHERE ((client_assets.id = asset_tag_assignments.asset_id) AND (client_assets.user_id = auth.uid())))));
--
-- Name: asset_tag_assignments tag_assignments_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tag_assignments_insert ON public.asset_tag_assignments FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.client_assets
  WHERE ((client_assets.id = asset_tag_assignments.asset_id) AND (client_assets.user_id = auth.uid())))));
--
-- Name: asset_tag_assignments tag_assignments_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tag_assignments_select ON public.asset_tag_assignments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.client_assets
  WHERE ((client_assets.id = asset_tag_assignments.asset_id) AND (client_assets.user_id = auth.uid())))));
--
-- Name: team_branding; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_branding ENABLE ROW LEVEL SECURITY;
--
-- Name: team_inbox_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_inbox_settings ENABLE ROW LEVEL SECURITY;
--
-- Name: team_memberships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
--
-- Name: time_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
--
-- Name: two_factor_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.two_factor_attempts ENABLE ROW LEVEL SECURITY;
--
-- Name: user_activity_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
--
-- Name: user_branding; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_branding ENABLE ROW LEVEL SECURITY;
--
-- Name: user_calendars; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_calendars ENABLE ROW LEVEL SECURITY;
--
-- Name: user_connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
--
-- Name: user_onboarding; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
--
-- Name: user_sidebar_layout; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_sidebar_layout ENABLE ROW LEVEL SECURITY;
--
-- Name: acc_vat_returns vat returns manageable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "vat returns manageable by org members" ON public.acc_vat_returns TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: acc_vat_returns vat returns viewable by org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "vat returns viewable by org members" ON public.acc_vat_returns FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.acc_is_org_member(auth.uid(), org_id)));
--
-- Name: vault_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vault_configs ENABLE ROW LEVEL SECURITY;
--
-- Name: vault_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;
--
-- Name: whitelisted_ips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.whitelisted_ips ENABLE ROW LEVEL SECURITY;
--
-- Name: wiki_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;
--
-- Name: workflow_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
--
-- Name: workflows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
--
-- Name: FUNCTION acc_seed_default_coa(_org_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.acc_seed_default_coa(_org_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.acc_seed_default_coa(_org_id uuid) TO service_role;
--
-- Name: FUNCTION crm_entity_financials(_entity_type text, _entity_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.crm_entity_financials(_entity_type text, _entity_id uuid) TO authenticated;
--
-- Name: FUNCTION crm_entity_lifetime_value(_entity_type text, _entity_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.crm_entity_lifetime_value(_entity_type text, _entity_id uuid) TO authenticated;
--
-- Name: FUNCTION crm_execute_workflow_actions(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.crm_execute_workflow_actions(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.crm_execute_workflow_actions(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb) TO authenticated;
--
-- Name: FUNCTION crm_log_communication(_kind text, _direction text, _subject text, _body text, _company_id uuid, _contact_id uuid, _opportunity_id uuid, _occurred_at timestamp with time zone, _from_address text, _to_addresses text[], _metadata jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.crm_log_communication(_kind text, _direction text, _subject text, _body text, _company_id uuid, _contact_id uuid, _opportunity_id uuid, _occurred_at timestamp with time zone, _from_address text, _to_addresses text[], _metadata jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.crm_log_communication(_kind text, _direction text, _subject text, _body text, _company_id uuid, _contact_id uuid, _opportunity_id uuid, _occurred_at timestamp with time zone, _from_address text, _to_addresses text[], _metadata jsonb) TO authenticated;
--
-- Name: FUNCTION crm_run_workflow(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.crm_run_workflow(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.crm_run_workflow(_workflow_id uuid, _entity_type text, _entity_id uuid, _payload jsonb) TO authenticated;
--
-- Name: FUNCTION crm_timeline(_entity_type text, _entity_id uuid, _limit integer, _before timestamp with time zone); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.crm_timeline(_entity_type text, _entity_id uuid, _limit integer, _before timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION public.crm_timeline(_entity_type text, _entity_id uuid, _limit integer, _before timestamp with time zone) TO authenticated;
--
-- Name: TABLE acc_accountant_invites; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_accountant_invites TO authenticated;
GRANT ALL ON TABLE public.acc_accountant_invites TO service_role;
GRANT SELECT ON TABLE public.acc_accountant_invites TO anon;
--
-- Name: TABLE acc_accounting_periods; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_accounting_periods TO authenticated;
GRANT ALL ON TABLE public.acc_accounting_periods TO service_role;
--
-- Name: TABLE acc_ap_bills; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_ap_bills TO authenticated;
GRANT ALL ON TABLE public.acc_ap_bills TO service_role;
--
-- Name: TABLE acc_suppliers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_suppliers TO authenticated;
GRANT ALL ON TABLE public.acc_suppliers TO service_role;
--
-- Name: TABLE acc_ap_aging; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.acc_ap_aging TO authenticated;
--
-- Name: TABLE acc_ap_bill_lines; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_ap_bill_lines TO authenticated;
GRANT ALL ON TABLE public.acc_ap_bill_lines TO service_role;
--
-- Name: TABLE acc_ap_payments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_ap_payments TO authenticated;
GRANT ALL ON TABLE public.acc_ap_payments TO service_role;
--
-- Name: TABLE acc_ar_invoices; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_ar_invoices TO authenticated;
GRANT ALL ON TABLE public.acc_ar_invoices TO service_role;
--
-- Name: TABLE acc_customers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_customers TO authenticated;
GRANT ALL ON TABLE public.acc_customers TO service_role;
--
-- Name: TABLE acc_ar_aging; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.acc_ar_aging TO authenticated;
--
-- Name: TABLE acc_ar_invoice_lines; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_ar_invoice_lines TO authenticated;
GRANT ALL ON TABLE public.acc_ar_invoice_lines TO service_role;
--
-- Name: TABLE acc_ar_payments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_ar_payments TO authenticated;
GRANT ALL ON TABLE public.acc_ar_payments TO service_role;
--
-- Name: TABLE acc_audit_log; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.acc_audit_log TO authenticated;
GRANT ALL ON TABLE public.acc_audit_log TO service_role;
--
-- Name: TABLE acc_bank_accounts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_bank_accounts TO authenticated;
GRANT ALL ON TABLE public.acc_bank_accounts TO service_role;
--
-- Name: TABLE acc_bank_reconciliations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_bank_reconciliations TO authenticated;
GRANT ALL ON TABLE public.acc_bank_reconciliations TO service_role;
--
-- Name: TABLE acc_bank_transactions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_bank_transactions TO authenticated;
GRANT ALL ON TABLE public.acc_bank_transactions TO service_role;
--
-- Name: TABLE acc_chart_of_accounts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_chart_of_accounts TO authenticated;
GRANT ALL ON TABLE public.acc_chart_of_accounts TO service_role;
--
-- Name: TABLE acc_depreciation_lines; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_depreciation_lines TO authenticated;
GRANT ALL ON TABLE public.acc_depreciation_lines TO service_role;
--
-- Name: TABLE acc_depreciation_runs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_depreciation_runs TO authenticated;
GRANT ALL ON TABLE public.acc_depreciation_runs TO service_role;
--
-- Name: TABLE acc_employees; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_employees TO authenticated;
GRANT ALL ON TABLE public.acc_employees TO service_role;
--
-- Name: TABLE acc_fixed_assets; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_fixed_assets TO authenticated;
GRANT ALL ON TABLE public.acc_fixed_assets TO service_role;
--
-- Name: TABLE acc_fx_rates; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_fx_rates TO authenticated;
GRANT ALL ON TABLE public.acc_fx_rates TO service_role;
--
-- Name: TABLE acc_journal_entries; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_journal_entries TO authenticated;
GRANT ALL ON TABLE public.acc_journal_entries TO service_role;
--
-- Name: TABLE acc_journal_lines; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_journal_lines TO authenticated;
GRANT ALL ON TABLE public.acc_journal_lines TO service_role;
--
-- Name: TABLE acc_org_members; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_org_members TO authenticated;
GRANT ALL ON TABLE public.acc_org_members TO service_role;
--
-- Name: TABLE acc_organizations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_organizations TO authenticated;
GRANT ALL ON TABLE public.acc_organizations TO service_role;
--
-- Name: TABLE acc_pay_runs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_pay_runs TO authenticated;
GRANT ALL ON TABLE public.acc_pay_runs TO service_role;
--
-- Name: TABLE acc_payslips; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_payslips TO authenticated;
GRANT ALL ON TABLE public.acc_payslips TO service_role;
--
-- Name: TABLE acc_report_recalcs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.acc_report_recalcs TO authenticated;
GRANT ALL ON TABLE public.acc_report_recalcs TO service_role;
--
-- Name: TABLE acc_trial_balance; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.acc_trial_balance TO authenticated;
GRANT SELECT ON TABLE public.acc_trial_balance TO service_role;
--
-- Name: TABLE acc_user_roles; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_user_roles TO authenticated;
GRANT ALL ON TABLE public.acc_user_roles TO service_role;
--
-- Name: TABLE acc_vat_returns; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.acc_vat_returns TO authenticated;
GRANT ALL ON TABLE public.acc_vat_returns TO service_role;
--
-- Name: TABLE account_type_presets; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.account_type_presets TO authenticated;
GRANT ALL ON TABLE public.account_type_presets TO service_role;
--
-- Name: TABLE crm_activity_participants; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_activity_participants TO authenticated;
GRANT ALL ON TABLE public.crm_activity_participants TO service_role;
--
-- Name: TABLE crm_communication_attachments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_communication_attachments TO authenticated;
GRANT ALL ON TABLE public.crm_communication_attachments TO service_role;
--
-- Name: TABLE crm_communications; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_communications TO authenticated;
GRANT ALL ON TABLE public.crm_communications TO service_role;
--
-- Name: TABLE crm_companies; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_companies TO authenticated;
GRANT ALL ON TABLE public.crm_companies TO service_role;
--
-- Name: TABLE crm_contacts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_contacts TO authenticated;
GRANT ALL ON TABLE public.crm_contacts TO service_role;
--
-- Name: TABLE crm_opportunities; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_opportunities TO authenticated;
GRANT ALL ON TABLE public.crm_opportunities TO service_role;
--
-- Name: TABLE crm_deals_compat; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.crm_deals_compat TO authenticated;
--
-- Name: TABLE crm_financial_links; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_financial_links TO authenticated;
GRANT ALL ON TABLE public.crm_financial_links TO service_role;
--
-- Name: TABLE crm_lifecycle_history; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.crm_lifecycle_history TO authenticated;
GRANT ALL ON TABLE public.crm_lifecycle_history TO service_role;
--
-- Name: TABLE crm_lifecycle_stages; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_lifecycle_stages TO authenticated;
GRANT ALL ON TABLE public.crm_lifecycle_stages TO service_role;
--
-- Name: TABLE crm_workflow_runs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.crm_workflow_runs TO authenticated;
GRANT ALL ON TABLE public.crm_workflow_runs TO service_role;
--
-- Name: TABLE crm_workflows; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.crm_workflows TO authenticated;
GRANT ALL ON TABLE public.crm_workflows TO service_role;
--
-- Name: TABLE ecommerce_orders; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ecommerce_orders TO authenticated;
GRANT SELECT,INSERT ON TABLE public.ecommerce_orders TO anon;
GRANT ALL ON TABLE public.ecommerce_orders TO service_role;
--
-- Name: TABLE ecommerce_settings; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ecommerce_settings TO authenticated;
GRANT ALL ON TABLE public.ecommerce_settings TO service_role;
--
-- Name: TABLE greeting_messages; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.greeting_messages TO authenticated;
GRANT ALL ON TABLE public.greeting_messages TO service_role;
--
-- Name: TABLE marketing_page_views; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT ON TABLE public.marketing_page_views TO anon;
GRANT SELECT,INSERT ON TABLE public.marketing_page_views TO authenticated;
GRANT ALL ON TABLE public.marketing_page_views TO service_role;
--
-- Name: TABLE site_content; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.site_content TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.site_content TO authenticated;
GRANT ALL ON TABLE public.site_content TO service_role;
--
-- Name: TABLE subscription_site_events; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.subscription_site_events TO authenticated;
GRANT ALL ON TABLE public.subscription_site_events TO service_role;
--
-- Name: TABLE subscription_sites; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.subscription_sites TO authenticated;
GRANT ALL ON TABLE public.subscription_sites TO service_role;
--
-- PostgreSQL database dump complete
--



-- ============================================================
-- SECURITY HARDENING (C3/C4/C5) - see docs/SECURITY-AUDIT-2026-07.md
-- ============================================================
-- Security hardening: closes the six critical database-level findings from
-- docs/SECURITY-AUDIT-2026-07.md. Safe to run against an empty or a populated
-- database, and idempotent (re-running it is a no-op). Apply this AFTER the
-- consolidated schema / dump restore, before any real data is exposed.
--
-- C1 (quooro-chat) and C2 (execute-workflow) are edge-function code fixes and
-- live in supabase/functions/, not here.

-- ---------------------------------------------------------------------------
-- C3. CRM tenant isolation was a constant: get_primary_admin_id() returns the
-- same UUID for every caller, and every CRM policy compared org_id to it, so
-- any authenticated (and in places anon) user could read/write the entire CRM.
--
-- Introduce real membership and rewrite every CRM policy to gate on it. Owners
-- (admins) keep full access; everyone else sees only orgs they belong to.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_org_members (
  org_id     uuid NOT NULL,
  user_id    uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);
ALTER TABLE public.crm_org_members ENABLE ROW LEVEL SECURITY;
-- Seed the current owner org so existing single-tenant data stays reachable.
INSERT INTO public.crm_org_members (org_id, user_id)
SELECT public.get_primary_admin_id(), public.get_primary_admin_id()
WHERE public.get_primary_admin_id() IS NOT NULL
ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION public.crm_is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_org_members m
    WHERE m.org_id = _org_id AND m.user_id = _user_id
  );
$$;
-- Admins manage membership; members can see their own rows.
DROP POLICY IF EXISTS "crm_org_members admin manage" ON public.crm_org_members;
CREATE POLICY "crm_org_members admin manage" ON public.crm_org_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "crm_org_members self read" ON public.crm_org_members;
CREATE POLICY "crm_org_members self read" ON public.crm_org_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
-- Replace every permissive CRM policy. Each table: drop the old policy names
-- seen in the migrations, then create one membership-gated FOR ALL policy
-- scoped to authenticated (never anon).
DO $$
DECLARE
  t text;
  crm_tables text[] := ARRAY[
    'crm_companies','crm_contacts','crm_opportunities','crm_communications',
    'crm_lifecycle_stages','crm_lifecycle_history','crm_financial_links',
    'crm_workflows','crm_workflow_runs'
  ];
  pol record;
BEGIN
  FOREACH t IN ARRAY crm_tables LOOP
    IF to_regclass('public.'||t) IS NULL THEN CONTINUE; END IF;

    -- Drop ALL existing policies on the table, whatever they were named.
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- anon must never reach CRM data via default table privileges.
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);

    -- One coherent tenant policy: platform admins, or members of the row's org.
    EXECUTE format($p$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (public.has_role(auth.uid(), 'admin')
               OR public.crm_is_org_member(auth.uid(), org_id))
        WITH CHECK (public.has_role(auth.uid(), 'admin')
               OR public.crm_is_org_member(auth.uid(), org_id))
    $p$, t||'_tenant_isolation', t);
  END LOOP;
END $$;
-- ---------------------------------------------------------------------------
-- C4. ecommerce_orders was world-readable: `FOR SELECT TO anon USING (true)`
-- plus GRANT SELECT to anon exposed every merchant's orders (customer email,
-- phone, shipping address, payment_intent_id) to anyone with the anon key.
--
-- Remove anon read entirely. Anonymous shoppers create an order (INSERT stays)
-- but can no longer read the table; order-status lookups must go through a
-- service-role edge function that checks a per-order token.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.ecommerce_orders') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Anyone can read a specific order" ON public.ecommerce_orders;
    REVOKE SELECT ON public.ecommerce_orders FROM anon;
    -- Keep INSERT for the anonymous-checkout flow, but the store's own key
    -- (service role / authenticated merchant) is what should read orders.
  END IF;
END $$;
-- ---------------------------------------------------------------------------
-- C5. Three SECURITY DEFINER RPCs returned the decrypted security audit trail
-- (plaintext IPs, blocked/whitelisted IP lists) to anyone, because Postgres
-- grants EXECUTE to PUBLIC by default and anon is a member of PUBLIC.
--
-- Revoke public execute; grant only to authenticated, and guard the bodies so
-- even authenticated non-admins get nothing.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regprocedure('public.get_security_logs_decrypted(integer)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.get_security_logs_decrypted(integer) FROM PUBLIC, anon;
  END IF;
  IF to_regprocedure('public.get_blocked_ips_decrypted()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.get_blocked_ips_decrypted() FROM PUBLIC, anon;
  END IF;
  IF to_regprocedure('public.get_whitelisted_ips_decrypted()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.get_whitelisted_ips_decrypted() FROM PUBLIC, anon;
  END IF;
END $$;
-- Defence in depth: an admin check inside each body, so a future accidental
-- GRANT can't re-expose them.
CREATE OR REPLACE FUNCTION public.get_security_logs_decrypted(p_limit integer DEFAULT 100)
RETURNS TABLE(id uuid, user_id uuid, event_type text, portal_attempted text, actual_role text, ip_address text, user_agent text, details jsonb, created_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT s.id, s.user_id, s.event_type, s.portal_attempted, s.actual_role,
         CASE WHEN s.ip_address LIKE 'ENC:%' THEN public.decrypt_pii(s.ip_address) ELSE s.ip_address END,
         s.user_agent, s.details::jsonb, s.created_at
  FROM public.security_logs s
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$$;
CREATE OR REPLACE FUNCTION public.get_blocked_ips_decrypted()
RETURNS TABLE(id uuid, ip_address text, blocked_by uuid, reason text, is_auto_blocked boolean, failed_attempts integer, blocked_at timestamp with time zone, expires_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT b.id,
         CASE WHEN b.ip_address LIKE 'ENC:%' THEN public.decrypt_pii(b.ip_address) ELSE b.ip_address END,
         b.blocked_by, b.reason, b.is_auto_blocked, b.failed_attempts, b.blocked_at, b.expires_at
  FROM public.blocked_ips b
  ORDER BY b.blocked_at DESC;
END;
$$;
CREATE OR REPLACE FUNCTION public.get_whitelisted_ips_decrypted()
RETURNS TABLE(id uuid, ip_address text, added_by uuid, notes text, created_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT w.id,
         CASE WHEN w.ip_address LIKE 'ENC:%' THEN public.decrypt_pii(w.ip_address) ELSE w.ip_address END,
         w.added_by, w.notes, w.created_at
  FROM public.whitelisted_ips w
  ORDER BY w.created_at DESC;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_security_logs_decrypted(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_blocked_ips_decrypted() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_whitelisted_ips_decrypted() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_security_logs_decrypted(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_blocked_ips_decrypted() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_whitelisted_ips_decrypted() TO authenticated;
-- ---------------------------------------------------------------------------
-- Follow-up to 20260727000000_security_hardening_critical.sql
--
-- Two exposures the first pass missed, both found by asserting against a
-- rebuilt database rather than trusting the migration was complete.
--
-- C3 (cont.): crm_activity_participants and crm_communication_attachments do
-- not carry org_id themselves - their policies reach through a subquery to
-- crm_communications.org_id = get_primary_admin_id(). That is the same
-- everyone-owns-everything predicate, one level of indirection down, so
-- meeting participants and communication attachments stayed readable and
-- writable by every authenticated user after the first pass.
--
-- C5 (cont.): the three get_*_decrypted wrappers were revoked, but
-- decrypt_pii itself - the primitive they wrap - was still EXECUTE-able by
-- PUBLIC, and anon is a member of PUBLIC. Anyone with the publishable key
-- could decrypt any ciphertext they could read. The SECURITY DEFINER callers
-- (check_ip_blocked, check_ip_whitelisted) run as the owner, so revoking
-- PUBLIC does not break them.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.crm_activity_participants') IS NOT NULL THEN
    DROP POLICY IF EXISTS "org members manage activity_participants" ON public.crm_activity_participants;
    EXECUTE $p$
      CREATE POLICY "crm members manage activity participants"
        ON public.crm_activity_participants FOR ALL TO authenticated
        USING (EXISTS (
          SELECT 1 FROM public.crm_communications c
          WHERE c.id = crm_activity_participants.communication_id
            AND (public.has_role(auth.uid(), 'admin'::public.app_role)
                 OR public.crm_is_org_member(auth.uid(), c.org_id))))
        WITH CHECK (EXISTS (
          SELECT 1 FROM public.crm_communications c
          WHERE c.id = crm_activity_participants.communication_id
            AND (public.has_role(auth.uid(), 'admin'::public.app_role)
                 OR public.crm_is_org_member(auth.uid(), c.org_id))))
    $p$;
    REVOKE ALL ON public.crm_activity_participants FROM anon;
  END IF;

  IF to_regclass('public.crm_communication_attachments') IS NOT NULL THEN
    DROP POLICY IF EXISTS "org members manage crm_comm_attachments" ON public.crm_communication_attachments;
    EXECUTE $p$
      CREATE POLICY "crm members manage communication attachments"
        ON public.crm_communication_attachments FOR ALL TO authenticated
        USING (EXISTS (
          SELECT 1 FROM public.crm_communications c
          WHERE c.id = crm_communication_attachments.communication_id
            AND (public.has_role(auth.uid(), 'admin'::public.app_role)
                 OR public.crm_is_org_member(auth.uid(), c.org_id))))
        WITH CHECK (EXISTS (
          SELECT 1 FROM public.crm_communications c
          WHERE c.id = crm_communication_attachments.communication_id
            AND (public.has_role(auth.uid(), 'admin'::public.app_role)
                 OR public.crm_is_org_member(auth.uid(), c.org_id))))
    $p$;
    REVOKE ALL ON public.crm_communication_attachments FROM anon;
  END IF;
END $$;
DO $$
BEGIN
  IF to_regprocedure('public.decrypt_pii(text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.decrypt_pii(text) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.decrypt_pii(text) FROM anon;
    REVOKE ALL ON FUNCTION public.decrypt_pii(text) FROM authenticated;
  END IF;
  -- encrypt_pii is write-side, but there is no reason for anon to reach it.
  IF to_regprocedure('public.encrypt_pii(text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.encrypt_pii(text) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.encrypt_pii(text) FROM anon;
  END IF;
END $$;
