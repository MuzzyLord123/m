<!-- Platform overhaul Phase 0 · data contracts (the regression net) · 2026-07-29 -->
# DATA-CONTRACTS.md

Every request the platform UI makes. The rebuilt presentation layer must
issue byte-identical requests: same tables, column lists, payload keys,
filters, RPCs, edge functions, storage buckets, realtime channels, auth
headers and localStorage keys. Flows extracted to FLOWS.md.

---

# PART A — CLIENT PORTAL (lounge, CRM, office suite, hooks)

# CLIENT PORTAL DATA CONTRACTS (recon for presentation-only UI overhaul)
Scope: src/pages/lounge/** (incl. crm/, accounting/, ecommerce/, inventory/), src/components/lounge/**,
src/pages/CustomerDashboard.tsx, plus every src/hooks/** file imported by those (attributed to the hook file).
Client alias notes: accounting views use `const db = supabase as any`; several files use `(supabase as any)` — identical wire requests.
react-query is NOT used anywhere in scope (no queryKey/useQuery) — all fetching is manual useEffect/useState.
Conventions below: payload objects show KEYS only; filters shown as method(col).
## SHELL & SHARED COMPONENTS (src/components/lounge)
### src/components/lounge/LoungeLayout.tsx
- from('profiles').select('full_name, company, avatar_url').eq('user_id').maybeSingle() — header profile
- channel('profile-changes').on(postgres_changes UPDATE public.profiles filter user_id=eq.{uid}).subscribe() — live profile; removeChannel on unmount
- (mounts hooks: useClientPresence, useSaveCurrentAccount, useTeamCalls, useUnreadMessages)
### src/components/lounge/PortalSidebar.tsx (+ MobileDrawer/MobileBottomNav/SidebarFolderComponent/MoveToFolderSheet/FolderManagement)
- no direct calls; data via useSidebarLayout, useAccountType (see HOOKS)
### src/components/lounge/GreetingBanner.tsx
- from('greeting_messages').select('message,enabled,updated_at').eq('user_id').maybeSingle() — admin greeting
- from('profiles').select('full_name, preview_url').eq('user_id').maybeSingle() — first name
### src/components/lounge/ActivityHeatmap.tsx
- from('user_activity_log').select('visited_at, feature_name').eq('user_id').gte('visited_at').order('visited_at' asc) — heatmap
### src/components/lounge/UsageInsights.tsx
- from('user_activity_log').select('feature_name').eq('user_id').order('visited_at' desc).limit(200) — top features
- from('storage_quotas').select('used_bytes, quota_bytes').eq('user_id').maybeSingle() — storage bar
- from('user_activity_log').select('visited_at').eq('user_id').order('visited_at' desc).limit(100) — streak
### src/components/lounge/GlobalSearch.tsx
- from('app_projects').select('id, project_name, status').ilike('project_name', %q%).limit(5) — search
- from('content_requests').select('id, title, status').ilike('title', %q%).limit(5) — search
### src/components/lounge/LiveActivityFeed.tsx
- from('content_requests').select('id, title, status, updated_at').order('updated_at' desc).limit(5)
- from('app_projects').select('id, project_name, status, updated_at').order('updated_at' desc).limit(5)
- from('leads').select('id, business_name, contact_name, status, updated_at').order('updated_at' desc).limit(5)
- channel('live-dashboard-feed').on(postgres_changes * public.content_requests).on(* public.app_projects).on(* public.leads).subscribe()
### src/components/lounge/OnboardingWizard.tsx
- from('user_onboarding').select('*').eq('user_id').maybeSingle(); insert({user_id}).select().single() if absent
- from('user_onboarding').update({dismissed:true}).eq('user_id') — dismiss
- from('user_onboarding').update({[step.dbField]:true}).eq('user_id') — mark step (dynamic boolean column)
### src/components/lounge/SubscriptionPaywall.tsx
- invoke('check-subscriptions-plan', body {productId}, header Authorization:Bearer session) — gate check
- invoke('create-subscriptions-checkout', body {priceId}, header Authorization) — upgrade checkout
### src/components/lounge/ConnectionsSettings.tsx
- from('user_connections').select('provider, credentials, is_connected, connected_at').eq('user_id') — list
- from('user_connections').upsert({user_id, provider, credentials, is_connected, connected_at}, onConflict 'user_id,provider') — save
- from('profiles').update({phone}).eq('user_id') — phone from connection fields
- from('user_connections').delete().eq('user_id').eq('provider') — disconnect
- invoke('google-calendar-auth', {action:'get_auth_url', redirect_uri}) — OAuth start
## TOP-LEVEL PAGES
### src/pages/CustomerDashboard.tsx
- from('customer_uploads').select('*').order('created_at' desc) — list
- storage.from('customer-uploads').upload(fileName, file) — upload
- from('customer_uploads').insert({user_id, title, notes, image_url}) — record
- from('customer_uploads').delete().eq('id'); storage.from('customer-uploads').remove([path]) — delete
### src/pages/lounge/LoungeOverview.tsx (uses useActivityLogger)
- from('profiles').select('full_name, company, plan, website_status, preview_url, customer_id').eq('user_id').maybeSingle()
- from('app_projects').select('id, status, project_name, updated_at').order('created_at' desc)
- from('content_requests').select('id, status, title, updated_at')
- from('announcements').select('id, title, content, priority, created_at').eq('is_active', true).order('created_at' desc)
- from('leads').select('id', {count:'exact', head:true}) — lead count
- from('conversations').select('id', {count:'exact', head:true}).eq('customer_id') — convo count
- from('client_billing').select('payment_status').eq('user_id').maybeSingle()
### src/pages/lounge/LoungeBilling.tsx (uses useClientPricing)
- invoke('check-subscriptions-plan', {productId}, Authorization header) — per-plan subscribed check
- invoke('create-subscriptions-checkout', {priceId}, Authorization) — checkout
- invoke('subscriptions-customer-portal', Authorization only) — Stripe portal
- from('client_billing').select('*').eq('user_id').maybeSingle() — fetch
- from('client_billing').update({plan_name, plan_price, add_ons, one_off_charges, payment_status:'pending'}).eq('id') (×2 flows)
- from('client_billing').insert({user_id, plan_name, plan_price, add_ons, services:[], one_off_charges, payment_status:'pending'}) (×2 flows)
### src/pages/lounge/LoungeSettings.tsx
- from('profiles').select('full_name, company, phone, email, avatar_url, customer_id, industry').eq('user_id').single()
- from('profiles').update({full_name, company, phone, industry}).eq('user_id') — save profile
- storage.from('avatars').remove([oldPath]); .upload(fileName, file, {upsert:true}); .getPublicUrl(fileName)
- from('profiles').update({avatar_url}).eq('user_id'); update({avatar_url:null}) + remove([filePath]) — avatar set/remove
### src/pages/lounge/LoungeMessages.tsx (uses useTypingIndicator)
- channel('client-messages').on(postgres_changes INSERT public.messages).subscribe() — live chat
- rpc('get_primary_admin_id') — find admin inbox
- from('messages').select('*').or(and(sender_id.eq.{uid},recipient_id.eq.{admin}),and(sender_id.eq.{admin},recipient_id.eq.{uid})).order('created_at' asc)
- from('messages').update({is_read:true}).eq('sender_id',admin).eq('recipient_id',uid).eq('is_read',false)
- from('messages').insert({sender_id, recipient_id, content}) — send
### src/pages/lounge/LoungeTickets.tsx
- from('support_tickets').select('*').eq('user_id').order('created_at' desc)
- rpc('get_primary_admin_id'); from('messages').insert({sender_id, recipient_id, content:"[Ticket]..."})
- rpc('generate_ticket_reference'); from('support_tickets').insert({user_id, reference_id, subject, message, priority, status:'open'}).select().single()
### src/pages/lounge/LoungeAI.tsx
- from('ai_conversations').select('*').eq('user_id').order('updated_at' desc); insert({user_id, title:'New conversation'}).select().single(); update({title}).eq('id'); update({is_archived}).eq('id'); delete().eq('id')
- from('ai_messages').select('*').eq('conversation_id').order('created_at' asc); insert({conversation_id, role:'user'|'assistant', content}).select().single() (×2)
- raw fetch POST {VITE_SUPABASE_URL}/functions/v1/quooro-chat headers {apikey, Authorization:Bearer session} body {messages, context:'lounge'} — streaming chat
- rpc('get_primary_admin_id'); from('messages').insert({sender_id, recipient_id, content}).select().single() — escalate to human
- rpc('generate_ticket_reference'); from('support_tickets').insert({user_id, reference_id, subject, message, priority:'standard', status:'open', ai_conversation_id, message_id})
### src/pages/lounge/LoungeAIIntelligence.tsx
- from('app_projects').select('status, created_at').eq('user_id'); from('crm_deals').select('stage, deal_value, created_at').eq('user_id'); from('client_invoices').select('total_amount, status, created_at'); from('content_requests').select('status, created_at').eq('user_id'); from('kpi_goals').select('*').eq('user_id'); from('business_reports').select('*').eq('user_id').order('created_at' desc).limit(10) — metrics batch
- from('kpi_goals').insert({user_id, metric_name, target_value, unit}); delete().eq('id')
- raw fetch POST functions/v1/quooro-chat, Authorization:Bearer PUBLISHABLE_KEY, body {messages:[system+user]} — BI Q&A stream
### src/pages/lounge/LoungeAIBuilder.tsx (uses useUserRole)
- invoke('check-designer-subscription'); invoke('create-designer-checkout')
- invoke('ai-website-builder', {prompt, mode})
- from('designer_sites').insert({site_name, user_id}).select().single()
- from('designer_pages').insert({site_id, user_id, page_name, slug, is_homepage, elements, sort_order}) — per generated page
### src/pages/lounge/LoungeWebsiteDesigner.tsx (uses useUserRole)
- invoke('check-designer-subscription'); invoke('create-designer-checkout'); invoke('designer-customer-portal')
- from('designer_sites').select('*').order('updated_at' desc)
- from('designer_sites').insert({site_name, description, user_id, template_id}).select().single()
- from('designer_pages').insert(pageInserts[{site_id, user_id, page_name, slug, is_homepage, sort_order, elements}]) or single Home row {site_id, user_id, page_name:'Home', slug:'/', is_homepage:true, elements}
- from('designer_sites').delete().eq('id'); delete().in('id', ids) — single/bulk delete
### src/pages/lounge/LoungeWorkshop.tsx (uses useUserRole)
- invoke('check-designer-subscription')
- from('designer_sites').insert({site_name:'Untitled Site', user_id}).select().single()
- from('designer_pages').insert([{site_id, user_id, page_name:'Home', slug:'/', is_homepage:true}])
### src/pages/lounge/WebsiteEditor.tsx (uses useSitePublish; save-to-files via components/files)
- from('designer_sites').select('site_name').eq('id').single()
- from('designer_pages').select('id').eq('site_id').order('sort_order' asc).limit(1)
- from('designer_pages').select('page_name, slug, is_homepage, elements, seo_title, seo_description, page_settings').eq('site_id').order('sort_order') — publish payload source
### src/pages/lounge/SiteSettingsPage.tsx
- from('designer_sites').select('site_name, settings').eq('id').single(); update({site_name, settings, updated_at}).eq('id'); delete().eq('id')
- storage.from('designer-uploads').upload(path, file, {upsert:true}); .getPublicUrl(path) — favicon/og image
### src/pages/lounge/LoungeWebsiteManagement.tsx
- from('profiles').select('full_name, company, plan, page_count, website_status, preview_url, customer_id, created_at, site_published_at, domain_name, ssl_status, hosting_provider, last_updated_at, site_files_url, version_history').eq('user_id').maybeSingle()
- from('content_requests').select('id, title, description, status, created_at').eq('user_id').eq('request_type','website_section').order('created_at' desc).limit(5)
- from('content_requests').insert({user_id, request_type:'website_section', title, description}) — change request
### src/pages/lounge/LoungeContentRequests.tsx
- from('content_requests').select('*').eq('user_id').order('created_at' desc)
- storage.from('content-requests').upload(fileName, file); .getPublicUrl(fileName)
- from('content_requests').insert({user_id, request_type, title, description, reference_urls, reference_files, scheduled_date, priority})
### src/pages/lounge/LoungeAppProjects.tsx
- from('app_projects').select('*').order('created_at' desc)
- from('content_requests').insert({user_id, request_type:'app_change', title, description}) — change request
### src/pages/lounge/LoungeUploads.tsx
- identical contract to CustomerDashboard: customer_uploads select/insert/delete + storage customer-uploads upload/remove
### src/pages/lounge/LoungeAssetStorage.tsx
- from('asset_folders').select('*').order('name'); from('asset_tags').select('*').order('name'); from('client_assets').select('*').order('created_at' desc); from('storage_quotas').select('*').eq('user_id').single() — initial load
- storage.from('client-assets').upload(filePath, file)
- from('client_assets').insert({user_id, folder_id, file_name, original_name, file_path, file_type, file_size, mime_type, description}).select().single()
- from('asset_tag_assignments').insert([{asset_id, tag_id}...])
- from('asset_folders').insert({user_id, name, parent_id, color}); from('asset_tags').insert({user_id, name, color})
- storage.from('client-assets').createSignedUrl(file_path, 60) — download; createSignedUrl(file_path, 300) — preview
- from('client_assets').update({download_count, last_accessed_at}).eq('id'); update({is_starred}).eq('id')
- storage.from('client-assets').remove([file_path]); from('client_assets').delete().eq('id'); from('asset_folders').delete().eq('id')
### src/pages/lounge/LoungeMail.tsx
- from('user_connections').select('provider, credentials').eq('user_id').in('provider',['gmail_oauth','outlook_oauth'])
- from('user_connections').select('id, credentials').eq('user_id').eq('provider').maybeSingle(); update({credentials, is_connected, connected_at}).eq('id') or insert({user_id, provider, credentials, is_connected, connected_at})
- channel('email-updates').on(* public.email_messages filter user_id=eq).on(* public.email_accounts filter user_id=eq).subscribe()
- from('email_accounts').select('*').order('created_at'); select('id').eq('email_address').single(); delete().eq('id')
- from('email_messages').select('*').order('date' desc).limit(200); update({is_starred}).eq('id'); update({is_read:true}).eq('id')
- invoke('email-oauth', {action:'exchange_code', provider, code, redirectUri}); invoke('email-oauth', {action:'get_auth_url', provider, redirectUri})
- invoke('email-sync', {action:'sync', accountId}); invoke('email-sync', {action:'send', accountId, updates:{to, subject, body}})
### src/pages/lounge/LoungeCRM.tsx (uses useCRMDeals, useProposals, useUserRole)
- from('leads').select('*').order('updated_at' desc).limit(10000)
- from('lead_notes').select('*').eq('lead_id').order('created_at' desc) (×2); insert({lead_id, content, author_id})
- from('lead_status_history').select('*').eq('lead_id').order('changed_at' desc) (×2); insert({lead_id, old_status, new_status, changed_by})
- from('leads').update({status}).eq('id'); update({business_name, contact_name, email, phone, website_url, category, location_city}).eq('id'); delete().eq('id')
- from('leads').insert({business_name, personal_name, contact_name, email, phone, website_url, category, location_city, location_postcode, status, source, is_personal, assigned_to})
- from('leads').insert(chunk) — CSV import, 50-row chunks, keys via user column mapping + defaults {status:'new', source:'csv_import', assigned_to}
### src/pages/lounge/LoungeTeam.tsx
- from('client_teams').select('*').eq('primary_account_id').single(); from('team_memberships').select('*, client_teams(*)').eq('user_id').single() — resolve team
- from('team_memberships').select('*').eq('team_id').order('joined_at' asc); per member from('profiles').select('email, full_name, avatar_url, two_factor_enabled').eq('user_id').single()
- from('profiles').select('full_name, company').eq('user_id').single(); rpc('generate_team_code')
- from('client_teams').insert({primary_account_id, team_code, team_name}).select().single(); from('team_memberships').insert({team_id, user_id, member_role:'owner', display_name})
- from('team_memberships').update({member_role}).eq('id') (×2); delete().eq('id')
- invoke('create-team-member', {email, password, fullName, phone, memberRole, teamId})
- from('comm_channels').select('id, name, channel_type, join_code, is_archived').eq('is_archived',false).order('name')
- from('comm_channel_members').select('channel_id, role, is_muted, notification_preference').eq('user_id') (×2); upsert({channel_id, user_id, role:'member'}, onConflict 'channel_id,user_id'); delete().eq('channel_id').eq('user_id'); update({is_muted}).eq('channel_id').eq('user_id')
### src/pages/lounge/LoungeWhiteLabel.tsx
- from('brand_settings').select('*').eq('user_id').maybeSingle(); select('id').eq('user_id').maybeSingle(); update(payload).eq('user_id') or insert(payload) — payload keys {logo_url, primary_color, secondary_color, accent_color, company_name, custom_domain, email_header_url, login_background_url, report_template, user_id}
- from('app_projects').select('*').eq('user_id').limit(20)
- from('user_branding').select('logo_url, hide_platform_badge').eq('user_id').maybeSingle(); select('id').eq('user_id').maybeSingle() (×2); update({logo_url})/insert({user_id, logo_url, hide_platform_badge}); update({logo_url:null}); update({hide_platform_badge})/insert({user_id, hide_platform_badge}); member push: select('id').eq('user_id',memberId), update({logo_url})/insert({user_id, logo_url})
- from('client_teams').select('id').eq('primary_account_id').maybeSingle(); from('team_branding').select('default_logo_url').eq('manager_id').maybeSingle(); select('id').eq('manager_id'); update({default_logo_url})/insert({manager_id, default_logo_url}); update({default_logo_url:null})
- from('team_memberships').select('user_id, display_name, member_role').eq('team_id'); from('profiles').select('user_id, full_name, email, avatar_url').in('user_id'); from('user_branding').select('user_id, logo_url').in('user_id')
- storage.from('branding-assets').upload(path, file, {upsert:true}) + getPublicUrl(path) (×2: personal + team logo)
### src/pages/lounge/LoungeAutomationsPro.tsx
- from('automation_runs').select('*').eq('user_id').order('created_at' desc).limit(50)
- from('automation_schedules').select('*').eq('user_id').order('created_at' desc); insert({user_id, schedule_name, cron_expression}); update({is_active}).eq('id'); delete().eq('id')
- from('api_keys').select('*').eq('user_id').order('created_at' desc); insert({user_id, key_name, key_prefix, key_hash}); delete().eq('id')
### src/pages/lounge/LoungeSEOChecker.tsx
- invoke('seo-scrape', {url}) — ×4 variants (page, analytics URL, /sitemap.xml, /robots.txt)
### src/pages/lounge/LoungeCADStudio.tsx
- from('cad_projects').select('*').eq('user_id').eq('is_template',false).order(sortField dynamic)
- from('cad_projects').insert({user_id, name, description, units, folder, drawing_data, entity_count, layer_count}).select().single() — create
- from('cad_projects').insert({user_id, name+' (Copy)', description, drawing_data, entity_count, layer_count, units, folder, tags}) — duplicate
- from('cad_projects').update({name}).eq('id'); delete().eq('id')
### src/pages/lounge/LoungeProducts.tsx
- from('products').select('*').eq('user_id').order('sort_order' asc); from('product_categories').select('*').eq('user_id').order('sort_order' asc); from('designer_sites').select('id, site_name').eq('user_id')
- from('products').insert/update(payload).eq('id') — payload = full Product form {name, slug, description, short_description, price, compare_at_price, cost_price, currency, sku, barcode, track_inventory, inventory_count, weight, weight_unit, status, is_featured, is_digital, images, tags, category_id, site_id, user_id}
- from('products').delete().eq('id'); insert({...rest, name:'(Copy)', slug:'-copy-', status:'draft', user_id}) — duplicate; update({status}).eq('id'); update({is_featured}).eq('id')
- from('product_categories').insert/update({...form, slug, user_id}).eq('id'); delete().eq('id')
- from('product_variants').select('*').eq('product_id').order('sort_order'); insert/update({...form, product_id}).eq('id'); delete().eq('id')
- from('site_orders').select('*').eq('user_id').order('created_at' desc) — orders tab
### src/pages/lounge/LoungeAdManagement.tsx
- from('ad_campaigns').select('*').order('created_at' desc) — read-only list
### src/pages/lounge/LoungeSocialMedia.tsx
- from('social_media_accounts').select('*').order('created_at' desc); from('social_media_posts').select('*').order('scheduled_at' asc) — read-only
### src/pages/lounge/LoungeMarketingCalendar.tsx
- from('ad_campaigns').select('*').order('start_date' desc); from('social_media_posts').select('*').order('scheduled_at' desc); from('content_requests').select('*').order('created_at' desc) — read-only
### src/pages/lounge/GoogleCalendarCallback.tsx
- invoke('google-calendar-auth', {action:'exchange_code', code, redirect_uri})
### src/pages/lounge/LoungeInventory.tsx (legacy all-in-one)
- from('inv_companies').select('*').eq('user_id').order('updated_at' desc); insert({user_id, name, description, address}).select().single(); delete().eq('id'); delete().in('id'); select('name').eq('id').single()
- from('inv_products').select('id, company_id, cost_price, reorder_level, inv_stock_levels(quantity)').eq('user_id').eq('is_active',true) — overview stats
- from('inv_settings').select('*').eq('user_id').maybeSingle(); insert({user_id}); from('inv_locations').select('id').eq('user_id').limit(1).maybeSingle(); insert({user_id, name:'Main Warehouse', is_default:true, is_active:true}) — bootstrap
- from('inv_products').select('*, inv_categories(name), inv_stock_levels(quantity)').eq('user_id').eq('company_id').eq('is_active',true).order('name')
- from('inv_categories').select('*').eq('user_id').order('name'); from('inv_locations').select('*').eq('user_id').eq('is_active',true)
- from('inv_stock_movements').select('*, inv_products(name, sku)').eq('user_id').order('created_at' desc).limit(50); insert({product_id, location_id, user_id, movement_type:'adjustment', quantity, reason})
- from('inv_products').update({is_active:false}).eq('id'); update({name, sku, description, cost_price, selling_price, reorder_level, reorder_qty, supplier_name, supplier_contact, unit}).eq('id'); insert({user_id, company_id, name, sku, barcode, description, category_id, unit, reorder_level, reorder_qty, cost_price, selling_price, supplier_name, supplier_contact, lead_time_days}).select().single()
- from('inv_stock_levels').insert({product_id, location_id, quantity:0}); select('*').eq('product_id').eq('location_id').maybeSingle(); update({quantity}).eq('id'); insert({product_id, location_id, quantity})
## INVENTORY SUBPAGES (src/pages/lounge/inventory)
### InventoryProducts.tsx
- from('inv_products').select('*, inv_categories(name), inv_stock_levels(quantity)').eq('user_id').eq('is_active',true).order('name'); from('inv_categories').select('*').eq('user_id').order('name'); from('inv_locations').select('*').eq('user_id').eq('is_active',true)
- from('inv_categories').insert({user_id, name}).select().single()
- from('inv_products').update/insert(payload {user_id, name, sku, barcode, description, category_id, unit, reorder_level, reorder_qty, cost_price, selling_price, supplier_name, supplier_contact, lead_time_days}).eq('id'); update({is_active:false}).eq('id')
- from('inv_stock_levels').insert({product_id, location_id, quantity:0}) — after create
### InventoryLocations.tsx
- from('inv_locations').select('*').eq('user_id').order('is_default' desc).order('name')
- from('inv_settings').upsert({user_id, multi_location_enabled}, onConflict 'user_id')
- from('inv_locations').insert({user_id, name:'Main Warehouse', is_default:true, is_active:true}) — bootstrap
- from('inv_locations').update/insert(payload {user_id, name, address, manager_name, manager_contact, is_active, is_default}).eq('id')
- from('inv_locations').update({is_default:false}).eq('user_id'); update({is_default:true}).eq('id'); update({is_active:false}).eq('id')
### InventoryStockCount.tsx
- from('inv_stock_counts').select('*').eq('user_id').order('created_at' desc).limit(10); insert({user_id, name, notes, location_id, status:'in_progress'}).select().single(); update({status:'finalized', finalized_at}).eq('id')
- from('inv_products').select('id, name, sku, unit').eq('user_id').eq('is_active',true); from('inv_locations').select('*').eq('user_id').eq('is_active',true)
- from('inv_stock_levels').select('product_id, quantity').eq('location_id'); update({quantity:counted_qty, last_counted_at}).eq('product_id')
- from('inv_stock_count_items').insert(items[{count_id, product_id, expected_qty, counted_qty:null}]); select('*, inv_products(name, sku, unit)').eq('count_id').order('inv_products(name)'); update({counted_qty}).eq('id')
- from('inv_stock_movements').insert({product_id, location_id, movement_type:'adjustment', quantity, reason:'correction', notes, user_id})
### InventoryReports.tsx
- from('inv_products').select('id, name, sku, cost_price, selling_price, unit, inv_categories(name), inv_stock_levels(quantity)').eq('user_id').eq('is_active',true).order('name')
- from('inv_stock_movements').select('*, inv_products(name, sku)').eq('user_id').gte('created_at').order('created_at' desc)
- from('inv_products').select('id, name, sku, unit, reorder_level, reorder_qty, supplier_name, inv_stock_levels(quantity)').eq('user_id').eq('is_active',true)
### StockAdjustmentModal.tsx
- from('inv_stock_levels').select('quantity').eq('product_id').eq('location_id').maybeSingle(); select('id')... maybeSingle(); update({quantity, updated_at}).eq('id') or insert({product_id, location_id, quantity})
- from('inv_stock_movements').insert({product_id, location_id, movement_type, quantity, reason, reference, notes, user_id})
## ECOMMERCE SUBPAGES (src/pages/lounge/ecommerce)
### pages/EcommerceHome.tsx
- from('products').select('id', {count:'exact', head:true}).eq('user_id'); from('site_orders').select('*').eq('user_id').order('created_at' desc).limit(5)
### pages/ProductsPage.tsx
- from('products').select('*').eq('user_id').order('created_at' desc)
- from('products').update/insert(payload {user_id, name, slug, price, compare_at_price, currency, sku, status, is_featured, images, track_inventory, inventory_count, description}).eq('id'); delete().eq('id')
### pages/CollectionsPage.tsx
- from('product_categories').select('*').eq('user_id').order('sort_order'); from('products').select('category_id').eq('user_id')
- from('product_categories').update/insert({user_id, name, slug, description}).eq('id'); delete().eq('id')
### pages/OrdersPage.tsx
- from('site_orders').select('*').eq('user_id').order('created_at' desc)
### pages/CustomersPage.tsx
- from('site_orders').select('customer_email, customer_name, total_amount, created_at').eq('user_id') — derived customers
### pages/InventoryPage.tsx
- from('products').select('id, name, sku, inventory_count, track_inventory, images').eq('user_id').eq('track_inventory',true).order('inventory_count' asc)
### pages/PaymentsPage.tsx
- from('ecommerce_settings').select('payments_provider,payments_test_mode,payments_configured,checkout_success_url,checkout_cancel_url').eq('user_id').maybeSingle()
- from('ecommerce_settings').upsert({user_id, payments_provider, payments_test_mode, payments_configured, checkout_success_url, checkout_cancel_url}, onConflict 'user_id')
### pages/SettingsPage.tsx
- from('ecommerce_settings').select('*').eq('user_id').maybeSingle(); upsert({user_id, ...settings}, onConflict 'user_id')
### pages/EmbedPage.tsx
- supabase.auth.getUser() only; generates embed snippet pointing at functions/v1/ecommerce-embed (no direct request)
### shared/ProductImageUploader.tsx
- storage.from('product-images').upload(path, file, {contentType, upsert:false}); createSignedUrl(path, 1yr)
## OFFICE SUITE (src/pages/lounge/Office*)
### OfficeOneDrive.tsx
- from('office_documents').select('id, title, document_type, word_count, is_starred, created_at, updated_at').eq('user_id').order('updated_at' desc); update({is_starred}).eq('id'); insert({user_id, title:'Untitled Document', document_type:'word'}).select('id').single()
- from('platform_files').select('*').eq('user_id').eq('is_trashed',false).order('updated_at' desc); update({is_starred}).eq('id'); update({is_trashed:true, trashed_at}).eq('id')
### LoungeOffice.tsx (hub; uses useUserRole)
- from('platform_files').select('id, file_name, app_source, source_route, updated_at, is_starred').eq('user_id').eq('is_trashed',false).order('updated_at' desc).limit(30)
- from('office_documents').select('id, title, document_type, is_starred, updated_at').eq('user_id').order('updated_at' desc).limit(30)
### OfficeWordHome.tsx
- from('office_documents').select('id, title, document_type, word_count, is_starred, created_at, updated_at').eq('user_id').eq('document_type','word').order('updated_at' desc)
- insert({user_id, title, document_type:'word'}).select('id').single(); select('content').eq('id').single() + insert({user_id, title:'(Copy)', document_type:'word', content}) — duplicate; update({is_starred}).eq('id') (×2); delete().eq('id') (×2)
### OfficeOneNoteHome.tsx
- from('platform_files').select('metadata').eq('user_id').eq('app_source','notes').eq('source_id','notebook-root').maybeSingle() — load notebook
- from('platform_files').select('id') same filters .maybeSingle(); update(payload)/insert(payload) — autosave (×2 paths); payload {user_id, file_name:'Notebook', file_type:'document', app_source:'notes', source_id:'notebook-root', source_route, description, metadata:{sections}}
### OfficePDFHome.tsx
- from('platform_files').select('*').eq('user_id').eq('app_source','pdf-studio').eq('is_trashed',false).order('updated_at' desc); update({is_starred}).eq('id'); update({is_trashed:true, trashed_at}).eq('id')
### OfficeInvoices.tsx (invoice data itself is client-side; registry only)
- from('platform_files').insert({user_id, file_name, file_type:'document', app_source:'invoices', source_route:'/lounge/office/invoices', metadata:{meta, client, amount, status}}) (×2 flows)
### OfficeStickyWall.tsx / OfficeStickyWallHome.tsx
- from('sticky_walls').select('*').eq('id').eq('user_id').single() — load wall
- from('sticky_walls').update({name, notes}).eq('id') or insert({user_id, name, notes}).select('id').single() — save
- Home: select('*').eq('user_id').order('updated_at' desc); update({is_starred}).eq('id'); delete().eq('id')
### OfficePolls.tsx (uses useCommChannels)
- from('office_polls').select('*').eq('user_id').order('created_at' desc); insert({user_id, question, is_active:true}).select().single(); update({is_active:false}).eq('id'); delete().eq('id')
- from('office_poll_options').select('*').in('poll_id').order('sort_order'); insert([{poll_id, text, sort_order}]).select()
- from('office_poll_votes').select('*').in('poll_id'); insert({poll_id, option_id, voter_id})
- from('profiles').select('user_id, full_name').in('user_id'); select('user_id, full_name, avatar_url').neq('user_id').order('full_name'); select('full_name').eq('user_id').single()
- share to channel: from('comm_channel_members').select('id').eq('channel_id').eq('user_id').maybeSingle(); insert({channel_id, user_id, role:'member'}); from('comm_messages').insert({channel_id, sender_id, content, message_type:'poll', metadata:{poll_id, poll_question, poll_options}})
- share via DM: from('comm_channels').select('id').eq('channel_type','dm').eq('slug','dm-{slug}').maybeSingle(); insert({name:'DM', slug, channel_type:'dm', created_by}).select('id').single(); from('comm_channel_members').insert([2 member rows]); from('comm_messages').insert({channel_id, sender_id, content, message_type:'poll', metadata})
### OfficeCalculator.tsx
- from('calculator_history').select('*').eq('user_id').order('created_at' desc).limit(20); insert({user_id, expression, result}).select().single(); delete().eq('user_id')
### OfficePomodoro.tsx
- from('pomodoro_sessions').select('*').eq('user_id').order('completed_at' desc).limit(50); insert({user_id, session_type, duration_minutes}).select().single()
### OfficeTimeTracker.tsx
- from('time_entries').select('*').eq('user_id').order('created_at' desc); insert({user_id, task, project, project_color, duration_minutes, billable, rate}).select().single() (×2: timer + manual); delete().eq('id')
### OfficeExpenseManager.tsx
- from('expenses').select('*').eq('user_id').order('created_at' desc); insert({user_id, title, amount, category, category_color, vendor, project, notes, status:'pending'}).select().single(); delete().eq('id'); update({status}).eq('id')
- invoke('parse-receipt', {imageBase64, mimeType}) — AI receipt scan
### OfficeHR.tsx
- from('hr_employees').select('*').eq('user_id').order('created_at' desc); insert({user_id, employee_id, name, role, department, email, phone, location, salary, avatar, status:'probation'}).select().single(); delete().eq('id')
- from('hr_time_off_requests').select('*').eq('user_id').order('created_at' desc); update({status:'approved'|'denied'}).eq('id')
- from('hr_performance_reviews').select('*').eq('user_id').order('created_at' desc)
- from('hr_candidates').select('*').eq('user_id').order('created_at' desc); update({stage}).eq('id')
### OfficeWiki.tsx
- from('wiki_pages').select('*').eq('user_id').order('updated_at' desc); insert({user_id, title, category, content, last_edited_by, status:'published'}).select().single(); update({is_starred}).eq('id'); update({content, updated_at}).eq('id'); delete().eq('id')
### OfficePasswordVault.tsx
- from('password_vault_configs').select('*').eq('user_id').order('created_at' asc); insert({user_id, vault_name, password_hash, totp_secret_encrypted, security_questions, master_key_hash, master_key_encrypted}); update({failed_attempts, last_failed_at}).eq('id'); update({failed_attempts:0}).eq('id')
- from('password_vault_items').select('*').eq('vault_id').order('created_at' desc); insert({user_id, vault_id, title_encrypted, username_encrypted, password_encrypted, url_encrypted, notes_encrypted, category, has_2fa}); delete().eq('id'); update({starred}).eq('id')
### OfficeEcommerce.tsx (subscription-sites manager; uses `(supabase as any)`)
- from('subscription_sites').select('*').order('created_at' desc); insert(payload).select().single(); update(payload).eq('id'); update({status}).eq('id'); update({acc_org_id, acc_customer_id, acc_revenue_account_id, auto_invoice}).eq('id'); update({last_invoiced_on, next_renewal_date}).eq('id'); delete().eq('id') — payload keys {owner_user_id, site_name, client_name, site_url, hero_image_url, template_used, status, billing_amount, billing_currency, billing_cycle, subscription_start_date, next_renewal_date, hosting_provider, hosting_status, is_hosted_only, notes}
- channel('subscription-sites-live').on(* public.subscription_sites).subscribe()
- from('subscription_site_events').select('*').eq('subscription_site_id').order('occurred_at' desc).limit(30); insert({subscription_site_id, event_type:'created'|'edited'|status-change|'accounting_linked'|'invoice_generated', actor_user_id, actor:'user', detail?}) (×5 call sites)
- accounting link: from('acc_organizations').select('id,name,base_currency').order('name'); from('acc_customers').select('id,name,org_id').order('name'); from('acc_chart_of_accounts').select('id,account_code,account_name,account_type,org_id').in('account_type',['revenue','income']).order('account_code'); from('acc_ar_invoices').select('id,invoice_number,invoice_date,due_date,total,currency,status').eq('subscription_site_id').order('invoice_date' desc).limit(24)
- invoice gen: from('acc_ar_invoices').insert({org_id, customer_id, subscription_site_id, invoice_number, invoice_date, due_date, currency, subtotal, tax_total, total, status:'draft', notes, created_by}).select().single(); from('acc_ar_invoice_lines').insert({invoice_id, line_no, description, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total, revenue_account_id})
### OfficeAccounting.tsx (accounting shell; `(supabase as any)`)
- from('acc_org_members').select('org_id').eq('user_id').eq('role','accountant'); from('acc_organizations').select('*').in('id').order('name') — accountant mode
- from('acc_organizations').select('*').order('created_at') — owner mode; insert({owner_user_id, name}).select().single()
- from('acc_chart_of_accounts').select('*').eq('org_id').order('code'); insert({org_id, code, name, type, subtype}); update({is_active}).eq('id')
- from('acc_journal_entries').select('*').eq('org_id').order('entry_date' desc).limit(200); insert({org_id, entry_date, description, source_type:'manual', created_by}).select().single(); update({posted_at}).eq('id') (post, ×2); delete().eq('id') (rollback, ×2); select('*').eq('id').single(); insert(reversal {org_id, entry_date, description, source_type:'reversal', created_by, is_reversal:true, reversed_by_entry_id}).select().single()
- from('acc_journal_lines').insert(linePayload[{journal_entry_id, account_id, debit, credit, memo}]); select('*').eq('journal_entry_id'); insert(swapped reversal lines); select('*, account:acc_chart_of_accounts(code,name)').eq('journal_entry_id')
- from('acc_trial_balance').select('*').eq('org_id').order('account_code')
## ACCOUNTING SUBVIEWS (src/pages/lounge/accounting; client alias `db`)
### SimpleMode.tsx
- from('acc_ar_invoices').select('total,status,invoice_date').eq('org_id').gte('invoice_date').in('status',['posted','paid']); select('id,invoice_number,total,amount_paid,due_date,customer_id,currency').eq('org_id').eq('status','posted').order('due_date' asc).limit(10); select('tax_total')... — dashboards
- from('acc_ap_bills').select('total,status,bill_date')… + select('id,bill_number,total,amount_paid,due_date,supplier_id,currency')… (mirror of AR)
- from('acc_customers').select('id,name,default_ar_account_id,default_revenue_account_id').eq('org_id').eq('is_active',true).order('name'); insert({org_id, name, currency}).select().single()
- from('acc_suppliers').select('id,name,default_ap_account_id,default_expense_account_id')…; insert({org_id, name, currency}).select().single()
- quick invoice: from('acc_ar_invoices').insert({org_id, customer_id, invoice_number, invoice_date, currency, subtotal, tax_total, total, notes}).select().single(); from('acc_ar_invoice_lines').insert({invoice_id, line_no, description, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total, revenue_account_id}); rpc('acc_post_ar_invoice', {_invoice_id})
- quick bill: acc_ap_bills insert + acc_ap_bill_lines insert {…, expense_account_id} + rpc('acc_post_ap_bill', {_bill_id})
- payments: from('acc_ar_payments').insert({org_id, invoice_id, bank_account_id, amount, payment_date}).select().single() + rpc('acc_post_ar_payment', {_payment_id}); acc_ap_payments insert {org_id, bill_id, bank_account_id, amount, payment_date} + rpc('acc_post_ap_payment', {_payment_id})
- channel('acc-simple-{orgId}').on(* acc_ar_invoices|acc_ap_bills|acc_bank_transactions|acc_ar_payments|acc_ap_payments|acc_journal_entries, filter org_id=eq).subscribe()
### AccountsReceivableView.tsx
- from('acc_customers').select('*').eq('org_id').order('name'); insert({org_id, name, currency, email?, phone?, default_ar_account_id?, default_revenue_account_id?}); delete().eq('id')
- from('acc_ar_invoices').select('*').eq('org_id').order('invoice_date' desc).limit(500); insert({org_id, customer_id, invoice_number, invoice_date, due_date, subtotal, tax_total, total, currency, notes, status:'draft'}).select().single(); delete().eq('id')
- from('acc_ar_invoice_lines').insert(lines[{invoice_id, line_no, description, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total, revenue_account_id}])
- from('acc_ar_aging').select('*').eq('org_id').order('days_overdue' desc)
- from('acc_ar_payments').insert({org_id, invoice_id, payment_date, amount, bank_account_id, reference, method}).select().single()
- rpc('acc_post_ar_invoice'), rpc('acc_void_ar_invoice'), rpc('acc_post_ar_payment')
### AccountsPayableView.tsx — exact AP mirror of the above:
- acc_suppliers select/insert{org_id,name,currency,email?,phone?,default_ap_account_id?,default_expense_account_id?}/delete; acc_ap_bills select/insert{…, supplier_id, bill_number, supplier_reference}/delete; acc_ap_bill_lines insert{…, expense_account_id}; acc_ap_aging select; acc_ap_payments insert{org_id, bill_id, payment_date, amount, bank_account_id, reference, method}; rpc('acc_post_ap_bill'|'acc_void_ap_bill'|'acc_post_ap_payment')
### BankingView.tsx
- from('acc_bank_accounts').select('*').eq('org_id').order('name'); insert({org_id, name, institution, account_number_last4, currency, coa_account_id, opening_balance, opening_balance_date}); delete().eq('id')
- from('acc_bank_transactions').select('*').eq('bank_account_id').order('txn_date' desc).limit(1000); insert(csvRows[{org_id, bank_account_id, txn_date, description, reference, amount, source:'csv'}]); delete().eq('id')
- from('acc_bank_reconciliations').select('*').eq('bank_account_id').order('statement_date' desc); insert({org_id, bank_account_id, statement_date, opening_balance, closing_balance}); delete().eq('id')
- match dialog: from('acc_journal_entries').select('id, entry_date, description, source_type').eq('org_id').not('posted_at','is',null).gte('entry_date').lte('entry_date').order('entry_date' desc).limit(50)
- rpc('acc_unmatch_bank_transaction', {_txn_id}); rpc('acc_complete_bank_reconciliation', {_recon_id}); rpc('acc_create_journal_from_bank_transaction', {_txn_id, _contra_account_id, _memo}); rpc('acc_match_bank_transaction', {_txn_id, _entry_id})
### PayrollView.tsx
- from('acc_employees').select('*').eq('org_id').order('full_name'); insert({org_id, full_name, email, job_title, tax_code, ni_number, pay_type, pay_rate, default_hours}); update({is_active}).eq('id')
- from('acc_pay_runs').select('*').eq('org_id').order('period_end' desc); select('*').eq('id').maybeSingle(); insert({org_id, period_start, period_end, pay_date, reference}).select().single()
- from('acc_payslips').insert(rows[{org_id, pay_run_id, employee_id, hours, gross, paye, ni_ee, ni_er, pension, other_ded, net}]); select('*').eq('pay_run_id').order('created_at'); update({hours, gross, paye, ni_ee, ni_er, pension, other_ded, net}).eq('id') (×2); delete().eq('id')
- from('acc_bank_accounts').select('id,name,coa_account_id').eq('org_id').order('name')
- rpc('acc_recalc_pay_run', {_pay_run_id}) (×3); rpc('acc_post_pay_run', {_pay_run_id}); rpc('acc_pay_pay_run', {_pay_run_id, _bank_account_id, _payment_date})
### VatView.tsx
- from('acc_vat_returns').select('*').eq('org_id').order('period_end' desc); insert({org_id, period_start, period_end, output_vat, input_vat, net_due, reference, notes})
- from('acc_bank_accounts').select('id,name,coa_account_id').eq('org_id').order('name')
- rpc('acc_calculate_vat', {_org_id, _start, _end}); rpc('acc_submit_vat_return', {_return_id}); rpc('acc_pay_vat_return', {_return_id, _bank_account_id, _payment_date, _amount})
### FixedAssetsView.tsx
- from('acc_fixed_assets').select('*').eq('org_id').order('purchase_date' desc); insert({org_id, name, asset_tag, category, purchase_date, purchase_cost, salvage_value, useful_life_months, depreciation_method, reducing_rate_pct, asset_account_id})
- from('acc_depreciation_runs').select('*').eq('org_id').order('period_end' desc); select('*').eq('id').maybeSingle() (×2); update({total_amount}).eq('id')
- from('acc_depreciation_lines').select('*').eq('run_id'); delete().eq('id'); select('amount').eq('run_id')
- from('acc_bank_accounts').select('id,name,coa_account_id').eq('org_id').order('name')
- rpc('acc_create_depreciation_run', {_org_id, _period_end}); rpc('acc_post_asset_acquisition', {_asset_id, _bank_account_id}); rpc('acc_dispose_asset', {_asset_id, _disposal_date, _proceeds, _bank_account_id}); rpc('acc_post_depreciation_run', {_run_id})
### FxView.tsx
- from('acc_fx_rates').select('*').eq('org_id').order('rate_date' desc).limit(200); insert({org_id, rate_date, from_currency, to_currency, rate, source:'manual', created_by}); delete().eq('id')
- rpc('acc_post_fx_revaluation', {_org_id, _as_of, _user_id})
### AuditTrailView.tsx
- from('acc_audit_log').select('id, actor_id, action, entity_type, entity_id, before_state, after_state, created_at').eq('org_id').order('created_at' desc).limit(250)
- from('acc_report_recalcs').select('id, report_name, params, row_count, duration_ms, computed_by, computed_at').eq('org_id').order('computed_at' desc).limit(100)
- channel('acc-audit-{orgId}').on(INSERT acc_audit_log filter org_id=eq).on(INSERT acc_report_recalcs filter org_id=eq).subscribe()
### ReportsCentre.tsx (data via reportsData/reportsExtra)
- channel('acc-reports-{orgId}').on(* acc_journal_entries|acc_ar_invoices|acc_ap_bills|acc_bank_transactions, filter org_id=eq).subscribe()
### reportsData.ts
- from('acc_chart_of_accounts').select('id, code, name, type, subtype').eq('org_id').order('code')
- from('acc_journal_entries').select('id, entry_date, description, source_type, source_id, posted_at, is_reversal, created_by').eq('org_id').not('posted_at','is',null).lte('entry_date').order('entry_date' asc)
- from('acc_journal_lines').select('id, journal_entry_id, account_id, debit, credit, memo, tax_code').in('journal_entry_id', chunk)
### reportsExtra.ts
- from('acc_ar_invoices').select('id, customer_id, invoice_number, invoice_date, due_date, total, amount_paid, currency, status').eq('org_id').not('posted_at','is',null).lte('invoice_date'); select('tax_total, invoice_date').eq('org_id').not('posted_at','is',null)
- from('acc_ap_bills').select('id, supplier_id, bill_number, bill_date, due_date, total, amount_paid, currency, status') same filters; select('tax_total, bill_date')…
- from('acc_customers').select('id, name').eq('org_id'); from('acc_suppliers').select('id, name').eq('org_id')
- from('acc_vat_returns').select('id, period_start, period_end, output_vat, input_vat, net_due, status, submitted_at, reference, payment_amount, payment_date').eq('org_id').order('period_end' desc)
- from('acc_fixed_assets').select('id, name, asset_tag, category, status, depreciation_method, purchase_date, purchase_cost, salvage_value, useful_life_months, accumulated_depreciation, last_depreciated_on, disposal_date, disposal_proceeds').eq('org_id').order('purchase_date' desc)
### assessmentPack.ts
- readiness counts (head:true, count exact): acc_ar_invoices eq(org_id).eq(status,'draft').gte/lte(invoice_date); acc_ap_bills same on bill_date; acc_bank_transactions neq(status,'reconciled').gte/lte(txn_date); acc_journal_entries is(posted_at,null).gte/lte(entry_date)
- pack data: acc_ar_invoices select('subtotal, tax_total, total, tax_rate') posted/paid in period (×2); select('invoice_number, invoice_date, due_date, total, amount_paid, currency, acc_customers(name)').eq(status,'posted').lte(invoice_date) (×2); acc_ap_bills select('bill_number, bill_date, due_date, total, amount_paid, currency, acc_suppliers(name)').eq(status,'posted').lte(bill_date) (×2)
### auditLog.ts
- from('acc_report_recalcs').insert({org_id, report_name, params, row_count, duration_ms, computed_by})
### SubmitForAssessment.tsx
- from('email_accounts').select('id, email_address, display_name, provider, is_active').eq('is_active',true)
- from('acc_org_members').select('user_id, role').eq('org_id').eq('role','accountant')
- invoke('acc-submit-assessment', {orgId, target, period, note, email, sendingAccountId, filename, contentType, attachmentBase64, pdfBase64, summary})
### AccountantsSettings.tsx
- invoke('acc-create-accountant-login', {orgId, email, password, fullName}); invoke('acc-send-invite-email', {inviteId, accountId})
- from('acc_accountant_invites').select('id, email, token, status, expires_at, accepted_at, created_at').eq('org_id').order('created_at' desc); insert({org_id, email, token, invited_by}); update({status:'revoked'}).eq('id')
- from('acc_org_members').select('id, user_id, role, created_at').eq('org_id').eq('role','accountant'); delete().eq('id')
- from('email_accounts').select('id, email_address, display_name, provider, is_active').eq('user_id').order('email_address')
## CRM WORKSPACE (src/pages/lounge/crm)
### CRMShell.tsx (uses useUserRole; TABLE_FOR: company→crm_companies, contact→crm_contacts, opportunity→crm_opportunities)
- from(TABLE_FOR[entity]).update({owner_id}).in('id', ids) — bulk assign
- from('crm_workflows').select('*').order('priority'); from('crm_workflow_runs').select('*').order('created_at' desc).limit(20)
### useCRMData.ts (in-page hook)
- from('crm_companies'|'crm_contacts'|'crm_opportunities').select('*').order('updated_at' desc).range(from, from+999) — paged fetchAll (1000/page up to 50k)
- from('crm_lifecycle_stages').select('*').order('order_index')
- rpc('crm_timeline', {entity_type, entity_id, limit_count:50}); rpc('crm_entity_financials', {_entity_type, _entity_id}); rpc('crm_entity_lifetime_value', {_entity_type, _entity_id}); rpc('crm_set_lifecycle_stage', {_entity_type, _entity_id, _new_stage_id, _note})
### useAdmins.ts
- from('user_roles').select('user_id').eq('role','admin'); from('profiles').select('user_id,email,full_name,is_owner').in('user_id')
### NewEntityDialog.tsx
- from('crm_opportunities').insert({org_id, owner_id, title, value, currency:'GBP', description, contact_id, company_id})
- from('crm_contacts').insert({org_id, owner_id, full_name, email, phone, company_id, relationship_type:['lead']})
- from('crm_companies').insert({org_id, owner_id, name, email, phone, relationship_type:['lead']})
### EntityDetail.tsx
- from(TABLE_FOR[entityType]).update({owner_id}).eq('id') — reassign owner
### NotesPanel.tsx
- from('crm_communications').select('id, body, subject, occurred_at, owner_id').eq('kind','note').eq(company_id|contact_id|opportunity_id, entityId).order('occurred_at' desc).limit(100)
- from('crm_communications').insert({org_id, owner_id, kind:'note', direction:'internal', body, occurred_at, [company_id|contact_id|opportunity_id]}); delete().eq('id')
### CRMLeadImportDialog.tsx
- from('user_roles').select('user_id, created_at').eq('role','admin').order('created_at' asc).limit(1).maybeSingle() — resolve org_id
- from('crm_contacts').select('email, phone, full_name').eq('org_id').limit(20000) — dedupe set
- from('crm_contacts').insert(rows[{org_id, owner_id, full_name, email, phone, job_title, source, relationship_type:['lead'], notes}]) — 500-row chunks
### csvIO.ts
- from('user_roles').select('user_id, created_at').eq('role','admin').order('created_at' asc).limit(1).maybeSingle()
- from('crm_companies'|'crm_contacts'|'crm_opportunities').insert(rows, {count:'exact'}) — CSV import; company keys {org_id, owner_id, name, legal_name, domain, website, industry, phone, email, city, country, notes, tags, relationship_type}; contact keys {org_id, owner_id, full_name, first_name, last_name, email, phone, mobile, job_title, notes, tags, relationship_type}; opportunity keys {org_id, owner_id, title, description, value, currency, stage, probability, expected_close_date}
## HOOKS (src/hooks — imported by in-scope files)
### useSidebarLayout.ts (PortalSidebar, FolderManagement, MoveToFolderSheet, SidebarFolderComponent)
- from('user_sidebar_layout').select('layout_data').eq('user_id').maybeSingle(); upsert({user_id, layout_data}, onConflict 'user_id') (×4 call sites: migrate/preset/save/update)
### useAccountType.ts (PortalSidebar)
- from('profiles').select('account_type').eq('user_id').maybeSingle(); from('account_type_presets').select('*').eq('account_type').maybeSingle()
### useActivityLogger.ts (LoungeOverview)
- invoke('log-user-activity', {features: batch})
### useUnreadMessages.ts (LoungeLayout)
- from('messages').select('*', {count:'exact', head:true}).eq('recipient_id').eq('is_read',false)
- channel('unread-messages').on(* public.messages filter recipient_id=eq).subscribe()
### useClientPresence.ts (LoungeLayout)
- channel('lounge-presence', {config:{presence:{key:uid}}}).on('presence' sync).subscribe(); channel.track({user_id, full_name, avatar_url, email, current_page, online_at})
### useSaveCurrentAccount.ts (LoungeLayout)
- from('profiles').select('full_name, avatar_url').eq('user_id').maybeSingle()
### useTeamCalls.ts (LoungeLayout)
- from('call_sessions').select('*').eq('callee_id').eq('status','ringing').order('created_at' desc).limit(1)
- channel('incoming-calls').on(INSERT call_sessions filter callee_id=eq).on(UPDATE call_sessions filter callee_id=eq).on(UPDATE call_sessions filter caller_id=eq).subscribe()
- from('call_sessions').update({status:'missed'|'accepted'|'declined'|'ended', started_at?/ended_at?}).eq('id') (+.eq('status','ringing') for missed); select('id').or(caller_id.eq|callee_id.eq).in('status',['ringing','accepted']).limit(1); insert({caller_id, callee_id, channel_id, call_type, status:'ringing'}).select().single()
- from('profiles').select('full_name, avatar_url').eq('user_id').single() (×2)
- from('notifications').insert({user_id, type:'call', title, message, icon, link:'/lounge/team-comms', metadata:{call_session_id, call_type}})
### useNotifications.ts (LoungeNotifications)
- from('notifications').select('*').eq('user_id').order('created_at' desc).limit(50); update({is_read:true, read_at}).eq('id'); update(same).eq('user_id').eq('is_read',false); delete().eq('id'); delete().eq('user_id')
- channel('notifications-realtime').on(INSERT notifications filter user_id=eq).on(DELETE notifications filter user_id=eq).subscribe()
### useCalendarEvents.ts (LoungeCalendar)
- from('calendar_events').select('*').gte('start_time').lte('start_time').order('start_time' asc)
- insert({...eventData, user_id}).select().single() — event keys: title, description, start_time, end_time, is_all_day, location, color, is_recurring, recurrence_rule, reminders, attendees, meeting_link, attachments, calendar_id
- update(updates).eq('id'); delete().eq('id')
### useGoogleCalendarSync.ts (LoungeCalendar, ConnectionsSettings)
- from('user_connections').select('credentials, is_connected, connected_at').eq('user_id').eq('provider','google_calendar').maybeSingle()
- invoke('google-calendar-auth', {action:'get_auth_url', redirect_uri}); invoke('google-calendar-sync', {action:'import_events'}); invoke('google-calendar-sync', {action:'push_event', event})
### useCRMDeals.ts (LoungeCRM)
- from('crm_deals').select('*').order('updated_at' desc); insert({user_id, deal_name, stage, probability, deal_value, currency, expected_close_date, contact_name, company_name, description, lead_id}).select().single(); update(updates).eq('id'); delete().eq('id')
- from('crm_deal_activities').insert({deal_id, user_id, activity_type:'created'|'stage_change', old_value?, new_value, description})
- from('client_onboarding').insert({user_id, deal_id, client_name, client_email, company_name, status:'pending', account_created, account_created_at}) — on stage→won
### useProposals.ts (LoungeCRM)
- from('proposals').select('*').eq('user_id').order('created_at' desc); rpc('generate_proposal_number')
- from('proposals').insert({user_id, proposal_number, template_type, status:'draft', lead_id, client_name, client_email, client_company, client_phone, title, introduction, scope_items, pricing_items, total_amount, currency, valid_until, terms}).select().single(); update(partial Proposal keys).eq('id'); delete().eq('id')
### useClientPricing.ts (LoungeBilling)
- from('team_memberships').select('id, member_role, team_id, client_teams(id, team_name, team_code)').eq('user_id').maybeSingle(); from('client_teams').select('id, team_name, team_code').eq('primary_account_id').maybeSingle()
- from('client_pricing').select('*').eq('team_id').eq('is_visible',true); from('client_invoices').select('*').eq('team_id').order('created_at' desc); from('client_contracts').select('*').eq('team_id').order('created_at' desc)
### useCommChannels.ts (OfficePolls)
- from('comm_channels').select('*').eq('is_archived',false).order('is_default' desc).order('name'); insert({name, slug, description, channel_type, created_by}).select().single()
- channel('comm-channel-changes').on(* public.comm_channels).subscribe()
- from('comm_channel_members').insert({channel_id, user_id, role:'owner'}); upsert({channel_id, user_id, role:'member'}, onConflict 'channel_id,user_id'); delete().eq('channel_id').eq('user_id')
### useTypingIndicator.ts (LoungeMessages)
- channel('typing-indicators').on('broadcast', {event:'typing'}).subscribe(); channel.send broadcast typing {userId, recipientId, isTyping}
### useSitePublish.ts (WebsiteEditor)
- from('site_deployments').select('*').eq('site_id').order('version_number' desc).limit(20); update({status:'archived'}).eq('site_id').eq('status','live'); update({status:'live', deployed_at}).eq('id')
- from('site_domains').select('*').eq('site_id').order('created_at' desc); insert({site_id, user_id, domain_type:'custom', domain_name, status:'pending_dns', dns_instructions}); delete().eq('id')
- invoke('deploy-site', {siteId, siteName, pages})
### useUserRole.ts (CRMShell, LoungeWorkshop, LoungeWebsiteDesigner, LoungeAIBuilder, LoungeCRM, LoungeOffice, SubscriptionPaywall)
- from('user_roles').select('role').eq('user_id').maybeSingle()
## DELEGATED SURFACES (in-scope pages whose data lives in out-of-scope components — audit separately before overhaul)
- LoungeBookings → components/booking/BookingDashboard (+useBookingSystem); LoungeTeamComms → components/comms/TeamComms (+useCommMessages/Presence/RBAC); LoungeVault → components/vault/VaultContent; LoungeCADEditor → components/cad/CADStudio; LoungeWordEditor → components/office/WordEditor; LoungeWorkflows → components/workflow/*; LoungeCalendar → components/calendar/* (data via hooks above); LoungePlanner → components/planner/PlannerBoard; DesignStudio* → components/design-studio/DesignStudioShell; OfficePDFCreator/OfficeStickyWall/WebsiteEditor → components/files/SaveToFilesDialog (platform_files writes)
- Pure client-side pages (no supabase in file): FigmaDesigner, CreativePhotoStudio, OfficeExcelHome, SheetsHomeDash, SlidesHome, OfficePowerPointHome, OfficeForms(+Home), OfficeTasks, OfficeOperations, OfficeContractManager, OfficePDF, OfficeWhiteboard(+Home), OfficePollsHome, OfficeWordHome-viewer siblings, LoungeNotifications (hook only), DesignStudioEditor

---

# PART B — QUOORO OFFICE, ADMIN, ACCOUNTANT, AUTH

# DATA-CONTRACTS — Quooro Office (TEAM/ADMIN) + AUTH surfaces

Presentation-only overhaul contract. The rebuilt UI must issue byte-identical requests.
Notation: `from('t').select(cols).eq('col')` = method chain with payload/column KEYS and filter columns.
Raw `fetch` to `${VITE_SUPABASE_URL}/functions/v1/<fn>` is marked (raw fetch) — POST, `Content-Type: application/json`, `Authorization: Bearer <access_token>`.

## AUTH CONTEXT + SHARED HOOKS (attribute calls to hook file)

### src/contexts/AuthContext.tsx
- auth.onAuthStateChange(cb) — session listener; on SIGNED_IN sets localStorage `lastActivityTimestamp`
- functions.invoke('send-welcome-email', body:{user_id}) — fire-and-forget for new OAuth signups (provider!=email, created <5s ago)
- auth.getSession() — initial load
- auth.signInWithPassword({email, password}) — signIn(); sets localStorage `lastLoggedInEmail`, `rememberMe`
- auth.signUp({email, password, options:{emailRedirectTo: origin+'/verify-email', data:{full_name}}}) — signUp()
- from('profiles').select('full_name').eq('user_id', user.id).single() — signOut() caches name to localStorage `lastLoggedInName` (+`lastLoggedInPortal`)
- auth.signOut() — signOut()
- localStorage keys: lastLoggedInEmail, lastLoggedInName, lastLoggedInPortal, rememberMe

### src/hooks/useAuthSync.ts
- quickSignOut(): auth.signOut(); getLastPortal()/setLastPortal(): localStorage `lastLoggedInPortal` only — no network

### src/hooks/useUserRole.ts
- from('user_roles').select('role').eq('user_id', user.id).maybeSingle() — role fetch; defaults to 'user' when null

### src/hooks/useTwoFactor.ts  (all raw fetch → functions/v1/two-factor-auth)
- body {action:'status'} — fetch 2FA status (auto on mount)
- body {action:'setup'} — begin TOTP setup (returns secret/qrCodeUrl/otpAuthUrl)
- body {action:'verify-setup', code} — confirm setup (returns backupCodes)
- body {action:'verify', code} | {action:'verify-backup', code} — verifyCode(code, isBackupCode)
- body {action:'disable', code} — disable 2FA
- body {action:'admin-stats'} — admin 2FA stats

### src/hooks/useIPCheck.ts  (all raw fetch → functions/v1/two-factor-auth; IP from GET https://api.ipify.org?format=json)
- body {action:'check-ip', ip} — checkIP()
- body {action:'verify-ip', code, ip} — verifyIPWithCode()
- body {action:'add-known-ip', ip} — addKnownIP()
- body {action:'get-known-ips', ip} — getKnownIPs()
- body {action:'remove-known-ip', ip, ipToRemove} — removeKnownIP()

### src/hooks/useSecurityLog.ts
- raw fetch → functions/v1/security-log, body {event_type, portal_attempted|null, actual_role|null, ip_address (ipify or provided), details:{}} — Authorization header only when session exists
- auth.getSession() — to build the header

### src/hooks/useRateLimit.ts
- localStorage only (login/password-reset attempt counters) — no network

### src/hooks/useSignedUrl.ts
- storage.from(bucket [default 'customer-uploads']).createSignedUrl(path, 3600) — useSignedUrl()+getSignedUrl(), 50-min in-memory cache; http(s) paths passed through

### src/hooks/useSiteContent.ts  (react-query)
- queryKey ['site_content'] → from('site_content').select('section_key, data') — whole table, one fetch
- auth.getUser() then from('site_content').upsert({section_key, data, updated_by}, {onConflict:'section_key'}) — save(); setQueryData on same key
- listens for window postMessage {type:'ve:refresh', sectionKey} → invalidateQueries(['site_content'])

### src/hooks/useCRMDeals.ts
- from('crm_deals').select('*').order('updated_at' desc) — fetchDeals
- from('crm_deals').insert({user_id, deal_name, stage, probability, deal_value, currency, expected_close_date, contact_name, company_name, description, lead_id}).select().single() — createDeal
- from('crm_deal_activities').insert({deal_id, user_id, activity_type:'created', new_value, description}) — activity log
- from('crm_deals').update(updates).eq('id') — updateDeal
- from('crm_deal_activities').insert({deal_id, user_id, activity_type:'stage_change', old_value, new_value, description}) — on stage change
- from('client_onboarding').insert({user_id, deal_id, client_name, client_email:null, company_name, status:'pending', account_created:true, account_created_at}) — auto when stage→'won'
- from('crm_deals').delete().eq('id') — deleteDeal

### src/hooks/useProposals.ts
- from('proposals').select('*').eq('user_id', user.id).order('created_at' desc) — fetch
- rpc('generate_proposal_number') — number before insert
- from('proposals').insert({user_id, proposal_number, template_type, status:'draft', lead_id, client_name, client_email, client_company, client_phone, title, introduction, scope_items, pricing_items, total_amount, currency:'GBP', valid_until, terms}).select().single() — createFromTemplate
- from('proposals').update(dbUpdates).eq('id') — updateProposal (sendProposal = update {status:'sent', sent_at})
- from('proposals').delete().eq('id') — deleteProposal

### src/hooks/useRBAC.ts
- from('rbac_roles').select('*').order('is_system' desc).order('name') — fetchRoles
- from('rbac_permissions').select('*') — fetchAllPermissions
- from('rbac_user_roles').select('*') — fetchUserRoles
- from('rbac_user_roles').select('role_id').eq('user_id', user.id) then from('rbac_permissions').select('*').in('role_id', ids).eq('granted', true) — fetchMyPermissions (5-min cache)
- from('rbac_roles').insert({name, description, created_by}).select().single() — createRole
- from('rbac_roles').update(updates).eq('id') — updateRole; .delete().eq('id') — deleteRole
- from('rbac_roles').insert({name, description:'Copy of …', created_by}) + from('rbac_permissions').insert([{role_id, module, action, granted}…]) — duplicateRole
- from('rbac_permissions').upsert({role_id, module, action, granted}, {onConflict:'role_id,module,action'}) — setPermission (bulk variant upserts rows for all actions)
- from('rbac_user_roles').upsert({user_id, role_id, assigned_by}, {onConflict:'user_id,role_id'}) — assignRole; .delete().eq('user_id').eq('role_id') — removeUserRole
- from('rbac_audit_log').insert({performed_by, action, entity_type, entity_id?, old_value?, new_value?, details?}) — after every mutation above

### src/hooks/useTypingIndicator.ts
- channel('typing-indicators').send({type:'broadcast', event:'typing', payload:{userId, recipientId, isTyping}}) — broadcast
- channel('typing-indicators').on('broadcast', {event:'typing'}).subscribe(); removeChannel on unmount

### src/lib/piiDecrypt.ts (used by Dashboard/AdminEnquiries/AdminLeadManagement)
- rpc('decrypt_pii', {p_encrypted_value}) — per unique 'ENC:'-prefixed value, cached

### src/pages/lounge/crm/useAdmins.ts (imported by AdminManagement + ManageAdminsPanel)
- from('user_roles').select('user_id').eq('role','admin') then from('profiles').select('user_id,email,full_name,is_owner').in('user_id', ids) — admin roster

## AUTH SCREENS

### src/pages/SignInSelect.tsx — no data calls (renders UnifiedSignIn/static)

### src/components/auth/UnifiedSignIn.tsx
- auth.getSession() + from('user_roles').select('role').eq('user_id', user.id).maybeSingle() — auto-redirect existing session (admin→/dashboard else /lounge)
- signIn via AuthContext (accountant IDs without '@' become `<id>@acct.quooro.app`)
- useSecurityLog: `${portal}_login_failed` / `unauthorized_team_portal_login` / `${portal}_login_success`
- auth.getUser() — post-login user
- from('user_roles').select('role').eq('user_id', authUser.id).maybeSingle() — portal gate (team requires admin)
- from('profiles').select('full_name, avatar_url, two_factor_enabled').eq('user_id', authUser.id).maybeSingle() — cache name/avatar (localStorage lastLoggedInName, cachedAvatarUrl)
- useIPCheck.checkIP()/addKnownIP() — new-device branch → /verify-new-ip; two_factor_enabled → /verify-2fa
- auth.resetPasswordForEmail(email, {redirectTo: origin+'/reset-password'}) — forgot password (rate-limited, generic message)

### src/pages/Login.tsx (Team Portal)
- signIn (AuthContext) with rememberMe; rate limit via useLoginRateLimit (localStorage)
- from('user_roles').select('role').eq('user_id', user.id).single() — deny if not admin (signOut('team'))
- security logs: team_login_failed | team_login_no_role | unauthorized_team_portal_login | team_login_success
- from('profiles').select('two_factor_enabled').single() — NOTE: no .eq filter (RLS-scoped)
- useIPCheck.checkIP()/addKnownIP() → /verify-new-ip or /verify-2fa or /dashboard

### src/pages/CustomerLogin.tsx (signup)
- rpc('lookup_team_by_code', {p_code: code.toUpperCase()}) — debounced team-code validation + pre-submit check
- auth.signUp({email, password, options:{emailRedirectTo: origin+'/verify-email', data:{full_name, company, phone, industry, account_type, team_code|null}}})
- functions.invoke('send-verification-email', body:{email, is_resend:true}) — repeated-signup path (empty identities)
- functions.invoke('send-verification-email', body:{email}) — new signup; then navigate /check-email

### src/components/auth/GoogleSignInButton.tsx
- auth.signInWithOAuth({provider:'google', options:{redirectTo: baseUrl+redirectTo, queryParams:{access_type:'offline', prompt:'consent'}}}) — baseUrl = https://quooro.com on prod hostname else origin

### src/components/auth/ResendVerificationEmailForm.tsx
- functions.invoke('send-verification-email', body:{email, is_resend:true}) — always-generic success toast

### src/components/auth/AccountSwitcher.tsx
- auth.setSession({access_token, refresh_token}) — silent account switch from saved session (localStorage); sessionStorage 'force-splash'; window 'storage' listener (not supabase)

### src/pages/ResetPassword.tsx
- auth.setSession({access_token, refresh_token}) — from URL hash when type=recovery
- auth.updateUser({password}) — set new password → /lounge

### src/pages/CheckEmail.tsx
- from('profiles').select('email_verified').eq('user_id', user.id).maybeSingle() — 3s poll → /lounge when true
- from('profiles').select('verification_token').eq('user_id', user.id).maybeSingle() — dev/fallback token display
- functions.invoke('send-verification-email', body:{user_id, is_resend:true}) — resend (60s cooldown)

### src/pages/VerifyEmail.tsx
- rpc('verify_email_token', {p_token}) — verify link token; result {success, error?, user_id?}
- auth.getUser() + functions.invoke('send-verification-email', body:{user_id, is_resend:true}) — resend

### src/pages/Verify2FA.tsx
- useTwoFactor.verifyCode(code, useBackupCode) — auto-submit at 6 digits; success → location.state.from || '/lounge'; sign-out via quickSignOut()

### src/pages/VerifyNewIP.tsx
- useIPCheck.verifyIPWithCode(code) — verify new device (state: from, currentIP); sign-out via quickSignOut()

## TEAM/ADMIN PAGES

### src/pages/Dashboard.tsx
- from('enquiries').select('*').order('created_at' desc) — list (+ decrypt_pii on phone)
- from('profiles').select('*').order('created_at' desc) — client list (+ decrypt_pii on phone)
- from('customer_uploads').select('*').eq('user_id').order('created_at' desc) — per-client uploads
- from('enquiries').update({status}).eq('id') — status change; .update({notes}).eq('id') — save notes
- auth.getSession() + raw fetch functions/v1/create-client body {email, password, fullName, company?, phone?, plan? ('Preview Only' when preview type), pageCount?, websiteStatus (default 'design'), previewUrl?} — create client
- from('profiles').update({plan, page_count, status, company, phone, notes, website_status, preview_url}).eq('id') — edit client
- from('customer_uploads').update({status}).eq('id') — upload status; .delete().eq('id') + storage.from('customer-uploads').remove([path]) — delete upload
- auth.getSession() + raw fetch functions/v1/reset-client-password body {userId, newPassword} — admin password reset
- functions.invoke('delete-client', body:{user_id}) — full delete (typed confirmation word)
- getSignedUrl (customer-uploads) for image previews; quickSignOut() for logout

### src/pages/ExecutiveDashboard.tsx (react-query, all read-only)
- ['exec-clients'] from('profiles').select('*', {count:'exact', head:true})
- ['exec-invoices'] from('client_invoices').select('amount, total_amount, status, created_at, paid_at')
- ['exec-projects'] from('app_projects').select('status, created_at')
- ['exec-leads'] from('leads').select('status, created_at')
- ['exec-deals'] from('crm_deals').select('deal_value, stage, won, created_at')
- ['exec-content'] from('content_requests').select('status, created_at')
- ['exec-team'] from('team_memberships').select('*', {count:'exact', head:true})

### src/pages/AccountManagement.tsx — static marketing page, no data calls
### src/pages/DashboardPlanner.tsx — no direct calls; renders components/planner/PlannerBoard (out of scope here; its data goes through usePlannerTasks)
### src/pages/workshop/* (WorkshopLanding/Features/Guide) — static, no data calls

### src/pages/admin/AccountCreation.tsx — shell only; tabs render the three account-creation components
### src/pages/admin/AdminManagement.tsx
- functions.invoke('create-admin-account', body:{action:'create', email, password, fullName}) — create admin
- functions.invoke('create-admin-account', body:{action:'revoke', userId}) — revoke admin
- roster via useAdmins()

### src/pages/admin/account-creation/CreateAccountWizard.tsx
- admin type: functions.invoke('create-admin-account', body:{action:'create', email, password, fullName})
- other types: auth.getSession() + raw fetch functions/v1/create-client body {email, password, fullName, company?, phone?, plan? ('Preview Only' for live_preview), pageCount?, notes?, websiteStatus? (default 'design'), previewUrl?, accountType} — website fields omitted when preset hides them

### src/pages/admin/account-creation/ManageAdminsPanel.tsx
- functions.invoke('create-admin-account', body:{action:'create', email, password, fullName}) / body:{action:'revoke', userId}; roster via useAdmins()

### src/pages/admin/account-creation/AccountTypePresets.tsx
- from('account_type_presets').select('*') — load presets
- from('account_type_presets').upsert({account_type, visible_features, hidden_features, suppress_prompts, updated_at}) — save preset

### src/pages/admin/AdminMarketingWorkshop.tsx
- auth.getUser(); from('designer_sites').select('id').eq('id', cached).eq('user_id') / .eq('user_id').eq('site_name','__quooro_marketing_site__' const).order('created_at').maybeSingle() — resolve site
- from('designer_sites').insert({site_name, user_id}).select('id').single() + from('designer_pages').insert([{site_id, user_id, page_name:'Home', slug:'/', is_homepage:true}]) — first-run create

### src/pages/admin/AdminMarketingVisualEditor.tsx
- from('site_content').select('data').eq('section_key').maybeSingle() then auth.getUser() + from('site_content').upsert({section_key, data (merged field), updated_by}, {onConflict:'section_key'}) — inline field save; posts ve:refresh to iframe
- functions.invoke('marketing-copy-rewrite', body:{text, tone, field}) — AI rewrite

### src/pages/admin/AdminMarketing{Hero,Headers,Process,Why,Builder,SiteIndex}.tsx
- content read/write exclusively via useSiteContent(sectionKey) (see hook); role gate via useUserRole — no other calls

### src/pages/accountant/AccountantLogin.tsx
- auth.getSession() — redirect if signed in; auth.signInWithPassword({email, password})

### src/pages/accountant/AccountantAccept.tsx
- auth.getSession() + auth.onAuthStateChange — session watch
- from('acc_accountant_invites').select('id, email, status, expires_at, org_id').eq('token', token).maybeSingle() — invite lookup
- from('acc_organizations').select('name').eq('id', inv.org_id).maybeSingle() — org name
- auth.signUp({email: invite.email, password, options:{emailRedirectTo: origin+'/accountant/accept/'+token, data:{full_name}}}) or auth.signInWithPassword({email: invite.email, password})
- functions.invoke('acc-accept-invite', body:{token}) — accept

### src/pages/accountant/AccountantDashboard.tsx
- auth.getUser(); from('acc_org_members').select('org_id, role').eq('user_id', user.id).eq('role','accountant'); from('acc_organizations').select('id, name, base_currency').in('id', ids).order('name'); auth.signOut()

### src/pages/accountant/AccountantOrgView.tsx
- auth.signOut() — header sign-out; data itself lives in embedded OfficeAccounting (out of scope)

## components/admin

### src/components/admin/AdminCommandCenter.tsx (read-only Promise.all)
- from('client_invoices').select('*'); from('crm_deals').select('*'); from('app_projects').select('*'); from('profiles').select('*'); from('leads').select('id, created_at, source, status'); from('enquiries').select('id, status, created_at'); from('content_requests').select('id, status'); from('conversations').select('id'); from('support_tickets').select('id, status')

### src/components/admin/AdminClientAccounts.tsx
- from('client_teams').select('*').order('created_at' desc) — teams; per team: from('team_memberships').select('*').eq('team_id'); from('profiles').select('email, full_name, company, phone, enquiry_data').eq('user_id', primary_account_id).maybeSingle(); per member from('profiles').select('email, full_name, avatar_url').eq('user_id').single()
- from('client_pricing').select('*').eq('team_id').order('created_at' desc) — pricing list
- from('client_pricing').insert({team_id, service_type, service_name, negotiated_price, is_recurring, billing_frequency|null, notes|null, is_visible:true}) — add pricing
- from('team_memberships').update({member_role}).eq('id') — role change
- from('client_pricing').delete().eq('id'); .update({is_visible}).eq('id') — remove / toggle visibility

### src/components/admin/AdminInvoices.tsx
- from('client_invoices').select('*').order('created_at' desc) + from('client_teams').select('*').order('team_name') — load
- rpc('generate_invoice_number') then from('client_invoices').insert({team_id, invoice_number, items, amount, tax_amount, total_amount, due_date|null, notes|null, status:'pending', currency:'GBP'}) — create
- from('client_invoices').update({team_id, items, amount, tax_amount, total_amount, due_date|null, notes|null, status}).eq('id') — edit
- from('client_invoices').update({status[, paid_at]}).eq('id') — status; .delete().eq('id') — delete
- from('profiles').select('email').eq('user_id', team.primary_account_id).maybeSingle() — email for PDF

### src/components/admin/AdminBilling.tsx
- from('profiles').select('*').order('full_name') + from('client_billing').select('*') — load
- from('client_billing').update({plan_name, plan_price, billing_cycle, next_billing_date|null, payment_status, notes|null, add_ons}).eq('id') — edit
- from('client_billing').insert({user_id, plan_name, plan_price, billing_cycle, services, add_ons, one_off_charges:[], next_billing_date|null, payment_status, notes|null}) — create
- from('client_billing').update({one_off_charges, payment_status:'pending'}).eq('id') — add charge; .update({one_off_charges}).eq('id') — toggle paid; .update({payment_status:'pending'}).eq('id') — send payment request; .update({payment_status:'paid', one_off_charges}).eq('id') — mark paid
- invoice send: from('client_teams').select('id').eq('primary_account_id').maybeSingle() → fallback from('team_memberships').select('team_id').eq('user_id').maybeSingle(); rpc('generate_invoice_number'); from('client_invoices').insert({team_id, invoice_number, items[{name,price,quantity:1}], amount, tax_amount:0, total_amount, status:'pending', notes|null, currency:'GBP'}); then from('client_billing').update({one_off_charges, payment_status:'pending', notes}).eq('id')

### src/components/admin/AdminLeadManagement.tsx
- from('leads').select('*', {count:'exact'})[.eq('status')][.or(business_name/personal_name/contact_name/email/phone/location_city ilike)].order(sortField).range(from,to) — paged list (+decrypt_pii phone,email)
- from('user_roles').select('user_id').eq('role','admin') + from('profiles').select('user_id, full_name, email').in('user_id') — assignees
- from('lead_notes').select('*').eq('lead_id').order('created_at' desc) + from('lead_status_history').select('*').eq('lead_id').order('changed_at' desc) — detail
- from('leads').update({status}).eq('id') + from('lead_status_history').insert({lead_id, old_status, new_status, changed_by}) — status change (then re-select history)
- from('lead_notes').insert({lead_id, content, author_id}) — add note (then re-select)
- from('leads').delete().eq('id') — delete
- from('leads').update({business_name, contact_name, email, phone, website_url, category, location_city, updated_at}).eq('id') — inline edit
- CRM/proposals via useCRMDeals + useProposals hooks

### src/components/admin/LeadDetailDialog.tsx
- from('lead_notes').select('*').eq('lead_id').order('created_at' desc) + from('profiles').select('user_id, full_name').in('user_id', authorIds) — notes
- from('lead_status_history').select('*').eq('lead_id').order('changed_at' desc) + from('profiles').select('user_id, full_name').in('user_id', changerIds) — history
- from('leads').insert({business_name, personal_name, contact_name, is_personal, phone, email, website_url, location_city, location_postcode, google_rating, review_count, category, source:'manual', status:'new', assigned_to, tags}).select().single() — new lead
- from('leads').update({same fields + status, assigned_to, tags, last_contacted_at, updated_at}).eq('id') — edit; from('lead_status_history').insert({lead_id, changed_by, old_status, new_status}) on status change
- from('lead_notes').insert({lead_id, author_id, content}); .delete().eq('id', noteId)
- from('leads').delete().eq('id') — delete lead
- convert: functions.invoke('create-client', body:{email (or placeholder), password (temp), fullName, company, phone, plan:'Preview Only', websiteStatus:'design'}); from('leads').update({status:'converted', converted_client_id, updated_at}).eq('id'); from('profiles').update({notes}).eq('user_id', newClientId); from('lead_status_history').insert({lead_id, changed_by, old_status, new_status:'converted'})

### src/components/admin/LeadImportDialog.tsx
- from('leads').select('id').or(email.ilike / business_name.ilike).limit(1) — duplicate check per lead
- from('leads').insert(leadsToInsert[{…, source: sourceType, status:'new'}]) — batched insert
- from('lead_imports').insert([{imported_by, source_type, total_count, added_count, skipped_count, duplicate_count, import_log}]) — audit

### src/components/admin/AdminEnquiries.tsx
- from('enquiries').select('*', {count:'exact'})[.eq('status')][.or(name/first_name/last_name/email/company/phone ilike)].order('created_at' desc).range(from,to) — paged list (+decrypt_pii phone)
- from('enquiries').update({status}).eq('id'); .update({notes}).eq('id')
- convert→lead: from('leads').select('id').eq('email').maybeSingle() — dupe check; from('leads').insert({business_name|null, personal_name|null, contact_name, is_personal, phone|null, email, website_url|null, category|null, source:'manual', status:'new', tags:['from-enquiry'], enquiry_id, enquiry_data}); from('enquiries').update({status:'in-progress'}).eq('id')
- convert→client: auth.getSession() + raw fetch functions/v1/create-client body {email, password, fullName, company?, phone?, plan? (selected_package), pageCount?, notes?, websiteStatus:'design', enquiryId, enquiryData}

### src/components/admin/AdminMessaging.tsx
- channel('admin-messages').on('postgres_changes', {event:'INSERT', schema:'public', table:'messages'}).on('postgres_changes', {event:'UPDATE', schema:'public', table:'messages'}).subscribe(); removeChannel on cleanup
- from('profiles').select('id, user_id, email, full_name, customer_id, company').order('full_name') + from('messages').select('*').order('created_at' desc) + from('conversations').select('*') — inbox build
- from('messages').select('*').or(`sender_id.eq.${uid},recipient_id.eq.${uid}`).order('created_at' asc) — thread
- from('messages').update({is_read:true}).eq('sender_id', clientUserId).eq('is_read', false) — mark read
- from('messages').insert({sender_id, recipient_id, content}) — send
- from('conversations').update({status, closed_at|null, assigned_admin_id}).eq('id') or .insert({customer_id, assigned_admin_id, status, closed_at|null}) — conversation status
- typing via useTypingIndicator channel

### src/components/admin/AdminSupportTickets.tsx
- from('support_tickets').select('*').order('created_at' desc) + from('profiles').select('user_id, full_name, email, customer_id, company') — load
- from('support_tickets').update({status, priority}).eq('id') — save

### src/components/admin/AdminAnnouncements.tsx
- from('announcements').select('*').order('created_at' desc); .insert({title, content, priority, created_by}); .update({is_active, updated_at}).eq('id'); .delete().eq('id')

### src/components/admin/AdminKnowledgeBase.tsx
- from('knowledge_base').select('*').order('pinned' desc).order('updated_at' desc)
- payload {title, content, category, tags, status, pinned, last_edited_by}: .update(payload).eq('id') or .insert({…payload, author_id})
- .delete().eq('id'); .update({pinned}).eq('id')

### src/components/admin/AdminAutomationRules.tsx
- from('automation_rules').select('*').order('created_at' desc); from('automation_rule_logs').select('*').order('executed_at' desc).limit(100)
- payload {name, description|null, is_active, trigger_event, trigger_config, conditions, action_type, action_config}: .update(payload).eq('id') or .insert({…payload, created_by})
- .delete().eq('id'); .update({is_active}).eq('id')

### src/components/admin/AdminAppManagement.tsx
- from('app_projects').select('*').order('created_at' desc); from('profiles').select('id, user_id, full_name, email, company').order('full_name')
- from('app_projects').insert({user_id, project_name, project_type, description|null, status, priority, estimated_hours|null, start_date|null, target_completion_date|null, notes|null, admin_notes|null, preview_url|null, production_url|null, repository_url|null, assigned_to|null}) — create
- from('app_projects').update({same keys + completed_at when status='completed'}).eq('id'); .delete().eq('id')

### src/components/admin/AdminContentRequests.tsx
- from('content_requests').select('*').order('created_at' desc) + from('profiles').select('user_id, full_name, email, customer_id, company')
- storage.from('content-requests').upload(`delivered/${requestId}/${ts}-${rand}.${ext}`, file) + .getPublicUrl(fileName) — deliver files
- from('content_requests').update({status, assigned_to|null, admin_notes|null, delivered_content|null, delivered_files|null}).eq('id'); .delete().eq('id')

### src/components/admin/AdminAdManagement.tsx
- from('profiles').select('id, user_id, email, full_name, company, customer_id').order('full_name'); from('ad_campaigns').select('*').eq('user_id').order('created_at' desc)
- storage.from('ad-creatives').upload(`${user_id}/${ts}-${rand}.${ext}`, file) + .getPublicUrl — creative upload
- campaignData {user_id, platform, campaign_name, creative_url|null, creative_type, status, objective|null, start_date|null, monthly_budget|null, notes|null, last_updated_at}: .update(campaignData).eq('id') or .insert(campaignData); .delete().eq('id')

### src/components/admin/AdminSocialMedia.tsx
- from('profiles').select('*').order('full_name'); from('social_media_accounts').select('*').eq('user_id').order('created_at' desc) + from('social_media_posts').select('*').eq('user_id').order('scheduled_at' asc)
- accountData {user_id, platform, account_handle, account_name|null, profile_url|null, managed_by, posting_frequency, status, notes|null}: from('social_media_accounts').update(...).eq('id') or .insert(...); .delete().eq('id')
- storage.from('ad-creatives').upload(`${user_id}/${ts}.${ext}`, file) + .getPublicUrl — post media
- postData {account_id, user_id, title, content|null, media_url|null, media_type, scheduled_at|null, posted_at|null, status, notes|null}: from('social_media_posts').update(...).eq('id') or .insert(...); .delete().eq('id')

### src/components/admin/AdminMarketingCalendar.tsx
- from('profiles').select('id, user_id, email, full_name, customer_id, company, plan, status').order('full_name')
- per client: from('ad_campaigns').select('*').eq('user_id').order('start_date' desc); from('social_media_posts').select('*').eq('user_id').order('scheduled_at' desc); from('content_requests').select('*').eq('user_id').order('created_at' desc)

### src/components/admin/AdminWebsiteManagement.tsx
- from('profiles').select('*').order('full_name') — clients (parses version_history)
- storage.from('site-files').upload(`${user_id}/site-files-${ts}.${ext}`, file, {upsert:true, contentType}) + .getPublicUrl — site zip upload (500MB client cap)
- from('profiles').update({website_status, preview_url|null, domain_name|null, ssl_status, hosting_provider, site_files_url|null}).eq('id') — save
- from('profiles').update({version_history: JSON.stringify(history)}).eq('id') — add version

### src/components/admin/AdminAssetManagement.tsx
- from('profiles').select('user_id, full_name, email, avatar_url').order('full_name'); from('storage_quotas').select('*'); from('client_assets').select('*').order('created_at' desc)
- storage.from('client-assets').createSignedUrl(file_path, 60) — download
- storage.from('client-assets').remove([file_path]) + from('client_assets').delete().eq('id') — delete asset
- from('storage_quotas').update({quota_bytes}).eq('user_id') — quota edit

### src/components/admin/AdminGreetingMessages.tsx
- from('user_roles').select('user_id').eq('role','user'); from('profiles').select('user_id,email,full_name,company,avatar_url,customer_id').in('user_id') + from('greeting_messages').select('id,user_id,message,enabled').in('user_id')
- auth.getUser() + from('greeting_messages').upsert({user_id, message, enabled, updated_by[, created_by]}, {onConflict:'user_id'}).select('id').maybeSingle() — save/toggle

### src/components/admin/AdminSettings.tsx
- from('vault_configs').select('*').order('created_at' desc) + from('password_vault_configs').select('*').order('created_at' desc) — vault admin tab
- from('profiles').select('user_id, full_name, email, customer_id').in('user_id', userIds) — owner names
- sidebar folders/UI prefs via useTeamSidebarLayout + useUIPreferences (localStorage only)

### src/components/admin/AdminRoleManagement.tsx
- from('profiles').select('user_id, full_name, email, avatar_url, customer_id').order('full_name') — user picker
- from('rbac_audit_log').select('*').order('created_at' desc).limit(100) + from('profiles').select(same).in('user_id') — audit tab
- all mutations via useRBAC hook

### src/components/admin/AdminSecurityDashboard.tsx
- useTwoFactor: status + getAdminStats ({action:'admin-stats'}); embeds SecurityLogsPanel + IPManagementPanel; 2FA setup/disable dialogs use setup/verify-setup/disable actions

### src/components/admin/SecurityLogsPanel.tsx
- from('security_logs').select('*').order('created_at' desc).limit(100) + from('profiles').select('user_id, email, full_name').in('user_id') — enriched log list

### src/components/admin/IPManagementPanel.tsx (raw fetch → functions/v1/two-factor-auth)
- {action:'get-blocked-ips'} + {action:'get-whitelisted-ips'} — load
- {action:'block-ip', ipToBlock, reason, expiresIn|null}; {action:'unblock-ip', ipToUnblock}
- {action:'whitelist-ip', ipToWhitelist, notes}; {action:'remove-whitelist-ip', ipToRemove}

### src/components/admin/IPWorldMap.tsx / PaymentTrendsChart.tsx — props only, no data calls

### src/components/admin/AdminSiteAnalytics.tsx
- from('marketing_page_views').select('path, referrer, session_id, created_at').gte('created_at', since).order('created_at' desc).limit(50000)

### src/components/admin/AdminLiveSessions.tsx
- channel('lounge-presence', {config:{presence:{key:'admin-viewer'}}}).on('presence', {event:'sync'}).subscribe() — watches lounge presence; removeChannel on unmount

### src/components/admin/TeamInboxSettings.tsx
- from('user_roles').select('user_id').eq('role','admin') + from('profiles').select('user_id, email, full_name').in('user_id') + from('team_inbox_settings').select('*') — load
- from('team_inbox_settings').update({is_available, last_active_at}).eq('id') or .insert({admin_id, is_available}) — availability
- from('team_inbox_settings').update({is_primary:false}).neq('admin_id','placeholder') then .update({is_primary:true}).eq('id') or .insert({admin_id, is_primary:true, is_available:true}) — set primary


---

# CRM OVERHAUL ADDENDUM — 2026-07-30

# CRM Recon — Exhaustive Data Contract + PROTECTED Import-Engine List

Verified against DATA-CONTRACTS.md (§CRM WORKSPACE L395-420, §LoungeCRM L154-160, §hooks L451-457, §admin L725-753). Existing doc is accurate; additions/corrections marked (+).

## 1. CRM workspace `/lounge/crm` (src/pages/lounge/crm)

### useCRMData.ts
- `from('crm_companies'|'crm_contacts'|'crm_opportunities').select('*').order('updated_at' desc).range(from, from+999)` — fetchAll loop, 1000/page, hard stop 50k (L70-86)
- `from('crm_lifecycle_stages').select('*').order('order_index')` — stages {id, name, slug, color, order_index, category}
- `rpc('crm_timeline', {entity_type, entity_id, limit_count:50})` — rows use {event_type|kind, occurred_at, subject|title, body}
- `rpc('crm_entity_financials', {_entity_type, _entity_id})` — links [{finance_type, finance_id, reference, status, amount, currency}]
- `rpc('crm_entity_lifetime_value', {_entity_type, _entity_id})` — [{invoiced, paid, outstanding, currency}]
- `rpc('crm_set_lifecycle_stage', {_entity_type, _entity_id, _new_stage_id, _note:null})`
- Row shapes: CRMCompany {id, owner_id, name, legal_name, domain, website, industry, phone, email, city, country, notes, tags[], relationship_type[], lifecycle_stage_id, created_at, updated_at}; CRMContact {id, owner_id, company_id, full_name, first_name, last_name, email, phone, mobile, job_title, tags[], relationship_type[], lifecycle_stage_id, ...}; CRMOpportunity {id, owner_id, company_id, contact_id, title, description, value, currency, stage, probability, expected_close_date, lifecycle_stage_id, ...}. (+) org_id present on rows (used for orgId derivation) though not in the TS interfaces.

### CRMShell.tsx
- `from('crm_companies'|'crm_contacts'|'crm_opportunities').update({owner_id: userId|null}).in('id', targetIds)` — bulk assign (L104)
- WorkflowsView: `from('crm_workflows').select('*').order('priority')`; `from('crm_workflow_runs').select('*').order('created_at' desc).limit(20)` (L566-569; runs fetched, never rendered)

### EntityDetail.tsx
- `from(TABLE_FOR[entityType]).update({owner_id}).eq('id', entity.id)` — OwnerPicker (L351)
- `window.location.href = 'tel:' + number` after confirm dialog (L293)

### NotesPanel.tsx (notes = crm_communications rows)
- `from('crm_communications').select('id, body, subject, occurred_at, owner_id').eq('kind','note').eq(company_id|contact_id|opportunity_id, entityId).order('occurred_at' desc).limit(100)`
- `.insert({org_id, owner_id, kind:'note', direction:'internal', body, occurred_at, [entity fk]})`; `.delete().eq('id')`

### NewEntityDialog.tsx
- `from('crm_opportunities').insert({org_id, owner_id, title, value|null, currency:'GBP', description|null, contact_id|null, company_id|null})`
- `from('crm_contacts').insert({org_id, owner_id, full_name, email|null, phone|null, company_id|null, relationship_type:['lead']})`
- `from('crm_companies').insert({org_id, owner_id, name, email|null, phone|null, relationship_type:['lead']})`

### useAdmins.ts
- `from('user_roles').select('user_id').eq('role','admin')`; `from('profiles').select('user_id,email,full_name,is_owner').in('user_id', ids)`

### csvIO.ts (quick import/export engine)
- `supabase.auth.getUser()` — importer id
- org resolve: `from('user_roles').select('user_id, created_at').eq('role','admin').order('created_at' asc).limit(1).maybeSingle()` → orgId = first-created admin
- `from('crm_companies'|'crm_contacts'|'crm_opportunities').insert(rows, {count:'exact'})` — 200-row chunks; row keys per entity:
  - company {org_id, owner_id, name(name|company|business_name|'(Unnamed)'), legal_name, domain, website(website|website_url), industry(industry|category), phone, email, city(city|location_city), country, notes, tags(split |,;), relationship_type(split)||['lead']}
  - contact {org_id, owner_id, full_name(full_name|name|contact_name|personal_name), first_name, last_name, email, phone, mobile, job_title(job_title|title), notes, tags, relationship_type||['lead']}
  - opportunity {org_id, owner_id, title(title|name|'(Untitled)'), description, value:Number, currency||'GBP', stage, probability:Number, expected_close_date}
- Export: client-side toCSV over EXPORT_COLUMNS (no queries). No dedupe, no import audit row.

### CRMLeadImportDialog.tsx (rich import engine → crm_contacts only)
- `supabase.auth.getUser()`; org resolve same as csvIO (L224-227)
- Dedupe preload: `from('crm_contacts').select('email, phone, full_name').eq('org_id', orgId).limit(20000)` → signature Set (`e:`email.lower, `p:`phone-no-spaces, `n:`name.lower) (L230-237)
- `from('crm_contacts').insert(rows)` — 500-row chunks (L273); row = {org_id, owner_id, full_name(personal||contact||business), email, phone, job_title:category, source: tab+'_import'|'manual', relationship_type:['lead'], notes: 'Business: … • Web: … • City: … • Postcode: … • Rating: x (n) • Category: …'} — company/rating/location data FLATTENED into notes text (L255-270)
- No lead_imports audit row. Progress = processed/total per chunk.

## 2. Legacy client CRM `/lounge/crm-legacy` (LoungeCRM.tsx)
- `from('leads').select('*').order('updated_at' desc).limit(10000)` — fetchContacts
- Per selected: `from('lead_notes').select('*').eq('lead_id').order('created_at' desc)`; `from('lead_status_history').select('*').eq('lead_id').order('changed_at' desc)` (re-run after writes)
- `from('leads').update({status})` + `from('lead_status_history').insert({lead_id, old_status, new_status, changed_by})` — stage change (L296-302)
- `from('lead_notes').insert({lead_id, content, author_id})`
- `from('leads').delete().eq('id')`
- `from('leads').update({business_name, contact_name, email, phone, website_url, category, location_city}).eq('id')` — inline edit (personal_name/postcode NOT saved)
- `from('leads').insert({business_name, personal_name, contact_name, email, phone, website_url, category, location_city, location_postcode, status, source, is_personal, assigned_to:user.id})` — add contact
- Import: `from('leads').insert(chunk)` — 50-row chunks, mapped keys + defaults {status:'new', source:'csv_import', assigned_to:user.id} (L443-449). (+) No PII decrypt on this surface (admin twin decrypts).
- via useCRMDeals / useProposals (below). Export: client-side CSV, no query.

## 3. Shared satellites (src/components/crm + hooks)
### FullScreenLeadView.tsx
- `from('lead_notes')`/`from('lead_status_history')` selects as above (L112-114)
- `from('leads').update({status})` + history insert (L126-132); `from('leads').update({business_name, contact_name, email, phone, website_url, category, location_city, location_postcode, updated_at})` (L141-151); `from('lead_notes').insert` (L165); `from('leads').delete()` (L177)
### useCRMDeals.ts
- `from('crm_deals').select('*').order('updated_at' desc)` — NOT user-filtered on read (RLS-dependent); insert IS user-scoped: `.insert({user_id, deal_name, stage, probability, deal_value, currency:'GBP', expected_close_date, contact_name, company_name, description, lead_id}).select().single()`
- `from('crm_deals').update(updates).eq('id')`; `.delete().eq('id')`
- `from('crm_deal_activities').insert({deal_id, user_id, activity_type:'created'|'stage_change', old_value?, new_value, description})`
- On stage→'won': `from('client_onboarding').insert({user_id, deal_id, client_name, client_email:null, company_name, status:'pending', account_created:true, account_created_at})` (silent-fail)
### useProposals.ts
- `from('proposals').select('*').eq('user_id').order('created_at' desc)`; `rpc('generate_proposal_number')`
- `.insert({user_id, proposal_number, template_type, status:'draft', lead_id, client_name, client_email, client_company, client_phone, title, introduction, scope_items(json), pricing_items(json), total_amount, currency:'GBP', valid_until, terms}).select().single()`; `.update(partial).eq('id')`; `.delete().eq('id')`; send = update {status:'sent', sent_at}
### useClientPricing.ts — checked, NOT CRM (team_memberships/client_teams/client_pricing/client_invoices/client_contracts; LoungeBilling only)

## 4. Team side (src/components/admin)
### AdminLeadManagement.tsx (currently unmounted)
- `from('leads').select('*', {count:'exact'})[.eq('status')][.or(business_name|personal_name|contact_name|email|phone|location_city .ilike.%q%)].order(sortField, asc only for name).range(page*50)` → `decryptPiiFields(rows, ['phone','email'])` (rpc `decrypt_pii` per unique ENC: value, cached)
- `from('user_roles').select('user_id').eq('role','admin')` + `from('profiles').select('user_id, full_name, email').in('user_id')`
- notes/history selects, status update + history insert, note insert, delete, inline edit update (+updated_at) — same shapes as legacy
- Export CSV client-side (only the loaded page)
### LeadDetailDialog.tsx
- `from('lead_notes').select.eq('lead_id')` + `from('profiles').select('user_id, full_name').in('user_id', authorIds)`; same for history/changerIds
- create: `from('leads').insert({business_name, personal_name, contact_name, is_personal, phone, email, website_url, location_city, location_postcode, google_rating, review_count, category, source:'manual', status:'new', assigned_to, tags}).select().single()`
- update: same fields + {status, assigned_to, tags, last_contacted_at(auto on →contacted), updated_at}; `lead_status_history.insert` when status changed
- `from('lead_notes').insert / .delete().eq('id')`; `from('leads').delete().eq('id')`
- Convert: `supabase.functions.invoke('create-client', {body:{email|placeholder 'lead-XXXX@placeholder.com', password(random temp), fullName, company, phone, plan:'Preview Only', websiteStatus:'design'}})` → `from('leads').update({status:'converted', converted_client_id, updated_at})` → `from('profiles').update({notes:'Lead notes:…'}).eq('user_id', newClientId)` → history insert
### LeadImportDialog.tsx
- Dupe check per lead: `from('leads').select('id').or(phone.eq.X, email.ilike.Y, business_name.ilike.%Z%).limit(1)` (L367-382 — unescaped values into .or())
- `from('leads').insert(leadsToInsert)` — batches of 10; row {business_name, personal_name, contact_name, is_personal, phone, email, website_url, location_city(street+city merge), location_postcode, google_rating, review_count, category, source: 'csv_import'|'json_import'|'html_import'|'manual', status:'new'}
- Audit: `from('lead_imports').insert([{imported_by, source_type, total_count, added_count, skipped_count, duplicate_count, import_log(json per-lead status)}])` (L479-487) — ONLY import engine that logs
### AdminEnquiries.tsx
- `from('enquiries').select('*', {count:'exact'})[.eq('status')][.or(name|first_name|last_name|email|company|phone ilike)].order('created_at' desc).range` + decryptPiiFields(['phone'])
- `from('enquiries').update({status}).eq('id')`; `.update({notes}).eq('id')`
- convert→lead: `from('leads').select('id').eq('email').maybeSingle()`; `from('leads').insert({business_name|null, personal_name|null, contact_name, is_personal, phone|null, email, website_url|null, category(business_type|interest)|null, source:'manual', status:'new', tags:['from-enquiry'], enquiry_id, enquiry_data(whole enquiry json)})`; `from('enquiries').update({status:'in-progress'})`
- convert→client: `auth.getSession()` + raw `fetch(${VITE_SUPABASE_URL}/functions/v1/create-client, POST, Bearer access_token, body:{email, password, fullName, company?, phone?, plan(selected_package)?, pageCount?, notes?, websiteStatus:'design', enquiryId, enquiryData})`
No realtime channels anywhere in CRM scope. Edge functions used: `create-client` (2 call styles: functions.invoke + raw fetch); rpc: `crm_timeline`, `crm_entity_financials`, `crm_entity_lifetime_value`, `crm_set_lifecycle_stage`, `generate_proposal_number`, `decrypt_pii`.

## 5. PROTECTED LIST — import-engine code (do not rewrite during overhaul)
Every file containing parsing/extraction/mapping/dedupe/batching/progress logic, with engine vs shell split:

### src/pages/lounge/crm/csvIO.ts — ENTIRE FILE ENGINE (L1-155)
- csvEscape L5-10; toCSV L12-16; parseCSV L18-46 (stateful quote-aware char parser — the good one); downloadCSV L48-54; EXPORT_COLUMNS L57-61; exportEntities L64-68; splitArray L71-74; importEntities L76-155 (auth, org resolve, header-synonym mapping, 200-chunk insert, inserted/failed/errors accounting)

### src/pages/lounge/crm/CRMLeadImportDialog.tsx (444)
- ENGINE: ParsedLead/ImportResult types L23-37; FIELD_OPTIONS mapping vocab L39-52; emptyLead L54-59; autoMap L61-78; parseCSVText L80-91 (per-line quote toggle — cannot handle embedded newlines); handleCsv L118-127; handleXlsx L130-144 (XLSX.read sheet_to_json header:1); handleJson L147-172 (key-synonym extraction incl. Google-Maps export keys title/totalScore/reviewsCount/categoryName); parseHtml L175-199 (DOMParser tr/td + content-type heuristics: phone regex, @-email, url, rating, review count, fallback name); applyMapping L202-217; runImport L220-285 (org resolve, 20k dedupe signature set, 500-chunk build incl. notes flattening, insert, progress/processed state); previewCounts L287-291
- SHELL: L293-444 (Dialog frame, result stats screen, Progress display, preview table, mapping table UI, tab dropzones + hidden file inputs, HTML textarea, manual form grid)

### src/components/admin/LeadImportDialog.tsx (1007)
- ENGINE: ParsedLead/ImportResult L39-60; fieldOptions L100-113; handleJsonUpload L146-194; handleCsvUpload L197-256 (line parser + autoMapping block L226-251); parseHtmlTable L259-326; processCsvMapping L329-364; checkDuplicate L367-382; formatTimeRemaining L385-390; importLeads L393-501 (BATCH_SIZE 10, Promise.all dupe checks, street+city merge, insert, importLog build, progress % + rolling ETA refs L77-82, lead_imports audit L479-487); handleManualSubmit L504-510
- SHELL: L512-1007 (Dialog, result screen, tab dropzones w/ drag-drop handlers L586-607/726-748 — the onDrop file handoff is the engine boundary, visuals are shell — mapping grid, preview tables, progress panels, manual form)

### src/pages/lounge/LoungeCRM.tsx (import engine embedded, L387-476)
- ENGINE: parseCSV L388-398 (regex `(".*?"|[^,]+)` splitter — quote/comma fragile); handleImportFile L400-425 (FileReader + auto-map incl. dbFields normalization); runImport L427-457 (mapping application, defaults, 50-chunk insert, added count); exportCSV L460-476
- SHELL: import modal JSX L1402-1519 (dropzone label, mapping grid, 5-row preview table, footer buttons)

### src/pages/lounge/crm/ImportExportMenu.tsx (92) — thin adapter
- Engine-adjacent: handleExport L21-28, handleTemplate L30-32, handleFile L36-55 (`file.text()` → importEntities → result toast). Menu JSX L57-92 = shell.

### src/components/admin/AdminLeadManagement.tsx
- Engine: exportCSV L327-344 (header list + escaping). Rest of file = shell/list logic.

### src/components/admin/AdminEnquiries.tsx
- Engine (ingestion pathway): convertToLead L149-196 (email dupe check, field mapping enquiry→lead, enquiry_data embed, status flip). convertToClient L198-253 is account-creation, not import — treat as protected contract regardless (edge-fn payload shape).

### Supporting protected contracts (not import code but engines depend on them)
- src/lib/piiDecrypt.ts (decrypt_pii rpc + cache) — read-side of admin lead lists
- `lead_imports` insert shape (audit); `leads` insert shapes; `crm_contacts` insert shape + dedupe signature scheme

### Explicitly SHELL (safe to restyle): all dropzone visuals, progress bars/ETA display markup, preview/mapping table styling, tab triggers, result-stat cards, buttons — in all three dialogs; the numbers they display come from engine state (progress, processed, currentLeadIndex, estimatedTimeRemaining, result counts) which must keep feeding them.

## 6. Cross-engine divergence table (behavioural contract, keep in mind for any unification)
| | csvIO (workspace quick) | CRMLeadImportDialog (workspace rich) | LoungeCRM legacy | Admin LeadImportDialog |
|---|---|---|---|---|
| Target table | crm_companies/contacts/opportunities | crm_contacts only | leads | leads |
| Formats | CSV | CSV, XLSX, JSON, HTML, manual | CSV | CSV, JSON, HTML, manual |
| CSV parser | char-state, quote+newline safe | per-line quote toggle | regex split | per-line quote toggle |
| Mapping UI | none (header synonyms) | yes + autoMap | yes + autoMap | yes + autoMap |
| Dedupe | none | preloaded 20k signature set (email/phone/name) | none | per-lead .or() query |
| Chunk size | 200 | 500 | 50 | 10 (+parallel dupe checks) |
| Audit log | no | no | no | lead_imports yes |
| Progress UI | busy spinner only | % + processed | button label only | % + processed + ETA |
| Owner default | owner_id = importer | owner_id = importer | assigned_to = importer | none (unassigned) |
