SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;
--
-- Name: hr_time_off_requests hr_time_off_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_time_off_requests
    ADD CONSTRAINT hr_time_off_requests_pkey PRIMARY KEY (id);
--
-- Name: inv_categories inv_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_categories
    ADD CONSTRAINT inv_categories_pkey PRIMARY KEY (id);
--
-- Name: inv_companies inv_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_companies
    ADD CONSTRAINT inv_companies_pkey PRIMARY KEY (id);
--
-- Name: inv_locations inv_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_locations
    ADD CONSTRAINT inv_locations_pkey PRIMARY KEY (id);
--
-- Name: inv_products inv_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_products
    ADD CONSTRAINT inv_products_pkey PRIMARY KEY (id);
--
-- Name: inv_products inv_products_user_id_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_products
    ADD CONSTRAINT inv_products_user_id_sku_key UNIQUE (user_id, sku);
--
-- Name: inv_settings inv_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_settings
    ADD CONSTRAINT inv_settings_pkey PRIMARY KEY (id);
--
-- Name: inv_settings inv_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_settings
    ADD CONSTRAINT inv_settings_user_id_key UNIQUE (user_id);
--
-- Name: inv_stock_count_items inv_stock_count_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_count_items
    ADD CONSTRAINT inv_stock_count_items_pkey PRIMARY KEY (id);
--
-- Name: inv_stock_counts inv_stock_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_counts
    ADD CONSTRAINT inv_stock_counts_pkey PRIMARY KEY (id);
--
-- Name: inv_stock_levels inv_stock_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_levels
    ADD CONSTRAINT inv_stock_levels_pkey PRIMARY KEY (id);
--
-- Name: inv_stock_levels inv_stock_levels_product_id_location_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_levels
    ADD CONSTRAINT inv_stock_levels_product_id_location_id_key UNIQUE (product_id, location_id);
--
-- Name: inv_stock_movements inv_stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inv_stock_movements
    ADD CONSTRAINT inv_stock_movements_pkey PRIMARY KEY (id);
--
-- Name: knowledge_base knowledge_base_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_pkey PRIMARY KEY (id);
--
-- Name: kpi_goals kpi_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_goals
    ADD CONSTRAINT kpi_goals_pkey PRIMARY KEY (id);
--
-- Name: lead_imports lead_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_imports
    ADD CONSTRAINT lead_imports_pkey PRIMARY KEY (id);
--
-- Name: lead_notes lead_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_pkey PRIMARY KEY (id);
--
-- Name: lead_status_history lead_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_pkey PRIMARY KEY (id);
--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);
--
-- Name: marketing_page_views marketing_page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_page_views
    ADD CONSTRAINT marketing_page_views_pkey PRIMARY KEY (id);
--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);
--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);
--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
--
-- Name: office_documents office_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_documents
    ADD CONSTRAINT office_documents_pkey PRIMARY KEY (id);
--
-- Name: office_poll_options office_poll_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_options
    ADD CONSTRAINT office_poll_options_pkey PRIMARY KEY (id);
--
-- Name: office_poll_votes office_poll_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_votes
    ADD CONSTRAINT office_poll_votes_pkey PRIMARY KEY (id);
--
-- Name: office_poll_votes office_poll_votes_poll_id_voter_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_poll_votes
    ADD CONSTRAINT office_poll_votes_poll_id_voter_id_key UNIQUE (poll_id, voter_id);
--
-- Name: office_polls office_polls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_polls
    ADD CONSTRAINT office_polls_pkey PRIMARY KEY (id);
--
-- Name: password_vault_configs password_vault_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_vault_configs
    ADD CONSTRAINT password_vault_configs_pkey PRIMARY KEY (id);
--
-- Name: password_vault_items password_vault_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_vault_items
    ADD CONSTRAINT password_vault_items_pkey PRIMARY KEY (id);
--
-- Name: planner_tasks planner_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_tasks
    ADD CONSTRAINT planner_tasks_pkey PRIMARY KEY (id);
--
-- Name: platform_files platform_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_files
    ADD CONSTRAINT platform_files_pkey PRIMARY KEY (id);
--
-- Name: platform_folders platform_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_folders
    ADD CONSTRAINT platform_folders_pkey PRIMARY KEY (id);
--
-- Name: platform_folders platform_folders_user_id_full_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_folders
    ADD CONSTRAINT platform_folders_user_id_full_path_key UNIQUE (user_id, full_path);
--
-- Name: poll_votes poll_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_pkey PRIMARY KEY (id);
--
-- Name: poll_votes poll_votes_poll_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_poll_id_user_id_key UNIQUE (poll_id, user_id);
--
-- Name: pomodoro_sessions pomodoro_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_pkey PRIMARY KEY (id);
--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);
--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);
--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);
--
-- Name: profiles profiles_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_customer_id_key UNIQUE (customer_id);
--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
--
-- Name: profiles profiles_verification_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_verification_token_key UNIQUE (verification_token);
--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);
--
-- Name: rate_limits rate_limits_key_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_key_endpoint_key UNIQUE (key, endpoint);
--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);
--
-- Name: rbac_audit_log rbac_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_audit_log
    ADD CONSTRAINT rbac_audit_log_pkey PRIMARY KEY (id);
--
-- Name: rbac_permissions rbac_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_permissions
    ADD CONSTRAINT rbac_permissions_pkey PRIMARY KEY (id);
--
-- Name: rbac_permissions rbac_permissions_role_id_module_action_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_permissions
    ADD CONSTRAINT rbac_permissions_role_id_module_action_key UNIQUE (role_id, module, action);
--
-- Name: rbac_roles rbac_roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_roles
    ADD CONSTRAINT rbac_roles_name_key UNIQUE (name);
--
-- Name: rbac_roles rbac_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_roles
    ADD CONSTRAINT rbac_roles_pkey PRIMARY KEY (id);
--
-- Name: rbac_user_roles rbac_user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_pkey PRIMARY KEY (id);
--
-- Name: rbac_user_roles rbac_user_roles_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_user_id_role_id_key UNIQUE (user_id, role_id);
--
-- Name: resource_allocations resource_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_allocations
    ADD CONSTRAINT resource_allocations_pkey PRIMARY KEY (id);
--
-- Name: security_logs security_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_pkey PRIMARY KEY (id);
--
-- Name: site_bookings site_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_bookings
    ADD CONSTRAINT site_bookings_pkey PRIMARY KEY (id);
--
-- Name: site_carts site_carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_carts
    ADD CONSTRAINT site_carts_pkey PRIMARY KEY (id);
--
-- Name: site_content site_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_content
    ADD CONSTRAINT site_content_pkey PRIMARY KEY (id);
--
-- Name: site_content site_content_section_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_content
    ADD CONSTRAINT site_content_section_key_key UNIQUE (section_key);
--
-- Name: site_deployments site_deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_deployments
    ADD CONSTRAINT site_deployments_pkey PRIMARY KEY (id);
--
-- Name: site_domains site_domains_domain_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_domains
    ADD CONSTRAINT site_domains_domain_name_key UNIQUE (domain_name);
--
-- Name: site_domains site_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_domains
    ADD CONSTRAINT site_domains_pkey PRIMARY KEY (id);
--
-- Name: site_orders site_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_orders
    ADD CONSTRAINT site_orders_pkey PRIMARY KEY (id);
--
-- Name: site_products site_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_products
    ADD CONSTRAINT site_products_pkey PRIMARY KEY (id);
--
-- Name: site_products site_products_site_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_products
    ADD CONSTRAINT site_products_site_id_slug_key UNIQUE (site_id, slug);
--
-- Name: site_visitors site_visitors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_visitors
    ADD CONSTRAINT site_visitors_pkey PRIMARY KEY (id);
--
-- Name: site_visitors site_visitors_site_id_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_visitors
    ADD CONSTRAINT site_visitors_site_id_email_key UNIQUE (site_id, email);
--
-- Name: social_media_accounts social_media_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_accounts
    ADD CONSTRAINT social_media_accounts_pkey PRIMARY KEY (id);
--
-- Name: social_media_posts social_media_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_media_posts
    ADD CONSTRAINT social_media_posts_pkey PRIMARY KEY (id);
--
-- Name: sticky_walls sticky_walls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sticky_walls
    ADD CONSTRAINT sticky_walls_pkey PRIMARY KEY (id);
--
-- Name: storage_quotas storage_quotas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storage_quotas
    ADD CONSTRAINT storage_quotas_pkey PRIMARY KEY (id);
--
-- Name: storage_quotas storage_quotas_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storage_quotas
    ADD CONSTRAINT storage_quotas_user_id_key UNIQUE (user_id);
--
-- Name: subscription_site_events subscription_site_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_site_events
    ADD CONSTRAINT subscription_site_events_pkey PRIMARY KEY (id);
--
-- Name: subscription_sites subscription_sites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_sites
    ADD CONSTRAINT subscription_sites_pkey PRIMARY KEY (id);
--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);
--
-- Name: support_tickets support_tickets_reference_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_reference_id_key UNIQUE (reference_id);
--
-- Name: team_branding team_branding_manager_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_branding
    ADD CONSTRAINT team_branding_manager_id_key UNIQUE (manager_id);
--
-- Name: team_branding team_branding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_branding
    ADD CONSTRAINT team_branding_pkey PRIMARY KEY (id);
--
-- Name: team_inbox_settings team_inbox_settings_admin_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_inbox_settings
    ADD CONSTRAINT team_inbox_settings_admin_id_key UNIQUE (admin_id);
--
-- Name: team_inbox_settings team_inbox_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_inbox_settings
    ADD CONSTRAINT team_inbox_settings_pkey PRIMARY KEY (id);
--
-- Name: team_memberships team_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_memberships
    ADD CONSTRAINT team_memberships_pkey PRIMARY KEY (id);
--
-- Name: team_memberships team_memberships_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_memberships
    ADD CONSTRAINT team_memberships_team_id_user_id_key UNIQUE (team_id, user_id);
--
-- Name: time_entries time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_pkey PRIMARY KEY (id);
--
-- Name: two_factor_attempts two_factor_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.two_factor_attempts
    ADD CONSTRAINT two_factor_attempts_pkey PRIMARY KEY (id);
--
-- Name: user_activity_log user_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_log
    ADD CONSTRAINT user_activity_log_pkey PRIMARY KEY (id);
--
-- Name: user_branding user_branding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_branding
    ADD CONSTRAINT user_branding_pkey PRIMARY KEY (id);
--
-- Name: user_branding user_branding_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_branding
    ADD CONSTRAINT user_branding_user_id_key UNIQUE (user_id);
--
-- Name: user_calendars user_calendars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_calendars
    ADD CONSTRAINT user_calendars_pkey PRIMARY KEY (id);
--
-- Name: user_connections user_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_pkey PRIMARY KEY (id);
--
-- Name: user_connections user_connections_user_id_provider_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_user_id_provider_key UNIQUE (user_id, provider);
--
-- Name: user_onboarding user_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding
    ADD CONSTRAINT user_onboarding_pkey PRIMARY KEY (id);
--
-- Name: user_onboarding user_onboarding_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding
    ADD CONSTRAINT user_onboarding_user_id_key UNIQUE (user_id);
--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
--
-- Name: user_sidebar_layout user_sidebar_layout_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sidebar_layout
    ADD CONSTRAINT user_sidebar_layout_pkey PRIMARY KEY (id);
--
-- Name: user_sidebar_layout user_sidebar_layout_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sidebar_layout
    ADD CONSTRAINT user_sidebar_layout_user_id_key UNIQUE (user_id);
--
-- Name: vault_configs vault_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_configs
    ADD CONSTRAINT vault_configs_pkey PRIMARY KEY (id);
--
-- Name: vault_items vault_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_items
    ADD CONSTRAINT vault_items_pkey PRIMARY KEY (id);
--
-- Name: whitelisted_ips whitelisted_ips_ip_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelisted_ips
    ADD CONSTRAINT whitelisted_ips_ip_address_key UNIQUE (ip_address);
--
-- Name: whitelisted_ips whitelisted_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelisted_ips
    ADD CONSTRAINT whitelisted_ips_pkey PRIMARY KEY (id);
--
-- Name: wiki_pages wiki_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wiki_pages
    ADD CONSTRAINT wiki_pages_pkey PRIMARY KEY (id);
--
-- Name: workflow_runs workflow_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_runs
    ADD CONSTRAINT workflow_runs_pkey PRIMARY KEY (id);
--
-- Name: workflows workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);
--
-- Name: acc_audit_org_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_audit_org_idx ON public.acc_audit_log USING btree (org_id, created_at DESC);
--
-- Name: acc_coa_org_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_coa_org_idx ON public.acc_chart_of_accounts USING btree (org_id);
--
-- Name: acc_inv_org_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_inv_org_idx ON public.acc_accountant_invites USING btree (org_id);
--
-- Name: acc_inv_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_inv_token_idx ON public.acc_accountant_invites USING btree (token);
--
-- Name: acc_je_org_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_je_org_date_idx ON public.acc_journal_entries USING btree (org_id, entry_date);
--
-- Name: acc_je_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_je_source_idx ON public.acc_journal_entries USING btree (source_type, source_id);
--
-- Name: acc_jl_account_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_jl_account_idx ON public.acc_journal_lines USING btree (account_id);
--
-- Name: acc_jl_entry_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_jl_entry_idx ON public.acc_journal_lines USING btree (journal_entry_id);
--
-- Name: acc_per_org_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_per_org_idx ON public.acc_accounting_periods USING btree (org_id, start_date);
--
-- Name: acc_report_recalcs_org_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acc_report_recalcs_org_time_idx ON public.acc_report_recalcs USING btree (org_id, computed_at DESC);
--
-- Name: ecommerce_orders_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ecommerce_orders_user_idx ON public.ecommerce_orders USING btree (user_id, created_at DESC);
--
-- Name: idx_2fa_attempts_user_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_2fa_attempts_user_time ON public.two_factor_attempts USING btree (user_id, created_at DESC);
--
-- Name: idx_acc_ap_bills_org_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_ap_bills_org_status ON public.acc_ap_bills USING btree (org_id, status);
--
-- Name: idx_acc_ap_bills_supplier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_ap_bills_supplier ON public.acc_ap_bills USING btree (supplier_id);
--
-- Name: idx_acc_ar_invoices_crm_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_ar_invoices_crm_company ON public.acc_ar_invoices USING btree (crm_company_id);
--
-- Name: idx_acc_ar_invoices_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_ar_invoices_customer ON public.acc_ar_invoices USING btree (customer_id);
--
-- Name: idx_acc_ar_invoices_org_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_ar_invoices_org_status ON public.acc_ar_invoices USING btree (org_id, status);
--
-- Name: idx_acc_ar_invoices_subscription_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_ar_invoices_subscription_site ON public.acc_ar_invoices USING btree (subscription_site_id) WHERE (subscription_site_id IS NOT NULL);
--
-- Name: idx_acc_bank_txn_account_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_bank_txn_account_date ON public.acc_bank_transactions USING btree (bank_account_id, txn_date DESC);
--
-- Name: idx_acc_bank_txn_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_bank_txn_status ON public.acc_bank_transactions USING btree (bank_account_id, status);
--
-- Name: idx_acc_customers_crm_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acc_customers_crm_company ON public.acc_customers USING btree (crm_company_id);
--
-- Name: idx_ad_campaigns_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_campaigns_platform ON public.ad_campaigns USING btree (platform);
--
-- Name: idx_ad_campaigns_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns USING btree (status);
--
-- Name: idx_ad_campaigns_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ad_campaigns_user_id ON public.ad_campaigns USING btree (user_id);
--
-- Name: idx_ai_conversations_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversations_updated_at ON public.ai_conversations USING btree (user_id, updated_at DESC);
--
-- Name: idx_ai_conversations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations USING btree (user_id);
--
-- Name: idx_ai_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages USING btree (conversation_id);
--
-- Name: idx_ai_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_messages_created_at ON public.ai_messages USING btree (conversation_id, created_at);
--
-- Name: idx_api_keys_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_user ON public.api_keys USING btree (user_id);
--
-- Name: idx_app_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_projects_status ON public.app_projects USING btree (status);
--
-- Name: idx_app_projects_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_projects_user_id ON public.app_projects USING btree (user_id);
--
-- Name: idx_asset_folders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asset_folders_user ON public.asset_folders USING btree (user_id);
--
-- Name: idx_asset_tags_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asset_tags_user ON public.asset_tags USING btree (user_id);
--
-- Name: idx_automation_rule_logs_executed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_rule_logs_executed_at ON public.automation_rule_logs USING btree (executed_at DESC);
--
-- Name: idx_automation_rule_logs_rule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_rule_logs_rule_id ON public.automation_rule_logs USING btree (rule_id);
--
-- Name: idx_automation_rules_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_rules_active ON public.automation_rules USING btree (is_active);
--
-- Name: idx_automation_runs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_runs_user ON public.automation_runs USING btree (user_id);
--
-- Name: idx_automation_runs_workflow; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_runs_workflow ON public.automation_runs USING btree (workflow_id);
--
-- Name: idx_automation_schedules_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_schedules_user ON public.automation_schedules USING btree (user_id);
--
-- Name: idx_blocked_ips_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blocked_ips_expires ON public.blocked_ips USING btree (expires_at) WHERE (expires_at IS NOT NULL);
--
-- Name: idx_blocked_ips_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blocked_ips_ip ON public.blocked_ips USING btree (ip_address);
--
-- Name: idx_booking_availability_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_availability_user ON public.booking_availability USING btree (user_id, staff_id, day_of_week);
--
-- Name: idx_booking_services_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_services_user ON public.booking_services USING btree (user_id);
--
-- Name: idx_booking_settings_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_settings_slug ON public.booking_settings USING btree (business_slug);
--
-- Name: idx_booking_staff_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_staff_user ON public.booking_staff USING btree (user_id);
--
-- Name: idx_bookings_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_source ON public.bookings USING btree (user_id, source);
--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (user_id, status);
--
-- Name: idx_bookings_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_user_date ON public.bookings USING btree (user_id, booking_date);
--
-- Name: idx_brand_settings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brand_settings_user ON public.brand_settings USING btree (user_id);
--
-- Name: idx_business_reports_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_reports_user ON public.business_reports USING btree (user_id);
--
-- Name: idx_cad_autosaves_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cad_autosaves_user_id ON public.cad_autosaves USING btree (user_id);
--
-- Name: idx_cad_project_versions_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cad_project_versions_project_id ON public.cad_project_versions USING btree (project_id);
--
-- Name: idx_cad_projects_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cad_projects_user_id ON public.cad_projects USING btree (user_id);
--
-- Name: idx_calendar_events_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_events_start_time ON public.calendar_events USING btree (start_time);
--
-- Name: idx_calendar_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_events_user_id ON public.calendar_events USING btree (user_id);
--
-- Name: idx_client_assets_folder; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_assets_folder ON public.client_assets USING btree (folder_id);
--
-- Name: idx_client_assets_folder_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_assets_folder_id ON public.client_assets USING btree (folder_id);
--
-- Name: idx_client_assets_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_assets_user ON public.client_assets USING btree (user_id);
--
-- Name: idx_client_assets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_assets_user_id ON public.client_assets USING btree (user_id);
--
-- Name: idx_client_contracts_crm_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_contracts_crm_company ON public.client_contracts USING btree (crm_company_id);
--
-- Name: idx_client_invoices_crm_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_invoices_crm_company ON public.client_invoices USING btree (crm_company_id);
--
-- Name: idx_client_onboarding_deal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_onboarding_deal ON public.client_onboarding USING btree (deal_id);
--
-- Name: idx_client_onboarding_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_onboarding_status ON public.client_onboarding USING btree (status);
--
-- Name: idx_client_onboarding_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_onboarding_user ON public.client_onboarding USING btree (user_id);
--
-- Name: idx_client_teams_primary_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_teams_primary_account ON public.client_teams USING btree (primary_account_id);
--
-- Name: idx_comm_channel_members_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_channel_members_channel ON public.comm_channel_members USING btree (channel_id);
--
-- Name: idx_comm_channel_members_channel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_channel_members_channel_id ON public.comm_channel_members USING btree (channel_id);
--
-- Name: idx_comm_channel_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_channel_members_user ON public.comm_channel_members USING btree (user_id);
--
-- Name: idx_comm_channel_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_channel_members_user_id ON public.comm_channel_members USING btree (user_id);
--
-- Name: idx_comm_messages_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_messages_channel ON public.comm_messages USING btree (channel_id, created_at DESC);
--
-- Name: idx_comm_messages_channel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_messages_channel_id ON public.comm_messages USING btree (channel_id);
--
-- Name: idx_comm_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_messages_created_at ON public.comm_messages USING btree (created_at DESC);
--
-- Name: idx_comm_messages_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_messages_parent ON public.comm_messages USING btree (parent_id) WHERE (parent_id IS NOT NULL);
--
-- Name: idx_comm_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_messages_sender ON public.comm_messages USING btree (sender_id);
--
-- Name: idx_comm_messages_sender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_messages_sender_id ON public.comm_messages USING btree (sender_id);
--
-- Name: idx_comm_presence_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_presence_status ON public.comm_presence USING btree (status);
--
-- Name: idx_comm_presence_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_presence_user ON public.comm_presence USING btree (user_id);
--
-- Name: idx_comm_reactions_message; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comm_reactions_message ON public.comm_reactions USING btree (message_id);
--
-- Name: idx_content_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_requests_status ON public.content_requests USING btree (status);
--
-- Name: idx_content_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_requests_user_id ON public.content_requests USING btree (user_id);
--
-- Name: idx_crm_comm_att_comm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_att_comm ON public.crm_communication_attachments USING btree (communication_id);
--
-- Name: idx_crm_comm_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_company ON public.crm_communications USING btree (company_id, occurred_at DESC);
--
-- Name: idx_crm_comm_contact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_contact ON public.crm_communications USING btree (contact_id, occurred_at DESC);
--
-- Name: idx_crm_comm_external; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_external ON public.crm_communications USING btree (external_source, external_id);
--
-- Name: idx_crm_comm_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_kind ON public.crm_communications USING btree (kind);
--
-- Name: idx_crm_comm_opp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_opp ON public.crm_communications USING btree (opportunity_id, occurred_at DESC);
--
-- Name: idx_crm_comm_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_comm_org ON public.crm_communications USING btree (org_id);
--
-- Name: idx_crm_companies_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_companies_domain ON public.crm_companies USING btree (domain);
--
-- Name: idx_crm_companies_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_companies_org ON public.crm_companies USING btree (org_id);
--
-- Name: idx_crm_companies_rel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_companies_rel ON public.crm_companies USING gin (relationship_type);
--
-- Name: idx_crm_contacts_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_company ON public.crm_contacts USING btree (company_id);
--
-- Name: idx_crm_contacts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_email ON public.crm_contacts USING btree (email);
--
-- Name: idx_crm_contacts_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_org ON public.crm_contacts USING btree (org_id);
--
-- Name: idx_crm_deal_activities_deal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_deal_activities_deal_id ON public.crm_deal_activities USING btree (deal_id);
--
-- Name: idx_crm_deals_expected_close; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_deals_expected_close ON public.crm_deals USING btree (expected_close_date);
--
-- Name: idx_crm_deals_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_deals_stage ON public.crm_deals USING btree (stage);
--
-- Name: idx_crm_deals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_deals_user_id ON public.crm_deals USING btree (user_id);
--
-- Name: idx_crm_fin_links_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_fin_links_entity ON public.crm_financial_links USING btree (entity_type, entity_id);
--
-- Name: idx_crm_fin_links_finance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_fin_links_finance ON public.crm_financial_links USING btree (finance_type, finance_id);
--
-- Name: idx_crm_fin_links_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_fin_links_org ON public.crm_financial_links USING btree (org_id);
--
-- Name: idx_crm_opps_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_opps_company ON public.crm_opportunities USING btree (company_id);
--
-- Name: idx_crm_opps_contact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_opps_contact ON public.crm_opportunities USING btree (contact_id);
--
-- Name: idx_crm_opps_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_opps_org ON public.crm_opportunities USING btree (org_id);
--
-- Name: idx_crm_participants_comm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_participants_comm ON public.crm_activity_participants USING btree (communication_id);
--
-- Name: idx_crm_workflow_runs_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_workflow_runs_entity ON public.crm_workflow_runs USING btree (entity_type, entity_id);
--
-- Name: idx_crm_workflow_runs_workflow; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_workflow_runs_workflow ON public.crm_workflow_runs USING btree (workflow_id, created_at DESC);
--
-- Name: idx_crm_workflows_org_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_workflows_org_active ON public.crm_workflows USING btree (org_id, is_active, trigger_event);
--
-- Name: idx_designer_assets_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designer_assets_site ON public.designer_assets USING btree (site_id);
--
-- Name: idx_designer_assets_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designer_assets_user ON public.designer_assets USING btree (user_id);
--
-- Name: idx_designer_components_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designer_components_user ON public.designer_components USING btree (user_id);
--
-- Name: idx_designer_pages_site_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designer_pages_site_id ON public.designer_pages USING btree (site_id);
--
-- Name: idx_designer_pages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designer_pages_user_id ON public.designer_pages USING btree (user_id);
--
-- Name: idx_designer_sites_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designer_sites_user_id ON public.designer_sites USING btree (user_id);
--
-- Name: idx_dmc_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dmc_user ON public.dashboard_metrics_cache USING btree (user_id, period);
--
-- Name: idx_doc_comments_doc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doc_comments_doc ON public.document_comments USING btree (document_id);
--
-- Name: idx_doc_versions_doc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doc_versions_doc ON public.document_versions USING btree (document_id, created_at DESC);
--
-- Name: idx_email_accounts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_accounts_user ON public.email_accounts USING btree (user_id);
--
-- Name: idx_email_drafts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_drafts_user ON public.email_drafts USING btree (user_id);
--
-- Name: idx_email_messages_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_account ON public.email_messages USING btree (account_id);
--
-- Name: idx_email_messages_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_account_id ON public.email_messages USING btree (account_id);
--
-- Name: idx_email_messages_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_date ON public.email_messages USING btree (date DESC);
--
-- Name: idx_email_messages_folder; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_folder ON public.email_messages USING btree (folder);
--
-- Name: idx_email_messages_thread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_thread ON public.email_messages USING btree (thread_id);
--
-- Name: idx_email_messages_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_user ON public.email_messages USING btree (user_id);
--
-- Name: idx_email_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_user_id ON public.email_messages USING btree (user_id);
--
-- Name: idx_enquiries_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enquiries_created_at ON public.enquiries USING btree (created_at DESC);
--
-- Name: idx_enquiries_resume_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enquiries_resume_token ON public.enquiries USING btree (resume_token);
--
-- Name: idx_enquiries_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enquiries_status ON public.enquiries USING btree (status);
--
-- Name: idx_knowledge_base_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_base_author ON public.knowledge_base USING btree (author_id);
--
-- Name: idx_knowledge_base_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_base_category ON public.knowledge_base USING btree (category);
--
-- Name: idx_knowledge_base_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_base_status ON public.knowledge_base USING btree (status);
--
-- Name: idx_kpi_goals_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_goals_user ON public.kpi_goals USING btree (user_id);
--
-- Name: idx_lead_notes_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes USING btree (lead_id);
--
-- Name: idx_lead_status_history_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_status_history_lead_id ON public.lead_status_history USING btree (lead_id);
--
-- Name: idx_leads_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_assigned_to ON public.leads USING btree (assigned_to);
--
-- Name: idx_leads_business_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_business_name ON public.leads USING btree (business_name);
--
-- Name: idx_leads_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_email ON public.leads USING btree (email);
--
-- Name: idx_leads_enquiry_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_enquiry_id ON public.leads USING btree (enquiry_id);
--
-- Name: idx_leads_location_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_location_city ON public.leads USING btree (location_city);
--
-- Name: idx_leads_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_phone ON public.leads USING btree (phone);
--
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_status ON public.leads USING btree (status);
--
-- Name: idx_lifecycle_history_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lifecycle_history_entity ON public.crm_lifecycle_history USING btree (entity_type, entity_id);
--
-- Name: idx_marketing_page_views_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketing_page_views_created_at ON public.marketing_page_views USING btree (created_at DESC);
--
-- Name: idx_marketing_page_views_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketing_page_views_path ON public.marketing_page_views USING btree (path);
--
-- Name: idx_marketing_page_views_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketing_page_views_session ON public.marketing_page_views USING btree (session_id);
--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);
--
-- Name: idx_messages_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_recipient ON public.messages USING btree (recipient_id);
--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);
--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);
--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);
--
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read) WHERE (is_read = false);
--
-- Name: idx_office_documents_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_office_documents_type ON public.office_documents USING btree (document_type);
--
-- Name: idx_office_documents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_office_documents_user_id ON public.office_documents USING btree (user_id);
--
-- Name: idx_planner_tasks_assigned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_tasks_assigned ON public.planner_tasks USING btree (assigned_to);
--
-- Name: idx_planner_tasks_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_tasks_due ON public.planner_tasks USING btree (due_date);
--
-- Name: idx_planner_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_tasks_status ON public.planner_tasks USING btree (status);
--
-- Name: idx_planner_tasks_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_tasks_team_id ON public.planner_tasks USING btree (team_id);
--
-- Name: idx_planner_tasks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_tasks_user_id ON public.planner_tasks USING btree (user_id);
--
-- Name: idx_platform_files_folder; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_files_folder ON public.platform_files USING btree (folder_path);
--
-- Name: idx_platform_files_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_files_source ON public.platform_files USING btree (app_source, source_id);
--
-- Name: idx_platform_files_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_files_type ON public.platform_files USING btree (file_type);
--
-- Name: idx_platform_files_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_files_user ON public.platform_files USING btree (user_id);
--
-- Name: idx_platform_folders_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_folders_path ON public.platform_folders USING btree (user_id, parent_path);
--
-- Name: idx_platform_folders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_folders_user ON public.platform_folders USING btree (user_id);
--
-- Name: idx_poll_votes_poll_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes USING btree (poll_id);
--
-- Name: idx_poll_votes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_poll_votes_user_id ON public.poll_votes USING btree (user_id);
--
-- Name: idx_product_variants_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_variants_product ON public.product_variants USING btree (product_id);
--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);
--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_status ON public.products USING btree (status);
--
-- Name: idx_products_user_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_user_site ON public.products USING btree (user_id, site_id);
--
-- Name: idx_profiles_2fa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_2fa ON public.profiles USING btree (two_factor_enabled);
--
-- Name: idx_profiles_enquiry_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_enquiry_id ON public.profiles USING btree (enquiry_id);
--
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);
--
-- Name: idx_profiles_verification_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_verification_token ON public.profiles USING btree (verification_token) WHERE (verification_token IS NOT NULL);
--
-- Name: idx_proposals_crm_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposals_crm_company ON public.proposals USING btree (crm_company_id);
--
-- Name: idx_pw_vault_configs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pw_vault_configs_user ON public.password_vault_configs USING btree (user_id);
--
-- Name: idx_pw_vault_items_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pw_vault_items_user ON public.password_vault_items USING btree (user_id);
--
-- Name: idx_pw_vault_items_vault; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pw_vault_items_vault ON public.password_vault_items USING btree (vault_id);
--
-- Name: idx_rate_limits_key_endpoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limits_key_endpoint ON public.rate_limits USING btree (key, endpoint);
--
-- Name: idx_rate_limits_window; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limits_window ON public.rate_limits USING btree (window_start);
--
-- Name: idx_rbac_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_audit_log_created_at ON public.rbac_audit_log USING btree (created_at DESC);
--
-- Name: idx_rbac_audit_log_performed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_audit_log_performed_by ON public.rbac_audit_log USING btree (performed_by);
--
-- Name: idx_rbac_permissions_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_permissions_module ON public.rbac_permissions USING btree (module);
--
-- Name: idx_rbac_permissions_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_permissions_role_id ON public.rbac_permissions USING btree (role_id);
--
-- Name: idx_rbac_roles_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_roles_position ON public.rbac_roles USING btree ("position" DESC);
--
-- Name: idx_rbac_user_roles_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_user_roles_role_id ON public.rbac_user_roles USING btree (role_id);
--
-- Name: idx_rbac_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_user_roles_user_id ON public.rbac_user_roles USING btree (user_id);
--
-- Name: idx_resource_allocations_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_allocations_project ON public.resource_allocations USING btree (project_id);
--
-- Name: idx_resource_allocations_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_allocations_user ON public.resource_allocations USING btree (user_id);
--
-- Name: idx_resource_allocations_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_allocations_week ON public.resource_allocations USING btree (week_start);
--
-- Name: idx_security_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_logs_created_at ON public.security_logs USING btree (created_at DESC);
--
-- Name: idx_security_logs_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_logs_event_type ON public.security_logs USING btree (event_type);
--
-- Name: idx_security_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_logs_user_id ON public.security_logs USING btree (user_id);
--
-- Name: idx_site_bookings_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_bookings_date ON public.site_bookings USING btree (site_id, booking_date);
--
-- Name: idx_site_carts_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_carts_session ON public.site_carts USING btree (session_id);
--
-- Name: idx_site_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_orders_user ON public.site_orders USING btree (user_id, site_id);
--
-- Name: idx_site_visitors_site_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_visitors_site_email ON public.site_visitors USING btree (site_id, email);
--
-- Name: idx_subscription_site_events_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_site_events_site ON public.subscription_site_events USING btree (subscription_site_id, occurred_at DESC);
--
-- Name: idx_subscription_sites_hosting_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_sites_hosting_status ON public.subscription_sites USING btree (hosting_status);
--
-- Name: idx_subscription_sites_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_sites_owner ON public.subscription_sites USING btree (owner_user_id);
--
-- Name: idx_subscription_sites_renewal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_sites_renewal ON public.subscription_sites USING btree (next_renewal_date);
--
-- Name: idx_subscription_sites_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_sites_status ON public.subscription_sites USING btree (status);
--
-- Name: idx_support_tickets_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_created_at ON public.support_tickets USING btree (created_at DESC);
--
-- Name: idx_support_tickets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);
--
-- Name: idx_support_tickets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);
--
-- Name: idx_team_memberships_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_memberships_team_id ON public.team_memberships USING btree (team_id);
--
-- Name: idx_team_memberships_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_memberships_user_id ON public.team_memberships USING btree (user_id);
--
-- Name: idx_ual_feature; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ual_feature ON public.user_activity_log USING btree (user_id, feature_name);
--
-- Name: idx_ual_user_visited; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ual_user_visited ON public.user_activity_log USING btree (user_id, visited_at DESC);
--
-- Name: idx_user_connections_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_connections_provider ON public.user_connections USING btree (user_id, provider);
--
-- Name: idx_user_connections_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_connections_user_id ON public.user_connections USING btree (user_id);
--
-- Name: idx_user_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);
--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);
--
-- Name: idx_vault_configs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vault_configs_user ON public.vault_configs USING btree (user_id);
--
-- Name: idx_vault_items_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vault_items_user ON public.vault_items USING btree (user_id);
--
-- Name: idx_whitelisted_ips_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whitelisted_ips_ip ON public.whitelisted_ips USING btree (ip_address);
--
-- Name: acc_accounting_periods acc_accounting_periods_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_accounting_periods_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_accounting_periods FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ap_bill_lines_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_ap_bill_lines FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_ap_bills acc_ap_bills_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ap_bills_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_ap_bills FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_ap_payments acc_ap_payments_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ap_payments_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_ap_payments FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ar_invoice_lines_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_ar_invoice_lines FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_ar_invoices acc_ar_invoices_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ar_invoices_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_ar_invoices FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_ar_payments acc_ar_payments_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ar_payments_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_ar_payments FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_bank_reconciliations acc_bank_reconciliations_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_bank_reconciliations_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_bank_reconciliations FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_bank_transactions acc_bank_transactions_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_bank_transactions_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_bank_transactions FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_chart_of_accounts acc_chart_of_accounts_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_chart_of_accounts_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_chart_of_accounts FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_chart_of_accounts acc_coa_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_coa_touch BEFORE UPDATE ON public.acc_chart_of_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_customers acc_customers_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_customers_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_customers FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_depreciation_runs acc_depreciation_runs_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_depreciation_runs_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_depreciation_runs FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_fixed_assets acc_fixed_assets_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_fixed_assets_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_fixed_assets FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_accountant_invites acc_inv_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_inv_touch BEFORE UPDATE ON public.acc_accountant_invites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_journal_entries acc_je_append_only; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_je_append_only BEFORE DELETE OR UPDATE ON public.acc_journal_entries FOR EACH ROW EXECUTE FUNCTION public.acc_block_posted_entry_mutation();
--
-- Name: acc_journal_entries acc_je_balanced; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_je_balanced BEFORE INSERT OR UPDATE ON public.acc_journal_entries FOR EACH ROW EXECUTE FUNCTION public.acc_check_entry_balanced();
--
-- Name: acc_journal_entries acc_je_period_lock; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_je_period_lock BEFORE INSERT OR UPDATE ON public.acc_journal_entries FOR EACH ROW EXECUTE FUNCTION public.acc_enforce_period_lock();
--
-- Name: acc_journal_entries acc_je_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_je_touch BEFORE UPDATE ON public.acc_journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_journal_lines acc_jl_append_only; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_jl_append_only BEFORE DELETE OR UPDATE ON public.acc_journal_lines FOR EACH ROW EXECUTE FUNCTION public.acc_block_posted_line_mutation();
--
-- Name: acc_journal_entries acc_journal_entries_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_journal_entries_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_journal_entries FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_journal_lines acc_journal_lines_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_journal_lines_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_journal_lines FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_organizations acc_org_after_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_org_after_insert AFTER INSERT ON public.acc_organizations FOR EACH ROW EXECUTE FUNCTION public.acc_after_org_insert();
--
-- Name: acc_organizations acc_org_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_org_touch BEFORE UPDATE ON public.acc_organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_accounting_periods acc_per_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_per_touch BEFORE UPDATE ON public.acc_accounting_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_suppliers acc_suppliers_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_suppliers_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_suppliers FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: acc_user_roles acc_ur_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_ur_touch BEFORE UPDATE ON public.acc_user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_vat_returns acc_vat_returns_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acc_vat_returns_audit AFTER INSERT OR DELETE OR UPDATE ON public.acc_vat_returns FOR EACH ROW EXECUTE FUNCTION public.acc_log_change();
--
-- Name: ecommerce_orders ecommerce_orders_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ecommerce_orders_touch BEFORE UPDATE ON public.ecommerce_orders FOR EACH ROW EXECUTE FUNCTION public.ecommerce_orders_touch();
--
-- Name: ecommerce_settings ecommerce_settings_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ecommerce_settings_touch BEFORE UPDATE ON public.ecommerce_settings FOR EACH ROW EXECUTE FUNCTION public.ecommerce_settings_touch();
--
-- Name: blocked_ips encrypt_blocked_ip_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER encrypt_blocked_ip_trigger BEFORE INSERT OR UPDATE ON public.blocked_ips FOR EACH ROW EXECUTE FUNCTION public.encrypt_blocked_ip();
--
-- Name: enquiries encrypt_enquiry_pii_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER encrypt_enquiry_pii_trigger BEFORE INSERT OR UPDATE ON public.enquiries FOR EACH ROW EXECUTE FUNCTION public.encrypt_enquiry_pii();
--
-- Name: leads encrypt_lead_pii_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER encrypt_lead_pii_trigger BEFORE INSERT OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.encrypt_lead_pii();
--
-- Name: profiles encrypt_profile_pii_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER encrypt_profile_pii_trigger BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.encrypt_profile_pii();
--
-- Name: security_logs encrypt_security_log_ip_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER encrypt_security_log_ip_trigger BEFORE INSERT OR UPDATE ON public.security_logs FOR EACH ROW EXECUTE FUNCTION public.encrypt_security_log_ip();
--
-- Name: whitelisted_ips encrypt_whitelisted_ip_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER encrypt_whitelisted_ip_trigger BEFORE INSERT OR UPDATE ON public.whitelisted_ips FOR EACH ROW EXECUTE FUNCTION public.encrypt_whitelisted_ip();
--
-- Name: inv_locations inv_locations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER inv_locations_updated_at BEFORE UPDATE ON public.inv_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: inv_products inv_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER inv_products_updated_at BEFORE UPDATE ON public.inv_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: inv_settings inv_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER inv_settings_updated_at BEFORE UPDATE ON public.inv_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: inv_stock_counts inv_stock_counts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER inv_stock_counts_updated_at BEFORE UPDATE ON public.inv_stock_counts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: inv_stock_levels inv_stock_levels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER inv_stock_levels_updated_at BEFORE UPDATE ON public.inv_stock_levels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: subscription_sites subscription_sites_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER subscription_sites_updated_at BEFORE UPDATE ON public.subscription_sites FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--
-- Name: client_assets track_asset_storage; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER track_asset_storage AFTER INSERT OR DELETE ON public.client_assets FOR EACH ROW EXECUTE FUNCTION public.track_storage_quota();
--
-- Name: acc_ap_bills trg_acc_ap_bills_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_ap_bills_updated BEFORE UPDATE ON public.acc_ap_bills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_ap_payments trg_acc_ap_payments_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_ap_payments_updated BEFORE UPDATE ON public.acc_ap_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_ar_invoices trg_acc_ar_invoices_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_ar_invoices_updated BEFORE UPDATE ON public.acc_ar_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_ar_payments trg_acc_ar_payments_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_ar_payments_updated BEFORE UPDATE ON public.acc_ar_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_bank_accounts trg_acc_bank_accounts_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_bank_accounts_updated BEFORE UPDATE ON public.acc_bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_bank_transactions trg_acc_bank_txn_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_bank_txn_updated BEFORE UPDATE ON public.acc_bank_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_customers trg_acc_customers_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_customers_updated BEFORE UPDATE ON public.acc_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_depreciation_runs trg_acc_dr_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_dr_updated BEFORE UPDATE ON public.acc_depreciation_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_employees trg_acc_employees_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_employees_updated_at BEFORE UPDATE ON public.acc_employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_fixed_assets trg_acc_fa_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_fa_updated BEFORE UPDATE ON public.acc_fixed_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_pay_runs trg_acc_pay_runs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_pay_runs_updated_at BEFORE UPDATE ON public.acc_pay_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_payslips trg_acc_payslips_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_payslips_updated_at BEFORE UPDATE ON public.acc_payslips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_bank_reconciliations trg_acc_recon_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_recon_updated BEFORE UPDATE ON public.acc_bank_reconciliations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_suppliers trg_acc_suppliers_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_suppliers_updated BEFORE UPDATE ON public.acc_suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_vat_returns trg_acc_vat_returns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_acc_vat_returns_updated_at BEFORE UPDATE ON public.acc_vat_returns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: crm_communications trg_crm_comm_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_comm_updated BEFORE UPDATE ON public.crm_communications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: crm_companies trg_crm_companies_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_companies_updated BEFORE UPDATE ON public.crm_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: crm_contacts trg_crm_contacts_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: crm_lifecycle_history trg_crm_dispatch_lifecycle; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_dispatch_lifecycle AFTER INSERT ON public.crm_lifecycle_history FOR EACH ROW EXECUTE FUNCTION public.crm_dispatch_lifecycle_workflows();
--
-- Name: crm_financial_links trg_crm_fin_links_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_fin_links_updated_at BEFORE UPDATE ON public.crm_financial_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: crm_lifecycle_stages trg_crm_lifecycle_stages_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_lifecycle_stages_updated BEFORE UPDATE ON public.crm_lifecycle_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: crm_opportunities trg_crm_opportunities_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_opportunities_updated BEFORE UPDATE ON public.crm_opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: crm_workflows trg_crm_workflows_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_crm_workflows_updated_at BEFORE UPDATE ON public.crm_workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_fx_rates trg_fx_rates_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fx_rates_updated BEFORE UPDATE ON public.acc_fx_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: greeting_messages trg_greeting_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_greeting_messages_updated_at BEFORE UPDATE ON public.greeting_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: comm_channels trg_set_channel_join_code; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_set_channel_join_code BEFORE INSERT ON public.comm_channels FOR EACH ROW EXECUTE FUNCTION public.set_channel_join_code();
--
-- Name: site_content trg_site_content_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: ai_messages update_ai_conversation_on_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_conversation_on_message AFTER INSERT ON public.ai_messages FOR EACH ROW EXECUTE FUNCTION public.update_ai_conversation_timestamp();
--
-- Name: app_projects update_app_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_app_projects_updated_at BEFORE UPDATE ON public.app_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: automation_rules update_automation_rules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: automation_schedules update_automation_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_automation_schedules_updated_at BEFORE UPDATE ON public.automation_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: booking_services update_booking_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_booking_services_updated_at BEFORE UPDATE ON public.booking_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: booking_settings update_booking_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_booking_settings_updated_at BEFORE UPDATE ON public.booking_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: booking_staff update_booking_staff_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_booking_staff_updated_at BEFORE UPDATE ON public.booking_staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: bookings update_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: brand_settings update_brand_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_brand_settings_updated_at BEFORE UPDATE ON public.brand_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: business_reports update_business_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_business_reports_updated_at BEFORE UPDATE ON public.business_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: cad_projects update_cad_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cad_projects_updated_at BEFORE UPDATE ON public.cad_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: calendar_events update_calendar_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: call_sessions update_call_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_call_sessions_updated_at BEFORE UPDATE ON public.call_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: client_billing update_client_billing_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_billing_updated_at BEFORE UPDATE ON public.client_billing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: client_contracts update_client_contracts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_contracts_updated_at BEFORE UPDATE ON public.client_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: client_invoices update_client_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_invoices_updated_at BEFORE UPDATE ON public.client_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: client_onboarding update_client_onboarding_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_onboarding_updated_at BEFORE UPDATE ON public.client_onboarding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: client_pricing update_client_pricing_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_pricing_updated_at BEFORE UPDATE ON public.client_pricing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: client_teams update_client_teams_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_teams_updated_at BEFORE UPDATE ON public.client_teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: cms_collections update_cms_collections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_collections_updated_at BEFORE UPDATE ON public.cms_collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: cms_entries update_cms_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_entries_updated_at BEFORE UPDATE ON public.cms_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: comm_channels update_comm_channels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comm_channels_updated_at BEFORE UPDATE ON public.comm_channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: comm_messages update_comm_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comm_messages_updated_at BEFORE UPDATE ON public.comm_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: comm_presence update_comm_presence_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comm_presence_updated_at BEFORE UPDATE ON public.comm_presence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: comm_user_settings update_comm_user_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comm_user_settings_updated_at BEFORE UPDATE ON public.comm_user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: content_requests update_content_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_content_requests_updated_at BEFORE UPDATE ON public.content_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: crm_deals update_crm_deals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_crm_deals_updated_at BEFORE UPDATE ON public.crm_deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: designer_pages update_designer_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_designer_pages_updated_at BEFORE UPDATE ON public.designer_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: designer_sites update_designer_sites_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_designer_sites_updated_at BEFORE UPDATE ON public.designer_sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: email_accounts update_email_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON public.email_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: email_drafts update_email_drafts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_drafts_updated_at BEFORE UPDATE ON public.email_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: email_messages update_email_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_messages_updated_at BEFORE UPDATE ON public.email_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: enquiries update_enquiries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_enquiries_updated_at BEFORE UPDATE ON public.enquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: inv_companies update_inv_companies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_inv_companies_updated_at BEFORE UPDATE ON public.inv_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: knowledge_base update_knowledge_base_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON public.knowledge_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: kpi_goals update_kpi_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_kpi_goals_updated_at BEFORE UPDATE ON public.kpi_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: lead_notes update_lead_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_lead_notes_updated_at BEFORE UPDATE ON public.lead_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: comm_messages update_message_thread_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_message_thread_count AFTER INSERT OR DELETE ON public.comm_messages FOR EACH ROW EXECUTE FUNCTION public.update_thread_count();
--
-- Name: notification_preferences update_notification_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: office_documents update_office_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_office_documents_updated_at BEFORE UPDATE ON public.office_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: planner_tasks update_planner_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_planner_tasks_updated_at BEFORE UPDATE ON public.planner_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: platform_files update_platform_files_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_platform_files_updated_at BEFORE UPDATE ON public.platform_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: platform_folders update_platform_folders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_platform_folders_updated_at BEFORE UPDATE ON public.platform_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: product_categories update_product_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: product_variants update_product_variants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: profiles update_profiles_last_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_last_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_profile_last_updated();
--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: proposals update_proposals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: password_vault_configs update_pw_vault_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pw_vault_configs_updated_at BEFORE UPDATE ON public.password_vault_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: password_vault_items update_pw_vault_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pw_vault_items_updated_at BEFORE UPDATE ON public.password_vault_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: rbac_roles update_rbac_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_rbac_roles_updated_at BEFORE UPDATE ON public.rbac_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: resource_allocations update_resource_allocations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_resource_allocations_updated_at BEFORE UPDATE ON public.resource_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: site_bookings update_site_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_bookings_updated_at BEFORE UPDATE ON public.site_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: site_carts update_site_carts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_carts_updated_at BEFORE UPDATE ON public.site_carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: site_deployments update_site_deployments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_deployments_updated_at BEFORE UPDATE ON public.site_deployments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: site_domains update_site_domains_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_domains_updated_at BEFORE UPDATE ON public.site_domains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: site_orders update_site_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_orders_updated_at BEFORE UPDATE ON public.site_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: site_products update_site_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_products_updated_at BEFORE UPDATE ON public.site_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: site_visitors update_site_visitors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_visitors_updated_at BEFORE UPDATE ON public.site_visitors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: social_media_accounts update_social_media_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_social_media_accounts_updated_at BEFORE UPDATE ON public.social_media_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: social_media_posts update_social_media_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_social_media_posts_updated_at BEFORE UPDATE ON public.social_media_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: sticky_walls update_sticky_walls_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sticky_walls_updated_at BEFORE UPDATE ON public.sticky_walls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: support_tickets update_support_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: team_branding update_team_branding_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_team_branding_updated_at BEFORE UPDATE ON public.team_branding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: user_branding update_user_branding_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_branding_updated_at BEFORE UPDATE ON public.user_branding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
--
-- Name: user_calendars update_user_calendars_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_calendars_updated_at BEFORE UPDATE ON public.user_calendars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: user_connections update_user_connections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON public.user_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: user_onboarding update_user_onboarding_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_onboarding_updated_at BEFORE UPDATE ON public.user_onboarding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: user_sidebar_layout update_user_sidebar_layout_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_sidebar_layout_updated_at BEFORE UPDATE ON public.user_sidebar_layout FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: vault_configs update_vault_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vault_configs_updated_at BEFORE UPDATE ON public.vault_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: vault_items update_vault_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vault_items_updated_at BEFORE UPDATE ON public.vault_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: workflows update_workflows_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
--
-- Name: acc_accountant_invites acc_accountant_invites_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_accountant_invites
    ADD CONSTRAINT acc_accountant_invites_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_accounting_periods acc_accounting_periods_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_accounting_periods
    ADD CONSTRAINT acc_accounting_periods_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bill_lines
    ADD CONSTRAINT acc_ap_bill_lines_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.acc_ap_bills(id) ON DELETE CASCADE;
--
-- Name: acc_ap_bill_lines acc_ap_bill_lines_expense_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bill_lines
    ADD CONSTRAINT acc_ap_bill_lines_expense_account_id_fkey FOREIGN KEY (expense_account_id) REFERENCES public.acc_chart_of_accounts(id);
--
-- Name: acc_ap_bills acc_ap_bills_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE SET NULL;
--
-- Name: acc_ap_bills acc_ap_bills_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;
--
-- Name: acc_ap_bills acc_ap_bills_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_ap_bills acc_ap_bills_reversal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_reversal_entry_id_fkey FOREIGN KEY (reversal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;
--
-- Name: acc_ap_bills acc_ap_bills_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_bills
    ADD CONSTRAINT acc_ap_bills_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.acc_suppliers(id) ON DELETE RESTRICT;
--
-- Name: acc_ap_payments acc_ap_payments_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_payments
    ADD CONSTRAINT acc_ap_payments_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.acc_chart_of_accounts(id);
--
-- Name: acc_ap_payments acc_ap_payments_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_payments
    ADD CONSTRAINT acc_ap_payments_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.acc_ap_bills(id) ON DELETE RESTRICT;
--
-- Name: acc_ap_payments acc_ap_payments_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_payments
    ADD CONSTRAINT acc_ap_payments_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;
--
-- Name: acc_ap_payments acc_ap_payments_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ap_payments
    ADD CONSTRAINT acc_ap_payments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoice_lines
    ADD CONSTRAINT acc_ar_invoice_lines_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.acc_ar_invoices(id) ON DELETE CASCADE;
--
-- Name: acc_ar_invoice_lines acc_ar_invoice_lines_revenue_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoice_lines
    ADD CONSTRAINT acc_ar_invoice_lines_revenue_account_id_fkey FOREIGN KEY (revenue_account_id) REFERENCES public.acc_chart_of_accounts(id);
--
-- Name: acc_ar_invoices acc_ar_invoices_client_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_client_invoice_id_fkey FOREIGN KEY (client_invoice_id) REFERENCES public.client_invoices(id) ON DELETE SET NULL;
--
-- Name: acc_ar_invoices acc_ar_invoices_crm_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_crm_company_id_fkey FOREIGN KEY (crm_company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;
--
-- Name: acc_ar_invoices acc_ar_invoices_crm_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_crm_contact_id_fkey FOREIGN KEY (crm_contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;
--
-- Name: acc_ar_invoices acc_ar_invoices_crm_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_crm_opportunity_id_fkey FOREIGN KEY (crm_opportunity_id) REFERENCES public.crm_opportunities(id) ON DELETE SET NULL;
--
-- Name: acc_ar_invoices acc_ar_invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.acc_customers(id) ON DELETE RESTRICT;
--
-- Name: acc_ar_invoices acc_ar_invoices_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;
--
-- Name: acc_ar_invoices acc_ar_invoices_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_ar_invoices acc_ar_invoices_reversal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_reversal_entry_id_fkey FOREIGN KEY (reversal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;
--
-- Name: acc_ar_invoices acc_ar_invoices_subscription_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_invoices
    ADD CONSTRAINT acc_ar_invoices_subscription_site_id_fkey FOREIGN KEY (subscription_site_id) REFERENCES public.subscription_sites(id) ON DELETE SET NULL;
--
-- Name: acc_ar_payments acc_ar_payments_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_payments
    ADD CONSTRAINT acc_ar_payments_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.acc_chart_of_accounts(id);
--
-- Name: acc_ar_payments acc_ar_payments_crm_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_payments
    ADD CONSTRAINT acc_ar_payments_crm_company_id_fkey FOREIGN KEY (crm_company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;
--
-- Name: acc_ar_payments acc_ar_payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_payments
    ADD CONSTRAINT acc_ar_payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.acc_ar_invoices(id) ON DELETE RESTRICT;
--
-- Name: acc_ar_payments acc_ar_payments_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_payments
    ADD CONSTRAINT acc_ar_payments_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;
--
-- Name: acc_ar_payments acc_ar_payments_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_ar_payments
    ADD CONSTRAINT acc_ar_payments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_audit_log acc_audit_log_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_audit_log
    ADD CONSTRAINT acc_audit_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_bank_accounts acc_bank_accounts_coa_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_accounts
    ADD CONSTRAINT acc_bank_accounts_coa_account_id_fkey FOREIGN KEY (coa_account_id) REFERENCES public.acc_chart_of_accounts(id) ON DELETE RESTRICT;
--
-- Name: acc_bank_accounts acc_bank_accounts_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_accounts
    ADD CONSTRAINT acc_bank_accounts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_bank_reconciliations acc_bank_reconciliations_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_reconciliations
    ADD CONSTRAINT acc_bank_reconciliations_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.acc_bank_accounts(id) ON DELETE CASCADE;
--
-- Name: acc_bank_reconciliations acc_bank_reconciliations_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_reconciliations
    ADD CONSTRAINT acc_bank_reconciliations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_bank_transactions acc_bank_transactions_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_transactions
    ADD CONSTRAINT acc_bank_transactions_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.acc_bank_accounts(id) ON DELETE CASCADE;
--
-- Name: acc_bank_transactions acc_bank_transactions_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_transactions
    ADD CONSTRAINT acc_bank_transactions_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;
--
-- Name: acc_bank_transactions acc_bank_transactions_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_transactions
    ADD CONSTRAINT acc_bank_transactions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_bank_transactions acc_bank_transactions_reconciliation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_bank_transactions
    ADD CONSTRAINT acc_bank_transactions_reconciliation_id_fkey FOREIGN KEY (reconciliation_id) REFERENCES public.acc_bank_reconciliations(id) ON DELETE SET NULL;
--
-- Name: acc_chart_of_accounts acc_chart_of_accounts_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_chart_of_accounts
    ADD CONSTRAINT acc_chart_of_accounts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_chart_of_accounts acc_chart_of_accounts_parent_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_chart_of_accounts
    ADD CONSTRAINT acc_chart_of_accounts_parent_account_id_fkey FOREIGN KEY (parent_account_id) REFERENCES public.acc_chart_of_accounts(id) ON DELETE SET NULL;
--
-- Name: acc_customers acc_customers_crm_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_crm_company_id_fkey FOREIGN KEY (crm_company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;
--
-- Name: acc_customers acc_customers_crm_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_crm_contact_id_fkey FOREIGN KEY (crm_contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;
--
-- Name: acc_customers acc_customers_default_ar_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_default_ar_account_id_fkey FOREIGN KEY (default_ar_account_id) REFERENCES public.acc_chart_of_accounts(id);
--
-- Name: acc_customers acc_customers_default_revenue_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_default_revenue_account_id_fkey FOREIGN KEY (default_revenue_account_id) REFERENCES public.acc_chart_of_accounts(id);
--
-- Name: acc_customers acc_customers_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_customers
    ADD CONSTRAINT acc_customers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_depreciation_lines acc_depreciation_lines_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_lines
    ADD CONSTRAINT acc_depreciation_lines_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.acc_fixed_assets(id) ON DELETE RESTRICT;
--
-- Name: acc_depreciation_lines acc_depreciation_lines_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_lines
    ADD CONSTRAINT acc_depreciation_lines_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_depreciation_lines acc_depreciation_lines_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_lines
    ADD CONSTRAINT acc_depreciation_lines_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.acc_depreciation_runs(id) ON DELETE CASCADE;
--
-- Name: acc_depreciation_runs acc_depreciation_runs_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_runs
    ADD CONSTRAINT acc_depreciation_runs_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id);
--
-- Name: acc_depreciation_runs acc_depreciation_runs_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_depreciation_runs
    ADD CONSTRAINT acc_depreciation_runs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_employees acc_employees_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_employees
    ADD CONSTRAINT acc_employees_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_fixed_assets acc_fixed_assets_accum_depr_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_accum_depr_account_id_fkey FOREIGN KEY (accum_depr_account_id) REFERENCES public.acc_chart_of_accounts(id);
--
-- Name: acc_fixed_assets acc_fixed_assets_acquisition_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_acquisition_entry_id_fkey FOREIGN KEY (acquisition_entry_id) REFERENCES public.acc_journal_entries(id);
--
-- Name: acc_fixed_assets acc_fixed_assets_asset_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_asset_account_id_fkey FOREIGN KEY (asset_account_id) REFERENCES public.acc_chart_of_accounts(id);
--
-- Name: acc_fixed_assets acc_fixed_assets_depr_expense_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_depr_expense_account_id_fkey FOREIGN KEY (depr_expense_account_id) REFERENCES public.acc_chart_of_accounts(id);
--
-- Name: acc_fixed_assets acc_fixed_assets_disposal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_disposal_entry_id_fkey FOREIGN KEY (disposal_entry_id) REFERENCES public.acc_journal_entries(id);
--
-- Name: acc_fixed_assets acc_fixed_assets_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fixed_assets
    ADD CONSTRAINT acc_fixed_assets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_fx_rates acc_fx_rates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fx_rates
    ADD CONSTRAINT acc_fx_rates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
--
-- Name: acc_fx_rates acc_fx_rates_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_fx_rates
    ADD CONSTRAINT acc_fx_rates_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_journal_entries acc_journal_entries_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_entries
    ADD CONSTRAINT acc_journal_entries_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_journal_entries acc_journal_entries_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_entries
    ADD CONSTRAINT acc_journal_entries_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.acc_accounting_periods(id) ON DELETE SET NULL;
--
-- Name: acc_journal_entries acc_journal_entries_reversed_by_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_entries
    ADD CONSTRAINT acc_journal_entries_reversed_by_entry_id_fkey FOREIGN KEY (reversed_by_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE SET NULL;
--
-- Name: acc_journal_lines acc_journal_lines_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_lines
    ADD CONSTRAINT acc_journal_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.acc_chart_of_accounts(id) ON DELETE RESTRICT;
--
-- Name: acc_journal_lines acc_journal_lines_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_journal_lines
    ADD CONSTRAINT acc_journal_lines_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id) ON DELETE CASCADE;
--
-- Name: acc_org_members acc_org_members_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_org_members
    ADD CONSTRAINT acc_org_members_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_pay_runs acc_pay_runs_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_pay_runs
    ADD CONSTRAINT acc_pay_runs_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.acc_journal_entries(id);
--
-- Name: acc_pay_runs acc_pay_runs_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_pay_runs
    ADD CONSTRAINT acc_pay_runs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_pay_runs acc_pay_runs_payment_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_pay_runs
    ADD CONSTRAINT acc_pay_runs_payment_entry_id_fkey FOREIGN KEY (payment_entry_id) REFERENCES public.acc_journal_entries(id);
--
-- Name: acc_payslips acc_payslips_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_payslips
    ADD CONSTRAINT acc_payslips_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.acc_employees(id) ON DELETE RESTRICT;
--
-- Name: acc_payslips acc_payslips_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_payslips
    ADD CONSTRAINT acc_payslips_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_payslips acc_payslips_pay_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_payslips
    ADD CONSTRAINT acc_payslips_pay_run_id_fkey FOREIGN KEY (pay_run_id) REFERENCES public.acc_pay_runs(id) ON DELETE CASCADE;
--
-- Name: acc_suppliers acc_suppliers_default_ap_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_suppliers
    ADD CONSTRAINT acc_suppliers_default_ap_account_id_fkey FOREIGN KEY (default_ap_account_id) REFERENCES public.acc_chart_of_accounts(id);
--
-- Name: acc_suppliers acc_suppliers_default_expense_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_suppliers
    ADD CONSTRAINT acc_suppliers_default_expense_account_id_fkey FOREIGN KEY (default_expense_account_id) REFERENCES public.acc_chart_of_accounts(id);
--
-- Name: acc_suppliers acc_suppliers_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_suppliers
    ADD CONSTRAINT acc_suppliers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_user_roles acc_user_roles_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_user_roles
    ADD CONSTRAINT acc_user_roles_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_vat_returns acc_vat_returns_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_vat_returns
    ADD CONSTRAINT acc_vat_returns_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.acc_organizations(id) ON DELETE CASCADE;
--
-- Name: acc_vat_returns acc_vat_returns_payment_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_vat_returns
    ADD CONSTRAINT acc_vat_returns_payment_entry_id_fkey FOREIGN KEY (payment_entry_id) REFERENCES public.acc_journal_entries(id);
--
-- Name: acc_vat_returns acc_vat_returns_submission_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acc_vat_returns
    ADD CONSTRAINT acc_vat_returns_submission_entry_id_fkey FOREIGN KEY (submission_entry_id) REFERENCES public.acc_journal_entries(id);
--
-- Name: ai_messages ai_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id) ON DELETE CASCADE;
--
-- Name: asset_folders asset_folders_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_folders
    ADD CONSTRAINT asset_folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.asset_folders(id) ON DELETE CASCADE;
--
-- Name: asset_tag_assignments asset_tag_assignments_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_tag_assignments
    ADD CONSTRAINT asset_tag_assignments_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.client_assets(id) ON DELETE CASCADE;
--
-- Name: asset_tag_assignments asset_tag_assignments_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_tag_assignments
    ADD CONSTRAINT asset_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.asset_tags(id) ON DELETE CASCADE;
--
-- Name: automation_rule_logs automation_rule_logs_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rule_logs
    ADD CONSTRAINT automation_rule_logs_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.automation_rules(id) ON DELETE CASCADE;
--
-- Name: automation_rules automation_rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: billing_audit_log billing_audit_log_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_audit_log
    ADD CONSTRAINT billing_audit_log_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE SET NULL;
--
-- Name: blocked_ips blocked_ips_blocked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_ips
    ADD CONSTRAINT blocked_ips_blocked_by_fkey FOREIGN KEY (blocked_by) REFERENCES auth.users(id);
--
-- Name: booking_availability booking_availability_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_availability
    ADD CONSTRAINT booking_availability_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.booking_staff(id) ON DELETE CASCADE;
--
-- Name: booking_blocked_dates booking_blocked_dates_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_blocked_dates
    ADD CONSTRAINT booking_blocked_dates_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.booking_staff(id) ON DELETE CASCADE;
--
-- Name: booking_services booking_services_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT booking_services_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;
--
-- Name: booking_staff_services booking_staff_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_staff_services
    ADD CONSTRAINT booking_staff_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.booking_services(id) ON DELETE CASCADE;
--
-- Name: booking_staff_services booking_staff_services_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_staff_services
    ADD CONSTRAINT booking_staff_services_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.booking_staff(id) ON DELETE CASCADE;
--
-- Name: bookings bookings_rescheduled_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_rescheduled_from_fkey FOREIGN KEY (rescheduled_from) REFERENCES public.bookings(id);
--
-- Name: bookings bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.booking_services(id) ON DELETE SET NULL;
--
-- Name: bookings bookings_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE SET NULL;
--
-- Name: bookings bookings_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.booking_staff(id) ON DELETE SET NULL;
--
-- Name: brand_settings brand_settings_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_settings
    ADD CONSTRAINT brand_settings_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE CASCADE;
--
-- Name: cad_autosaves cad_autosaves_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_autosaves
    ADD CONSTRAINT cad_autosaves_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.cad_projects(id) ON DELETE SET NULL;
--
-- Name: cad_project_versions cad_project_versions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_project_versions
    ADD CONSTRAINT cad_project_versions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.cad_projects(id) ON DELETE CASCADE;
--
-- Name: calculator_history calculator_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculator_history
    ADD CONSTRAINT calculator_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: calendar_event_exceptions calendar_event_exceptions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_event_exceptions
    ADD CONSTRAINT calendar_event_exceptions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.calendar_events(id) ON DELETE CASCADE;
--
-- Name: call_sessions call_sessions_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_sessions
    ADD CONSTRAINT call_sessions_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.comm_channels(id) ON DELETE SET NULL;
--
-- Name: client_assets client_assets_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_assets
    ADD CONSTRAINT client_assets_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.asset_folders(id) ON DELETE SET NULL;
--
-- Name: client_contracts client_contracts_crm_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_crm_company_id_fkey FOREIGN KEY (crm_company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;
--
-- Name: client_contracts client_contracts_crm_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_crm_opportunity_id_fkey FOREIGN KEY (crm_opportunity_id) REFERENCES public.crm_opportunities(id) ON DELETE SET NULL;
--
-- Name: client_contracts client_contracts_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE CASCADE;
--
-- Name: client_invoices client_invoices_crm_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_invoices
    ADD CONSTRAINT client_invoices_crm_company_id_fkey FOREIGN KEY (crm_company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;
--
-- Name: client_invoices client_invoices_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_invoices
    ADD CONSTRAINT client_invoices_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE CASCADE;
--
-- Name: client_onboarding client_onboarding_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_onboarding
    ADD CONSTRAINT client_onboarding_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.crm_deals(id) ON DELETE SET NULL;
--
-- Name: client_pricing client_pricing_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_pricing
    ADD CONSTRAINT client_pricing_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.client_teams(id) ON DELETE CASCADE;
--
-- Name: cms_collections cms_collections_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_collections
    ADD CONSTRAINT cms_collections_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;
--
-- Name: cms_entries cms_entries_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_entries
    ADD CONSTRAINT cms_entries_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.cms_collections(id) ON DELETE CASCADE;
--
-- Name: cms_entries cms_entries_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_entries
    ADD CONSTRAINT cms_entries_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.designer_sites(id) ON DELETE CASCADE;
--
-- Name: comm_channel_members comm_channel_members_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channel_members
    ADD CONSTRAINT comm_channel_members_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.comm_channels(id) ON DELETE CASCADE;
--
-- Name: comm_channel_members comm_channel_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channel_members
    ADD CONSTRAINT comm_channel_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: comm_channels comm_channels_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_channels
    ADD CONSTRAINT comm_channels_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: comm_messages comm_messages_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_messages
    ADD CONSTRAINT comm_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.comm_channels(id) ON DELETE CASCADE;
--
-- Name: comm_messages comm_messages_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_messages
    ADD CONSTRAINT comm_messages_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comm_messages(id) ON DELETE SET NULL;
--
-- Name: comm_messages comm_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_messages
    ADD CONSTRAINT comm_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: comm_presence comm_presence_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_presence
    ADD CONSTRAINT comm_presence_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: comm_reactions comm_reactions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_reactions
    ADD CONSTRAINT comm_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.comm_messages(id) ON DELETE CASCADE;
--
-- Name: comm_reactions comm_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_reactions
    ADD CONSTRAINT comm_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: comm_read_receipts comm_read_receipts_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_read_receipts
    ADD CONSTRAINT comm_read_receipts_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.comm_channels(id) ON DELETE CASCADE;
