SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;
--
-- Name: comm_read_receipts comm_read_receipts_last_read_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_read_receipts
    ADD CONSTRAINT comm_read_receipts_last_read_message_id_fkey FOREIGN KEY (last_read_message_id) REFERENCES public.comm_messages(id) ON DELETE SET NULL;
--
-- Name: comm_read_receipts comm_read_receipts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_read_receipts
    ADD CONSTRAINT comm_read_receipts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: comm_user_settings comm_user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_user_settings
    ADD CONSTRAINT comm_user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: crm_activity_participants crm_activity_participants_communication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_activity_participants
    ADD CONSTRAINT crm_activity_participants_communication_id_fkey FOREIGN KEY (communication_id) REFERENCES public.crm_communications(id) ON DELETE CASCADE;
--
-- Name: crm_activity_participants crm_activity_participants_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_activity_participants
    ADD CONSTRAINT crm_activity_participants_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;
--
-- Name: crm_communication_attachments crm_communication_attachments_communication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_communication_attachments
    ADD CONSTRAINT crm_communication_attachments_communication_id_fkey FOREIGN KEY (communication_id) REFERENCES public.crm_communications(id) ON DELETE CASCADE;
--
-- Name: crm_communications crm_communications_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_communications
    ADD CONSTRAINT crm_communications_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.crm_companies(id) ON DELETE CASCADE;
--
-- Name: crm_communications crm_communications_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_communications
    ADD CONSTRAINT crm_communications_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE CASCADE;
--
-- Name: crm_communications crm_communications_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_communications
    ADD CONSTRAINT crm_communications_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.crm_opportunities(id) ON DELETE CASCADE;
--
-- Name: crm_contacts crm_contacts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contacts
    ADD CONSTRAINT crm_contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;
--
-- Name: crm_deal_activities crm_deal_activities_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_deal_activities
    ADD CONSTRAINT crm_deal_activities_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.crm_deals(id) ON DELETE CASCADE;
--
-- Name: crm_deals crm_deals_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_deals
    ADD CONSTRAINT crm_deals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
--
-- Name: crm_opportunities crm_opportunities_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_opportunities
    ADD CONSTRAINT crm_opportunities_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;
--
-- Name: crm_opportunities crm_opportunities_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_opportunities
    ADD CONSTRAINT crm_opportunities_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;
--
-- Name: crm_workflow_runs crm_workflow_runs_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_workflow_runs
    ADD CONSTRAINT crm_workflow_runs_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.crm_workflows(id) ON DELETE CASCADE;
--
-- Name: designer_assets designer_assets_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designer_assets
    ADD CONSTRAINT designer_assets_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;
--
-- Name: designer_pages designer_pages_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designer_pages
    ADD CONSTRAINT designer_pages_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;
--
-- Name: document_comments document_comments_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT document_comments_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.office_documents(id) ON DELETE CASCADE;
--
-- Name: document_comments document_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT document_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: document_versions document_versions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.office_documents(id) ON DELETE CASCADE;
--
-- Name: document_versions document_versions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: email_drafts email_drafts_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_drafts
    ADD CONSTRAINT email_drafts_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.email_accounts(id) ON DELETE SET NULL;
--
-- Name: email_messages email_messages_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.email_accounts(id) ON DELETE CASCADE;
--
-- Name: expenses expenses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: greeting_messages greeting_messages_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.greeting_messages
    ADD CONSTRAINT greeting_messages_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
--
-- Name: greeting_messages greeting_messages_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.greeting_messages
    ADD CONSTRAINT greeting_messages_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
--
-- Name: greeting_messages greeting_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.greeting_messages
    ADD CONSTRAINT greeting_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: hr_candidates hr_candidates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_candidates
    ADD CONSTRAINT hr_candidates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: hr_employees hr_employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_employees
    ADD CONSTRAINT hr_employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: hr_performance_reviews hr_performance_reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_performance_reviews
    ADD CONSTRAINT hr_performance_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.hr_employees(id) ON DELETE CASCADE;
--
-- Name: hr_performance_reviews hr_performance_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_performance_reviews
    ADD CONSTRAINT hr_performance_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: hr_time_off_requests hr_time_off_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_time_off_requests
    ADD CONSTRAINT hr_time_off_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.hr_employees(id) ON DELETE CASCADE;
--
-- Name: hr_time_off_requests hr_time_off_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_time_off_requests
    ADD CONSTRAINT hr_time_off_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: inv_products inv_products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_products
    ADD CONSTRAINT inv_products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.inv_categories(id) ON DELETE SET NULL;
--
-- Name: inv_products inv_products_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_products
    ADD CONSTRAINT inv_products_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.inv_companies(id) ON DELETE CASCADE;
--
-- Name: inv_stock_count_items inv_stock_count_items_count_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_count_items
    ADD CONSTRAINT inv_stock_count_items_count_id_fkey FOREIGN KEY (count_id) REFERENCES public.inv_stock_counts(id) ON DELETE CASCADE;
--
-- Name: inv_stock_count_items inv_stock_count_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_count_items
    ADD CONSTRAINT inv_stock_count_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inv_products(id) ON DELETE CASCADE;
--
-- Name: inv_stock_counts inv_stock_counts_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_counts
    ADD CONSTRAINT inv_stock_counts_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.inv_locations(id) ON DELETE SET NULL;
--
-- Name: inv_stock_levels inv_stock_levels_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_levels
    ADD CONSTRAINT inv_stock_levels_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.inv_locations(id) ON DELETE CASCADE;
--
-- Name: inv_stock_levels inv_stock_levels_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_levels
    ADD CONSTRAINT inv_stock_levels_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inv_products(id) ON DELETE CASCADE;
--
-- Name: inv_stock_movements inv_stock_movements_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_movements
    ADD CONSTRAINT inv_stock_movements_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.inv_locations(id) ON DELETE SET NULL;
--
-- Name: inv_stock_movements inv_stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_movements
    ADD CONSTRAINT inv_stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inv_products(id) ON DELETE CASCADE;
--
-- Name: inv_stock_movements inv_stock_movements_to_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_movements
    ADD CONSTRAINT inv_stock_movements_to_location_id_fkey FOREIGN KEY (to_location_id) REFERENCES public.inv_locations(id) ON DELETE SET NULL;
--
-- Name: lead_imports lead_imports_imported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_imports
    ADD CONSTRAINT lead_imports_imported_by_fkey FOREIGN KEY (imported_by) REFERENCES auth.users(id);
--
-- Name: lead_notes lead_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id);
--
-- Name: lead_notes lead_notes_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
--
-- Name: lead_status_history lead_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);
--
-- Name: lead_status_history lead_status_history_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
--
-- Name: leads leads_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);
--
-- Name: leads leads_enquiry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_enquiry_id_fkey FOREIGN KEY (enquiry_id) REFERENCES public.enquiries(id) ON DELETE SET NULL;
--
-- Name: messages messages_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: office_poll_options office_poll_options_poll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_options
    ADD CONSTRAINT office_poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.office_polls(id) ON DELETE CASCADE;
--
-- Name: office_poll_votes office_poll_votes_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_votes
    ADD CONSTRAINT office_poll_votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.office_poll_options(id) ON DELETE CASCADE;
--
-- Name: office_poll_votes office_poll_votes_poll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_votes
    ADD CONSTRAINT office_poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.office_polls(id) ON DELETE CASCADE;
--
-- Name: office_poll_votes office_poll_votes_voter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_votes
    ADD CONSTRAINT office_poll_votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: office_polls office_polls_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_polls
    ADD CONSTRAINT office_polls_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: password_vault_items password_vault_items_vault_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_vault_items
    ADD CONSTRAINT password_vault_items_vault_id_fkey FOREIGN KEY (vault_id) REFERENCES public.password_vault_configs(id) ON DELETE CASCADE;
--
-- Name: planner_tasks planner_tasks_parent_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_tasks
    ADD CONSTRAINT planner_tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.planner_tasks(id) ON DELETE SET NULL;
--
-- Name: planner_tasks planner_tasks_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_tasks
    ADD CONSTRAINT planner_tasks_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE SET NULL;
--
-- Name: poll_votes poll_votes_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.comm_channels(id) ON DELETE CASCADE;
--
-- Name: poll_votes poll_votes_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.comm_messages(id) ON DELETE CASCADE;
--
-- Name: pomodoro_sessions pomodoro_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: product_categories product_categories_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;
--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;
--
-- Name: products products_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;
--
-- Name: profiles profiles_enquiry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_enquiry_id_fkey FOREIGN KEY (enquiry_id) REFERENCES public.enquiries(id) ON DELETE SET NULL;
--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: proposals proposals_crm_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_crm_company_id_fkey FOREIGN KEY (crm_company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;
--
-- Name: proposals proposals_crm_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_crm_contact_id_fkey FOREIGN KEY (crm_contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;
--
-- Name: proposals proposals_crm_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_crm_opportunity_id_fkey FOREIGN KEY (crm_opportunity_id) REFERENCES public.crm_opportunities(id) ON DELETE SET NULL;
--
-- Name: proposals proposals_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.crm_deals(id) ON DELETE SET NULL;
--
-- Name: proposals proposals_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
--
-- Name: rate_limits rate_limits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: rbac_audit_log rbac_audit_log_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_audit_log
    ADD CONSTRAINT rbac_audit_log_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
--
-- Name: rbac_permissions rbac_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_permissions
    ADD CONSTRAINT rbac_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rbac_roles(id) ON DELETE CASCADE;
--
-- Name: rbac_roles rbac_roles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_roles
    ADD CONSTRAINT rbac_roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
--
-- Name: rbac_user_roles rbac_user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;
--
-- Name: rbac_user_roles rbac_user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rbac_roles(id) ON DELETE CASCADE;
--
-- Name: rbac_user_roles rbac_user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: resource_allocations resource_allocations_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_allocations
    ADD CONSTRAINT resource_allocations_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.crm_deals(id) ON DELETE SET NULL;
--
-- Name: resource_allocations resource_allocations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_allocations
    ADD CONSTRAINT resource_allocations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.app_projects(id) ON DELETE CASCADE;
--
-- Name: security_logs security_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
--
-- Name: site_bookings site_bookings_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_bookings
    ADD CONSTRAINT site_bookings_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;
--
-- Name: site_bookings site_bookings_visitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_bookings
    ADD CONSTRAINT site_bookings_visitor_id_fkey FOREIGN KEY (visitor_id) REFERENCES public.site_visitors(id) ON DELETE SET NULL;
--
-- Name: site_carts site_carts_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_carts
    ADD CONSTRAINT site_carts_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;
--
-- Name: site_orders site_orders_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_orders
    ADD CONSTRAINT site_orders_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;
--
-- Name: site_products site_products_inv_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_products
    ADD CONSTRAINT site_products_inv_product_id_fkey FOREIGN KEY (inv_product_id) REFERENCES public.inv_products(id) ON DELETE SET NULL;
--
-- Name: site_products site_products_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_products
    ADD CONSTRAINT site_products_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;
--
-- Name: site_visitors site_visitors_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_visitors
    ADD CONSTRAINT site_visitors_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;
--
-- Name: social_media_posts social_media_posts_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_posts
    ADD CONSTRAINT social_media_posts_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.social_media_accounts(id) ON DELETE CASCADE;
--
-- Name: subscription_site_events subscription_site_events_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_site_events
    ADD CONSTRAINT subscription_site_events_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
--
-- Name: subscription_site_events subscription_site_events_subscription_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_site_events
    ADD CONSTRAINT subscription_site_events_subscription_site_id_fkey FOREIGN KEY (subscription_site_id) REFERENCES public.subscription_sites(id) ON DELETE CASCADE;
--
-- Name: subscription_sites subscription_sites_acc_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_sites
    ADD CONSTRAINT subscription_sites_acc_customer_id_fkey FOREIGN KEY (acc_customer_id) REFERENCES public.acc_customers(id) ON DELETE SET NULL;
--
-- Name: subscription_sites subscription_sites_acc_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_sites
    ADD CONSTRAINT subscription_sites_acc_org_id_fkey FOREIGN KEY (acc_org_id) REFERENCES public.acc_organizations(id) ON DELETE SET NULL;
--
-- Name: subscription_sites subscription_sites_acc_revenue_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_sites
    ADD CONSTRAINT subscription_sites_acc_revenue_account_id_fkey FOREIGN KEY (acc_revenue_account_id) REFERENCES public.acc_chart_of_accounts(id) ON DELETE SET NULL;
--
-- Name: subscription_sites subscription_sites_account_manager_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_sites
    ADD CONSTRAINT subscription_sites_account_manager_user_id_fkey FOREIGN KEY (account_manager_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
--
-- Name: subscription_sites subscription_sites_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_sites
    ADD CONSTRAINT subscription_sites_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: support_tickets support_tickets_ai_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_ai_conversation_id_fkey FOREIGN KEY (ai_conversation_id) REFERENCES public.ai_conversations(id) ON DELETE SET NULL;
--
-- Name: support_tickets support_tickets_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE SET NULL;
--
-- Name: team_memberships team_memberships_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_memberships
    ADD CONSTRAINT team_memberships_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE CASCADE;
--
-- Name: time_entries time_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: vault_configs vault_configs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_configs
    ADD CONSTRAINT vault_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: vault_items vault_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_items
    ADD CONSTRAINT vault_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: whitelisted_ips whitelisted_ips_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelisted_ips
    ADD CONSTRAINT whitelisted_ips_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id);
--
-- Name: wiki_pages wiki_pages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT wiki_pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: workflow_runs workflow_runs_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_runs
    ADD CONSTRAINT workflow_runs_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE;
--
-- Name: enquiries Admin users can delete enquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can delete enquiries" ON public.enquiries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: enquiries Admin users can update enquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can update enquiries" ON public.enquiries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: enquiries Admin users can view enquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can view enquiries" ON public.enquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: automation_rules Admins can create automation rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create automation rules" ON public.automation_rules FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: knowledge_base Admins can create kb articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create kb articles" ON public.knowledge_base FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: ad_campaigns Admins can delete ad campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete ad campaigns" ON public.ad_campaigns FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));
--
-- Name: crm_deals Admins can delete all deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete all deals" ON public.crm_deals FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: app_projects Admins can delete app projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete app projects" ON public.app_projects FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: automation_rules Admins can delete automation rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete automation rules" ON public.automation_rules FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: client_billing Admins can delete billing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete billing" ON public.client_billing FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: blocked_ips Admins can delete blocked IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete blocked IPs" ON public.blocked_ips FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: comm_channels Admins can delete channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete channels" ON public.comm_channels FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: content_requests Admins can delete content requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete content requests" ON public.content_requests FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: conversations Admins can delete conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete conversations" ON public.conversations FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: customer_uploads Admins can delete customer uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete customer uploads" ON public.customer_uploads FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: knowledge_base Admins can delete kb articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete kb articles" ON public.knowledge_base FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: lead_notes Admins can delete lead notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete lead notes" ON public.lead_notes FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: leads Admins can delete leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: messages Admins can delete messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete messages" ON public.messages FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: profiles Admins can delete profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: site_content Admins can delete site content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete site content" ON public.site_content FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: social_media_accounts Admins can delete social media accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete social media accounts" ON public.social_media_accounts FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: social_media_posts Admins can delete social media posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete social media posts" ON public.social_media_posts FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: subscription_sites Admins can delete subscription sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete subscription sites" ON public.subscription_sites FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: client_teams Admins can delete teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete teams" ON public.client_teams FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: whitelisted_ips Admins can delete whitelisted IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete whitelisted IPs" ON public.whitelisted_ips FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: ad_campaigns Admins can insert ad campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert ad campaigns" ON public.ad_campaigns FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));
--
-- Name: app_projects Admins can insert app projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert app projects" ON public.app_projects FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: automation_rule_logs Admins can insert automation logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert automation logs" ON public.automation_rule_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: client_billing Admins can insert billing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert billing" ON public.client_billing FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: blocked_ips Admins can insert blocked IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert blocked IPs" ON public.blocked_ips FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: crm_deals Admins can insert deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert deals" ON public.crm_deals FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: lead_imports Admins can insert lead imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert lead imports" ON public.lead_imports FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: lead_notes Admins can insert lead notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert lead notes" ON public.lead_notes FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: lead_status_history Admins can insert lead status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert lead status history" ON public.lead_status_history FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: leads Admins can insert leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert leads" ON public.leads FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: profiles Admins can insert profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: site_content Admins can insert site content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert site content" ON public.site_content FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: social_media_accounts Admins can insert social media accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert social media accounts" ON public.social_media_accounts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: social_media_posts Admins can insert social media posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert social media posts" ON public.social_media_posts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: subscription_sites Admins can insert subscription sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert subscription sites" ON public.subscription_sites FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: client_teams Admins can insert teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert teams" ON public.client_teams FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: whitelisted_ips Admins can insert whitelisted IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert whitelisted IPs" ON public.whitelisted_ips FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: resource_allocations Admins can manage all allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all allocations" ON public.resource_allocations USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: client_contracts Admins can manage all contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all contracts" ON public.client_contracts USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: site_domains Admins can manage all domains; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all domains" ON public.site_domains TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: client_invoices Admins can manage all invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all invoices" ON public.client_invoices USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: team_memberships Admins can manage all memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all memberships" ON public.team_memberships USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: client_pricing Admins can manage all pricing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all pricing" ON public.client_pricing USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: announcements Admins can manage announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage announcements" ON public.announcements USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: comm_channel_members Admins can manage members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage members" ON public.comm_channel_members FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (user_id = auth.uid())));
--
-- Name: team_inbox_settings Admins can manage team inbox settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage team inbox settings" ON public.team_inbox_settings USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: rbac_user_roles Admins can manage user role assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage user role assignments" ON public.rbac_user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: rbac_audit_log Admins can read audit log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read audit log" ON public.rbac_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: messages Admins can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can send messages" ON public.messages FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: ad_campaigns Admins can update ad campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update ad campaigns" ON public.ad_campaigns FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));
--
-- Name: conversations Admins can update all conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all conversations" ON public.conversations FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: crm_deals Admins can update all deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all deals" ON public.crm_deals FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: support_tickets Admins can update all tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all tickets" ON public.support_tickets FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: app_projects Admins can update app projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update app projects" ON public.app_projects FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: automation_rules Admins can update automation rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update automation rules" ON public.automation_rules FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: client_billing Admins can update billing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update billing" ON public.client_billing FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: blocked_ips Admins can update blocked IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update blocked IPs" ON public.blocked_ips FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: comm_channels Admins can update channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update channels" ON public.comm_channels FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: content_requests Admins can update content requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update content requests" ON public.content_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: customer_uploads Admins can update customer uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update customer uploads" ON public.customer_uploads FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: knowledge_base Admins can update kb articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update kb articles" ON public.knowledge_base FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: lead_notes Admins can update lead notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update lead notes" ON public.lead_notes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: leads Admins can update leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update leads" ON public.leads FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: messages Admins can update messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update messages" ON public.messages FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: user_roles Admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: site_content Admins can update site content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update site content" ON public.site_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: social_media_accounts Admins can update social media accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update social media accounts" ON public.social_media_accounts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: social_media_posts Admins can update social media posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update social media posts" ON public.social_media_posts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: storage_quotas Admins can update storage quotas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update storage quotas" ON public.storage_quotas FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: subscription_sites Admins can update subscription sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update subscription sites" ON public.subscription_sites FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: client_teams Admins can update teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update teams" ON public.client_teams FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: whitelisted_ips Admins can update whitelisted IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update whitelisted IPs" ON public.whitelisted_ips FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: ad_campaigns Admins can view all ad campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all ad campaigns" ON public.ad_campaigns FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));
--
-- Name: resource_allocations Admins can view all allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all allocations" ON public.resource_allocations FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: app_projects Admins can view all app projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all app projects" ON public.app_projects FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: client_billing Admins can view all billing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all billing" ON public.client_billing FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: blocked_ips Admins can view all blocked IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all blocked IPs" ON public.blocked_ips FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: content_requests Admins can view all content requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all content requests" ON public.content_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: conversations Admins can view all conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: customer_uploads Admins can view all customer uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all customer uploads" ON public.customer_uploads FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: crm_deal_activities Admins can view all deal activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all deal activities" ON public.crm_deal_activities FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: crm_deals Admins can view all deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all deals" ON public.crm_deals FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: site_deployments Admins can view all deployments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all deployments" ON public.site_deployments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: office_documents Admins can view all documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all documents" ON public.office_documents FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: knowledge_base Admins can view all kb articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all kb articles" ON public.knowledge_base FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: lead_notes Admins can view all lead notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all lead notes" ON public.lead_notes FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: leads Admins can view all leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all leads" ON public.leads FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: team_memberships Admins can view all memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all memberships" ON public.team_memberships FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: messages Admins can view all messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: social_media_accounts Admins can view all social media accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all social media accounts" ON public.social_media_accounts FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: social_media_posts Admins can view all social media posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all social media posts" ON public.social_media_posts FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: storage_quotas Admins can view all storage quotas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all storage quotas" ON public.storage_quotas FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: subscription_sites Admins can view all subscription sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all subscription sites" ON public.subscription_sites FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: client_teams Admins can view all teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all teams" ON public.client_teams FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: support_tickets Admins can view all tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: user_roles Admins can view all user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all user roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: password_vault_configs Admins can view all vault configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all vault configs" ON public.password_vault_configs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: vault_configs Admins can view all vault configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all vault configs" ON public.vault_configs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: whitelisted_ips Admins can view all whitelisted IPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all whitelisted IPs" ON public.whitelisted_ips FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: automation_rule_logs Admins can view automation logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view automation logs" ON public.automation_rule_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: automation_rules Admins can view automation rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view automation rules" ON public.automation_rules FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: lead_imports Admins can view lead imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view lead imports" ON public.lead_imports FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: lead_status_history Admins can view lead status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view lead status history" ON public.lead_status_history FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: marketing_page_views Admins can view page views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view page views" ON public.marketing_page_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: security_logs Admins can view security logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view security logs" ON public.security_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: subscription_site_events Admins can view subscription events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view subscription events" ON public.subscription_site_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: team_inbox_settings Admins can view team inbox settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view team inbox settings" ON public.team_inbox_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: greeting_messages Admins manage all greetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage all greetings" ON public.greeting_messages TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: account_type_presets Admins manage presets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage presets" ON public.account_type_presets TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: bookings Anyone can create bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
--
-- Name: ecommerce_orders Anyone can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create orders" ON public.ecommerce_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
--
-- Name: marketing_page_views Anyone can insert page views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert page views" ON public.marketing_page_views FOR INSERT TO anon, authenticated WITH CHECK (true);
--
-- Name: ecommerce_orders Anyone can read a specific order; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read a specific order" ON public.ecommerce_orders FOR SELECT TO anon USING (true);
--
-- Name: site_content Anyone can read site content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read site content" ON public.site_content FOR SELECT USING (true);
--
-- Name: enquiries Anyone can submit enquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit enquiries" ON public.enquiries FOR INSERT TO anon, authenticated WITH CHECK (((name IS NOT NULL) AND (email IS NOT NULL) AND (length(name) > 0) AND (length(name) <= 200) AND (length(email) > 0) AND (length(email) <= 255) AND (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)));
--
-- Name: cad_projects Anyone can view shared CAD projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view shared CAD projects" ON public.cad_projects FOR SELECT USING (((shared_mode <> 'private'::text) AND (share_token IS NOT NULL)));
--
-- Name: account_type_presets Authenticated can read presets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read presets" ON public.account_type_presets FOR SELECT TO authenticated USING (true);
--
-- Name: comm_channels Authenticated users can create channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create channels" ON public.comm_channels FOR INSERT WITH CHECK ((auth.uid() = created_by));
--
-- Name: announcements Authenticated users can read active announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read active announcements" ON public.announcements FOR SELECT USING (((auth.uid() IS NOT NULL) AND (is_active = true)));
--
-- Name: poll_votes Authenticated users can view poll votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view poll votes" ON public.poll_votes FOR SELECT USING ((auth.uid() IS NOT NULL));
--
-- Name: comm_presence Authenticated users can view presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view presence" ON public.comm_presence FOR SELECT TO authenticated USING (true);
--
-- Name: site_carts Authenticated users delete carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users delete carts" ON public.site_carts FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.designer_sites s
  WHERE ((s.id = site_carts.site_id) AND (s.user_id = auth.uid())))));
--
-- Name: two_factor_attempts Block all direct access to 2FA attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Block all direct access to 2FA attempts" ON public.two_factor_attempts USING (false) WITH CHECK (false);
--
-- Name: rate_limits Block all direct access to rate_limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Block all direct access to rate_limits" ON public.rate_limits USING (false) WITH CHECK (false);
--
-- Name: billing_audit_log Block deletes from billing audit log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Block deletes from billing audit log" ON public.billing_audit_log FOR DELETE USING (false);
--
-- Name: billing_audit_log Block updates to billing audit log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Block updates to billing audit log" ON public.billing_audit_log FOR UPDATE USING (false);
--
-- Name: site_carts Cart creation requires session id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cart creation requires session id" ON public.site_carts FOR INSERT WITH CHECK (((session_id IS NOT NULL) AND (length(session_id) >= 8) AND (site_id IS NOT NULL)));
--
-- Name: comm_messages Channel members can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Channel members can send messages" ON public.comm_messages FOR INSERT TO authenticated WITH CHECK (((sender_id = auth.uid()) AND ((EXISTS ( SELECT 1
   FROM public.comm_channel_members
  WHERE ((comm_channel_members.channel_id = comm_messages.channel_id) AND (comm_channel_members.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role))));
--
-- Name: comm_messages Channel members can view messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Channel members can view messages" ON public.comm_messages FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.comm_channel_members
  WHERE ((comm_channel_members.channel_id = comm_messages.channel_id) AND (comm_channel_members.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: comm_reactions Channel members can view reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Channel members can view reactions" ON public.comm_reactions FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM (public.comm_messages m
     JOIN public.comm_channel_members cm ON ((cm.channel_id = m.channel_id)))
  WHERE ((m.id = comm_reactions.message_id) AND (cm.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: profiles Deny anonymous access to profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access to profiles" ON public.profiles FOR SELECT TO anon USING (false);
--
-- Name: team_branding Managers can delete team branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can delete team branding" ON public.team_branding FOR DELETE TO authenticated USING ((auth.uid() = manager_id));
--
-- Name: team_branding Managers can insert team branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can insert team branding" ON public.team_branding FOR INSERT TO authenticated WITH CHECK ((auth.uid() = manager_id));
--
-- Name: team_branding Managers can update team branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can update team branding" ON public.team_branding FOR UPDATE TO authenticated USING ((auth.uid() = manager_id));
--
-- Name: team_branding Managers can view own team branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view own team branding" ON public.team_branding FOR SELECT TO authenticated USING ((auth.uid() = manager_id));
--
-- Name: comm_channel_members Members can view channel memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view channel memberships" ON public.comm_channel_members FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_channel_member(channel_id)));
--
-- Name: comm_read_receipts Members can view channel read receipts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view channel read receipts" ON public.comm_read_receipts FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.comm_channel_members
  WHERE ((comm_channel_members.channel_id = comm_read_receipts.channel_id) AND (comm_channel_members.user_id = auth.uid())))));
--
-- Name: ecommerce_orders Merchant deletes own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchant deletes own orders" ON public.ecommerce_orders FOR DELETE TO authenticated USING ((auth.uid() = user_id));
--
-- Name: ecommerce_orders Merchant reads own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchant reads own orders" ON public.ecommerce_orders FOR SELECT TO authenticated USING ((auth.uid() = user_id));
--
-- Name: ecommerce_orders Merchant updates own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Merchant updates own orders" ON public.ecommerce_orders FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_roles Only admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: billing_audit_log Only admins can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert audit logs" ON public.billing_audit_log FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: user_roles Only admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: user_roles Only admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: billing_audit_log Only admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view audit logs" ON public.billing_audit_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- Name: subscription_site_events Owner can insert site events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner can insert site events" ON public.subscription_site_events FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.subscription_sites s
  WHERE ((s.id = subscription_site_events.subscription_site_id) AND (s.owner_user_id = auth.uid())))));
--
-- Name: subscription_sites Owner can manage subscription sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner can manage subscription sites" ON public.subscription_sites USING ((auth.uid() = owner_user_id)) WITH CHECK ((auth.uid() = owner_user_id));
--
-- Name: subscription_site_events Owner can view site events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner can view site events" ON public.subscription_site_events FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.subscription_sites s
  WHERE ((s.id = subscription_site_events.subscription_site_id) AND (s.owner_user_id = auth.uid())))));
--
-- Name: office_poll_options Poll options follow poll access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Poll options follow poll access" ON public.office_poll_options USING ((EXISTS ( SELECT 1
   FROM public.office_polls
  WHERE ((office_polls.id = office_poll_options.poll_id) AND (office_polls.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.office_polls
  WHERE ((office_polls.id = office_poll_options.poll_id) AND (office_polls.user_id = auth.uid())))));
--
-- Name: office_poll_votes Poll owners see votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Poll owners see votes" ON public.office_poll_votes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.office_polls
  WHERE ((office_polls.id = office_poll_votes.poll_id) AND (office_polls.user_id = auth.uid())))));
--
-- Name: team_memberships Primary owners can delete team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Primary owners can delete team members" ON public.team_memberships FOR DELETE USING ((team_id IN ( SELECT client_teams.id
   FROM public.client_teams
  WHERE (client_teams.primary_account_id = auth.uid()))));
--
-- Name: team_memberships Primary owners can insert team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Primary owners can insert team members" ON public.team_memberships FOR INSERT WITH CHECK ((team_id IN ( SELECT client_teams.id
   FROM public.client_teams
  WHERE (client_teams.primary_account_id = auth.uid()))));
--
-- Name: team_memberships Primary owners can update team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Primary owners can update team members" ON public.team_memberships FOR UPDATE USING ((team_id IN ( SELECT client_teams.id
   FROM public.client_teams
  WHERE (client_teams.primary_account_id = auth.uid()))));
--
-- Name: team_memberships Primary owners can view team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Primary owners can view team members" ON public.team_memberships FOR SELECT USING ((team_id IN ( SELECT client_teams.id
   FROM public.client_teams
  WHERE (client_teams.primary_account_id = auth.uid()))));
--
-- Name: enquiries Public can resume drafts with token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can resume drafts with token" ON public.enquiries FOR SELECT USING (((is_draft = true) AND (resume_token IS NOT NULL)));
--
-- Name: enquiries Public can update drafts with token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can update drafts with token" ON public.enquiries FOR UPDATE USING (((is_draft = true) AND (resume_token IS NOT NULL))) WITH CHECK ((is_draft = true));
--
-- Name: products Public can view active products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING ((status = 'active'::text));
--
-- Name: booking_services Public can view active services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active services" ON public.booking_services FOR SELECT USING ((is_active = true));
--
-- Name: booking_staff Public can view active staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active staff" ON public.booking_staff FOR SELECT USING ((is_active = true));
--
-- Name: booking_availability Public can view availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view availability" ON public.booking_availability FOR SELECT USING ((is_active = true));
--
-- Name: booking_blocked_dates Public can view blocked dates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view blocked dates" ON public.booking_blocked_dates FOR SELECT USING (true);
--
-- Name: booking_settings Public can view booking settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view booking settings" ON public.booking_settings FOR SELECT USING ((booking_page_enabled = true));
--
-- Name: product_categories Public can view categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view categories" ON public.product_categories FOR SELECT USING (true);
--
-- Name: booking_staff_services Public can view staff services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view staff services" ON public.booking_staff_services FOR SELECT USING (true);
--
-- Name: product_variants Public can view variants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view variants" ON public.product_variants FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_variants.product_id) AND (p.status = 'active'::text)))));
--
-- Name: cms_entries Public read CMS entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read CMS entries" ON public.cms_entries FOR SELECT USING ((status = 'published'::text));
--
-- Name: site_products Public read site products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read site products" ON public.site_products FOR SELECT USING ((status = 'active'::text));
--
-- Name: site_carts Site owners can update their site carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Site owners can update their site carts" ON public.site_carts FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.designer_sites s
  WHERE ((s.id = site_carts.site_id) AND (s.user_id = auth.uid())))));
--
-- Name: site_carts Site owners can view their site carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Site owners can view their site carts" ON public.site_carts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.designer_sites s
  WHERE ((s.id = site_carts.site_id) AND (s.user_id = auth.uid())))));
--
-- Name: booking_staff_services Staff service links follow staff ownership; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff service links follow staff ownership" ON public.booking_staff_services USING ((EXISTS ( SELECT 1
   FROM public.booking_staff s
  WHERE ((s.id = booking_staff_services.staff_id) AND (s.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.booking_staff s
  WHERE ((s.id = booking_staff_services.staff_id) AND (s.user_id = auth.uid())))));
--
-- Name: team_branding Team members can view team branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members can view team branding" ON public.team_branding FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.team_memberships tm
     JOIN public.client_teams ct ON ((ct.id = tm.team_id)))
  WHERE ((tm.user_id = auth.uid()) AND (ct.primary_account_id = team_branding.manager_id)))));
--
-- Name: client_contracts Team owners and financial members can view their contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners and financial members can view their contracts" ON public.client_contracts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.team_memberships tm
  WHERE ((tm.team_id = client_contracts.team_id) AND (tm.user_id = auth.uid()) AND (tm.member_role = ANY (ARRAY['owner'::text, 'financial'::text]))))));
--
-- Name: client_invoices Team owners and financial members can view their invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners and financial members can view their invoices" ON public.client_invoices FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.team_memberships tm
  WHERE ((tm.team_id = client_invoices.team_id) AND (tm.user_id = auth.uid()) AND (tm.member_role = ANY (ARRAY['owner'::text, 'financial'::text]))))));
--
-- Name: client_pricing Team owners and financial members can view their pricing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners and financial members can view their pricing" ON public.client_pricing FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.team_memberships tm
  WHERE ((tm.team_id = client_pricing.team_id) AND (tm.user_id = auth.uid()) AND (tm.member_role = ANY (ARRAY['owner'::text, 'financial'::text]))))) AND (is_visible = true)));
--
-- Name: user_branding Team owners can update member branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can update member branding" ON public.user_branding FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.team_memberships tm
     JOIN public.client_teams ct ON ((ct.id = tm.team_id)))
  WHERE ((tm.user_id = user_branding.user_id) AND (ct.primary_account_id = auth.uid())))));
--
-- Name: client_teams Team owners can update their team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can update their team" ON public.client_teams FOR UPDATE USING ((auth.uid() = primary_account_id));
--
-- Name: user_branding Team owners can view member branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can view member branding" ON public.user_branding FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.team_memberships tm
     JOIN public.client_teams ct ON ((ct.id = tm.team_id)))
  WHERE ((tm.user_id = user_branding.user_id) AND (ct.primary_account_id = auth.uid())))));
--
-- Name: client_teams Team owners can view their team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can view their team" ON public.client_teams FOR SELECT USING ((auth.uid() = primary_account_id));
--
-- Name: comm_reactions Users can add reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add reactions" ON public.comm_reactions FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
--
-- Name: team_memberships Users can add themselves to team as owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add themselves to team as owner" ON public.team_memberships FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: rbac_user_roles Users can assign roles they own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can assign roles they own" ON public.rbac_user_roles FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (assigned_by = auth.uid())));
--
-- Name: poll_votes Users can cast their own vote; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can cast their own vote" ON public.poll_votes FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: call_sessions Users can create calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create calls" ON public.call_sessions FOR INSERT WITH CHECK ((auth.uid() = caller_id));
--
-- Name: crm_deal_activities Users can create deal activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create deal activities" ON public.crm_deal_activities FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: ai_messages Users can create messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create messages in their conversations" ON public.ai_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));
--
-- Name: cad_projects Users can create own CAD projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own CAD projects" ON public.cad_projects FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: api_keys Users can create own api keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own api keys" ON public.api_keys FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: automation_runs Users can create own automation runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own automation runs" ON public.automation_runs FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: brand_settings Users can create own brand settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own brand settings" ON public.brand_settings FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: user_calendars Users can create own calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own calendars" ON public.user_calendars FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: designer_components Users can create own components; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own components" ON public.designer_components FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: conversations Users can create own conversation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own conversation" ON public.conversations FOR INSERT WITH CHECK ((auth.uid() = customer_id));
--
-- Name: crm_deals Users can create own deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own deals" ON public.crm_deals FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: site_deployments Users can create own deployments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own deployments" ON public.site_deployments FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
--
-- Name: office_documents Users can create own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own documents" ON public.office_documents FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: calendar_event_exceptions Users can create own event exceptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own event exceptions" ON public.calendar_event_exceptions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.calendar_events
  WHERE ((calendar_events.id = calendar_event_exceptions.event_id) AND (calendar_events.user_id = auth.uid())))));
--
-- Name: calendar_events Users can create own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own events" ON public.calendar_events FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: kpi_goals Users can create own kpi goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own kpi goals" ON public.kpi_goals FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: client_onboarding Users can create own onboarding records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own onboarding records" ON public.client_onboarding FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: password_vault_configs Users can create own password vault configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own password vault configs" ON public.password_vault_configs FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: password_vault_items Users can create own password vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own password vault items" ON public.password_vault_items FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: cad_project_versions Users can create own project versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own project versions" ON public.cad_project_versions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cad_projects
  WHERE ((cad_projects.id = cad_project_versions.project_id) AND (cad_projects.user_id = auth.uid())))));
--
-- Name: business_reports Users can create own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own reports" ON public.business_reports FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: automation_schedules Users can create own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own schedules" ON public.automation_schedules FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: sticky_walls Users can create own sticky walls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own sticky walls" ON public.sticky_walls FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: rbac_roles Users can create roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create roles" ON public.rbac_roles FOR INSERT TO authenticated WITH CHECK ((created_by = auth.uid()));
--
-- Name: planner_tasks Users can create tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create tasks" ON public.planner_tasks FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
--
-- Name: inv_companies Users can create their own companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own companies" ON public.inv_companies FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: content_requests Users can create their own content requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own content requests" ON public.content_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: ai_conversations Users can create their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own conversations" ON public.ai_conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: designer_pages Users can create their own pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own pages" ON public.designer_pages FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: designer_sites Users can create their own sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own sites" ON public.designer_sites FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: client_teams Users can create their own team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own team" ON public.client_teams FOR INSERT WITH CHECK ((auth.uid() = primary_account_id));
--
-- Name: support_tickets Users can create their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tickets" ON public.support_tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: customer_uploads Users can create their own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own uploads" ON public.customer_uploads FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: workflows Users can create their own workflows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own workflows" ON public.workflows FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: ai_messages Users can delete messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete messages in their conversations" ON public.ai_messages FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));
--
-- Name: cad_projects Users can delete own CAD projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own CAD projects" ON public.cad_projects FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: resource_allocations Users can delete own allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own allocations" ON public.resource_allocations FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: api_keys Users can delete own api keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own api keys" ON public.api_keys FOR DELETE USING (public.is_owner(user_id));
--
-- Name: designer_assets Users can delete own assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own assets" ON public.designer_assets FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: automation_runs Users can delete own automation runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own automation runs" ON public.automation_runs FOR DELETE USING (public.is_owner(user_id));
--
-- Name: brand_settings Users can delete own brand settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own brand settings" ON public.brand_settings FOR DELETE USING (public.is_owner(user_id));
--
-- Name: user_calendars Users can delete own calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own calendars" ON public.user_calendars FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: designer_components Users can delete own components; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own components" ON public.designer_components FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: user_connections Users can delete own connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own connections" ON public.user_connections FOR DELETE USING (public.is_owner(user_id));
--
-- Name: crm_deals Users can delete own deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own deals" ON public.crm_deals FOR DELETE USING (public.is_owner(user_id));
--
-- Name: office_documents Users can delete own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own documents" ON public.office_documents FOR DELETE USING (public.is_owner(user_id));
--
-- Name: calendar_event_exceptions Users can delete own event exceptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own event exceptions" ON public.calendar_event_exceptions FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.calendar_events
  WHERE ((calendar_events.id = calendar_event_exceptions.event_id) AND (calendar_events.user_id = auth.uid())))));
--
-- Name: calendar_events Users can delete own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own events" ON public.calendar_events FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: platform_folders Users can delete own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own folders" ON public.platform_folders FOR DELETE USING (public.is_owner(user_id));
--
-- Name: kpi_goals Users can delete own kpi goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own kpi goals" ON public.kpi_goals FOR DELETE USING (public.is_owner(user_id));
--
-- Name: comm_messages Users can delete own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own messages" ON public.comm_messages FOR DELETE TO authenticated USING (((sender_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: lead_notes Users can delete own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own notes" ON public.lead_notes FOR DELETE TO authenticated USING ((author_id = auth.uid()));
--
-- Name: notifications Users can delete own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (public.is_owner(user_id));
--
-- Name: client_onboarding Users can delete own onboarding records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own onboarding records" ON public.client_onboarding FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: password_vault_items Users can delete own password vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own password vault items" ON public.password_vault_items FOR DELETE USING (public.is_owner(user_id));
--
-- Name: platform_files Users can delete own platform files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own platform files" ON public.platform_files FOR DELETE USING (public.is_owner(user_id));
--
-- Name: cad_project_versions Users can delete own project versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own project versions" ON public.cad_project_versions FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.cad_projects
  WHERE ((cad_projects.id = cad_project_versions.project_id) AND (cad_projects.user_id = auth.uid())))));
--
-- Name: business_reports Users can delete own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own reports" ON public.business_reports FOR DELETE USING (public.is_owner(user_id));
--
-- Name: rbac_roles Users can delete own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own roles" ON public.rbac_roles FOR DELETE TO authenticated USING (((created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid())));
--
-- Name: workflow_runs Users can delete own runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own runs" ON public.workflow_runs FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: automation_schedules Users can delete own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own schedules" ON public.automation_schedules FOR DELETE USING (public.is_owner(user_id));
--
-- Name: sticky_walls Users can delete own sticky walls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own sticky walls" ON public.sticky_walls FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: planner_tasks Users can delete own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own tasks" ON public.planner_tasks FOR DELETE TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid())));
--
-- Name: vault_items Users can delete own vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own vault items" ON public.vault_items FOR DELETE USING (public.is_owner(user_id));
--
-- Name: leads Users can delete their assigned leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their assigned leads" ON public.leads FOR DELETE TO authenticated USING (((assigned_to = auth.uid()) OR (assigned_to IS NULL) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: inv_companies Users can delete their own companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own companies" ON public.inv_companies FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: ai_conversations Users can delete their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own conversations" ON public.ai_conversations FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: designer_pages Users can delete their own pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own pages" ON public.designer_pages FOR DELETE USING (public.is_owner(user_id));
--
-- Name: designer_sites Users can delete their own sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own sites" ON public.designer_sites FOR DELETE USING (public.is_owner(user_id));
--
-- Name: customer_uploads Users can delete their own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own uploads" ON public.customer_uploads FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: workflows Users can delete their own workflows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own workflows" ON public.workflows FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: comm_messages Users can edit own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can edit own messages" ON public.comm_messages FOR UPDATE TO authenticated USING (((sender_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: rbac_audit_log Users can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert audit logs" ON public.rbac_audit_log FOR INSERT TO authenticated WITH CHECK ((performed_by = auth.uid()));
--
-- Name: leads Users can insert leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (((assigned_to = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: lead_notes Users can insert notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert notes" ON public.lead_notes FOR INSERT TO authenticated WITH CHECK ((author_id = auth.uid()));
--
-- Name: resource_allocations Users can insert own allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own allocations" ON public.resource_allocations FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_branding Users can insert own branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own branding" ON public.user_branding FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_connections Users can insert own connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own connections" ON public.user_connections FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: platform_folders Users can insert own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own folders" ON public.platform_folders FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: notifications Users can insert own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: user_onboarding Users can insert own onboarding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own onboarding" ON public.user_onboarding FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: platform_files Users can insert own platform files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own platform files" ON public.platform_files FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: notification_preferences Users can insert own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own preferences" ON public.notification_preferences FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: workflow_runs Users can insert own runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own runs" ON public.workflow_runs FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_sidebar_layout Users can insert own sidebar layout; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own sidebar layout" ON public.user_sidebar_layout FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: vault_configs Users can insert own vault config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own vault config" ON public.vault_configs FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: vault_items Users can insert own vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own vault items" ON public.vault_items FOR INSERT WITH CHECK (public.is_owner(user_id));
--
-- Name: lead_status_history Users can insert status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert status history" ON public.lead_status_history FOR INSERT TO authenticated WITH CHECK ((changed_by = auth.uid()));
--
-- Name: comm_channel_members Users can leave channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can leave channels" ON public.comm_channel_members FOR DELETE TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: cad_autosaves Users can manage own autosaves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own autosaves" ON public.cad_autosaves USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: comm_user_settings Users can manage own comm settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own comm settings" ON public.comm_user_settings TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
--
-- Name: document_comments Users can manage own doc comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own doc comments" ON public.document_comments TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
--
-- Name: document_versions Users can manage own doc versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own doc versions" ON public.document_versions TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
--
-- Name: site_domains Users can manage own domains; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own domains" ON public.site_domains TO authenticated USING ((user_id = auth.uid()));
--
-- Name: comm_presence Users can manage own presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own presence" ON public.comm_presence FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
--
-- Name: comm_read_receipts Users can manage own read receipts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own read receipts" ON public.comm_read_receipts TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
--
-- Name: rbac_permissions Users can manage permissions for own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage permissions for own roles" ON public.rbac_permissions TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid()) OR (role_id IN ( SELECT rbac_roles.id
   FROM public.rbac_roles
  WHERE (rbac_roles.created_by = auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid()) OR (role_id IN ( SELECT rbac_roles.id
   FROM public.rbac_roles
  WHERE (rbac_roles.created_by = auth.uid())))));
--
-- Name: rbac_user_roles Users can manage role assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage role assignments" ON public.rbac_user_roles TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid()) OR (assigned_by = auth.uid()))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid()) OR (assigned_by = auth.uid())));
--
-- Name: proposals Users can manage their own proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own proposals" ON public.proposals USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
--
-- Name: rbac_user_roles Users can read own role assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own role assignments" ON public.rbac_user_roles FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: comm_reactions Users can remove own reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove own reactions" ON public.comm_reactions FOR DELETE TO authenticated USING ((user_id = auth.uid()));
--
-- Name: rbac_user_roles Users can remove role assignments they own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove role assignments they own" ON public.rbac_user_roles FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (assigned_by = auth.uid())));
--
-- Name: messages Users can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK ((auth.uid() = sender_id));
--
-- Name: cad_projects Users can update own CAD projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own CAD projects" ON public.cad_projects FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: resource_allocations Users can update own allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own allocations" ON public.resource_allocations FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: api_keys Users can update own api keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own api keys" ON public.api_keys FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: automation_runs Users can update own automation runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own automation runs" ON public.automation_runs FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: brand_settings Users can update own brand settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own brand settings" ON public.brand_settings FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: user_branding Users can update own branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own branding" ON public.user_branding FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
--
-- Name: user_calendars Users can update own calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own calendars" ON public.user_calendars FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: designer_components Users can update own components; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own components" ON public.designer_components FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: user_connections Users can update own connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own connections" ON public.user_connections FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: crm_deals Users can update own deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own deals" ON public.crm_deals FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: site_deployments Users can update own deployments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own deployments" ON public.site_deployments FOR UPDATE TO authenticated USING ((user_id = auth.uid()));
--
-- Name: office_documents Users can update own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own documents" ON public.office_documents FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: calendar_event_exceptions Users can update own event exceptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own event exceptions" ON public.calendar_event_exceptions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.calendar_events
  WHERE ((calendar_events.id = calendar_event_exceptions.event_id) AND (calendar_events.user_id = auth.uid())))));
--
-- Name: calendar_events Users can update own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own events" ON public.calendar_events FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: platform_folders Users can update own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own folders" ON public.platform_folders FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: kpi_goals Users can update own kpi goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own kpi goals" ON public.kpi_goals FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: comm_channel_members Users can update own membership; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own membership" ON public.comm_channel_members FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: lead_notes Users can update own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notes" ON public.lead_notes FOR UPDATE TO authenticated USING ((author_id = auth.uid()));
--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: user_onboarding Users can update own onboarding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own onboarding" ON public.user_onboarding FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: client_onboarding Users can update own onboarding records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own onboarding records" ON public.client_onboarding FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: password_vault_configs Users can update own password vault configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own password vault configs" ON public.password_vault_configs FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: password_vault_items Users can update own password vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own password vault items" ON public.password_vault_items FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: platform_files Users can update own platform files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own platform files" ON public.platform_files FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: notification_preferences Users can update own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own preferences" ON public.notification_preferences FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: comm_presence Users can update own presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own presence" ON public.comm_presence FOR UPDATE TO authenticated USING ((user_id = auth.uid()));
--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: business_reports Users can update own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own reports" ON public.business_reports FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: rbac_roles Users can update own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own roles" ON public.rbac_roles FOR UPDATE TO authenticated USING (((created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid())));
--
-- Name: workflow_runs Users can update own runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own runs" ON public.workflow_runs FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: automation_schedules Users can update own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own schedules" ON public.automation_schedules FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: user_sidebar_layout Users can update own sidebar layout; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own sidebar layout" ON public.user_sidebar_layout FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: sticky_walls Users can update own sticky walls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own sticky walls" ON public.sticky_walls FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: vault_configs Users can update own vault config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own vault config" ON public.vault_configs FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: vault_items Users can update own vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own vault items" ON public.vault_items FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: messages Users can update read status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update read status" ON public.messages FOR UPDATE USING ((auth.uid() = recipient_id));
--
-- Name: planner_tasks Users can update tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update tasks" ON public.planner_tasks FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR (assigned_to = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_team_owner(auth.uid())));
--
-- Name: leads Users can update their assigned leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their assigned leads" ON public.leads FOR UPDATE TO authenticated USING (((assigned_to = auth.uid()) OR (assigned_to IS NULL) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: call_sessions Users can update their calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their calls" ON public.call_sessions FOR UPDATE USING (((auth.uid() = caller_id) OR (auth.uid() = callee_id)));
--
-- Name: inv_companies Users can update their own companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own companies" ON public.inv_companies FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: ai_conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversations" ON public.ai_conversations FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: designer_pages Users can update their own pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own pages" ON public.designer_pages FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: designer_sites Users can update their own sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own sites" ON public.designer_sites FOR UPDATE USING (public.is_owner(user_id));
--
-- Name: workflows Users can update their own workflows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own workflows" ON public.workflows FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: designer_assets Users can upload own assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can upload own assets" ON public.designer_assets FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: rbac_roles Users can view accessible roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view accessible roles" ON public.rbac_roles FOR SELECT TO authenticated USING (((is_system = true) OR (created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (id IN ( SELECT rbac_user_roles.role_id
   FROM public.rbac_user_roles
  WHERE (rbac_user_roles.user_id = auth.uid())))));
--
-- Name: comm_channels Users can view channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view channels" ON public.comm_channels FOR SELECT USING (((NOT is_archived) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: ai_messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.ai_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));
--
-- Name: lead_notes Users can view notes for accessible leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view notes for accessible leads" ON public.lead_notes FOR SELECT TO authenticated USING (((author_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: cad_projects Users can view own CAD projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own CAD projects" ON public.cad_projects FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: resource_allocations Users can view own allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own allocations" ON public.resource_allocations FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: api_keys Users can view own api keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own api keys" ON public.api_keys FOR SELECT USING (public.is_owner(user_id));
--
-- Name: designer_assets Users can view own assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own assets" ON public.designer_assets FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: rbac_audit_log Users can view own audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own audit logs" ON public.rbac_audit_log FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (performed_by = auth.uid())));
--
-- Name: automation_runs Users can view own automation runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own automation runs" ON public.automation_runs FOR SELECT USING (public.is_owner(user_id));
--
-- Name: client_billing Users can view own billing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own billing" ON public.client_billing FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: brand_settings Users can view own brand settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own brand settings" ON public.brand_settings FOR SELECT USING (public.is_owner(user_id));
--
-- Name: user_branding Users can view own branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own branding" ON public.user_branding FOR SELECT TO authenticated USING ((auth.uid() = user_id));
--
-- Name: user_calendars Users can view own calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own calendars" ON public.user_calendars FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: designer_components Users can view own components; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own components" ON public.designer_components FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_connections Users can view own connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own connections" ON public.user_connections FOR SELECT USING (public.is_owner(user_id));
--
-- Name: conversations Users can view own conversation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own conversation" ON public.conversations FOR SELECT USING ((auth.uid() = customer_id));
--
-- Name: crm_deal_activities Users can view own deal activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own deal activities" ON public.crm_deal_activities FOR SELECT USING (public.is_owner(user_id));
--
-- Name: crm_deals Users can view own deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own deals" ON public.crm_deals FOR SELECT USING (public.is_owner(user_id));
--
-- Name: site_deployments Users can view own deployments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own deployments" ON public.site_deployments FOR SELECT TO authenticated USING ((user_id = auth.uid()));
--
-- Name: office_documents Users can view own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own documents" ON public.office_documents FOR SELECT USING (public.is_owner(user_id));
--
-- Name: calendar_event_exceptions Users can view own event exceptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own event exceptions" ON public.calendar_event_exceptions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.calendar_events
  WHERE ((calendar_events.id = calendar_event_exceptions.event_id) AND (calendar_events.user_id = auth.uid())))));
--
-- Name: calendar_events Users can view own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own events" ON public.calendar_events FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: platform_folders Users can view own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own folders" ON public.platform_folders FOR SELECT USING (public.is_owner(user_id));
--
-- Name: kpi_goals Users can view own kpi goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own kpi goals" ON public.kpi_goals FOR SELECT USING (public.is_owner(user_id));
--
-- Name: team_memberships Users can view own membership; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own membership" ON public.team_memberships FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: messages Users can view own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (((auth.uid() = sender_id) OR (auth.uid() = recipient_id)));
--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (public.is_owner(user_id));
--
-- Name: user_onboarding Users can view own onboarding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own onboarding" ON public.user_onboarding FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: client_onboarding Users can view own onboarding records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own onboarding records" ON public.client_onboarding FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: password_vault_configs Users can view own password vault configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own password vault configs" ON public.password_vault_configs FOR SELECT USING (public.is_owner(user_id));
--
-- Name: password_vault_items Users can view own password vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own password vault items" ON public.password_vault_items FOR SELECT USING (public.is_owner(user_id));
--
-- Name: platform_files Users can view own platform files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own platform files" ON public.platform_files FOR SELECT USING (public.is_owner(user_id));
--
-- Name: notification_preferences Users can view own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own preferences" ON public.notification_preferences FOR SELECT USING (public.is_owner(user_id));
--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: cad_project_versions Users can view own project versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own project versions" ON public.cad_project_versions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cad_projects
  WHERE ((cad_projects.id = cad_project_versions.project_id) AND (cad_projects.user_id = auth.uid())))));
--
-- Name: business_reports Users can view own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own reports" ON public.business_reports FOR SELECT USING (public.is_owner(user_id));
--
-- Name: user_roles Users can view own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
--
-- Name: workflow_runs Users can view own runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own runs" ON public.workflow_runs FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: automation_schedules Users can view own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own schedules" ON public.automation_schedules FOR SELECT USING (public.is_owner(user_id));
--
-- Name: user_sidebar_layout Users can view own sidebar layout; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sidebar layout" ON public.user_sidebar_layout FOR SELECT USING ((auth.uid() = user_id));
