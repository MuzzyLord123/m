<!-- Platform overhaul Phase 0 · interactive flows (regression checklist) · 2026-07-29 -->
# FLOWS.md

Every interactive flow, both roles. Walked at the end of every overhaul
phase; each must behave identically to the pre-overhaul build, with
requests matching DATA-CONTRACTS.md.

## CLIENT PORTAL

- Overview: load dashboard batch; log activity (edge fn); live feed realtime (content_requests/app_projects/leads); global search (ilike ×2); onboarding step complete/dismiss
- Uploads/CustomerDashboard: list uploads; upload file→insert record; delete record→remove file
- Asset Storage: list folders/tags/assets/quota; upload+insert+tag-assign; create folder/tag; star; download/preview (signed URL + counters); delete asset/folder
- Billing: fetch billing; check subscription per plan; start checkout; open customer portal; save plan+add-ons (insert/update); view team pricing/invoices/contracts (hook)
- Messages: fetch thread; send; mark-read; realtime INSERT; typing broadcast
- Tickets: list; create (rpc ref + messages insert + support_tickets insert)
- AI Assistant: list/create/rename/archive/delete conversations; send message (stream via quooro-chat); persist user+assistant msgs; escalate→message+ticket
- AI Intelligence: metrics batch; create/delete KPI; ask AI (quooro-chat stream)
- Website Designer: list sites; check/create designer subscription; portal; create site (blank/template)+pages; delete single/bulk; AI builder (ai-website-builder→site+pages)
- Website Editor: load site/pages; save via SaveToFiles; publish (deploy-site fn, archive/live deployment rows); custom domain add/remove; site settings save; favicon upload; delete site
- Website Management: profile site card; last 5 website_section requests; submit change request
- Content Requests: list mine; create (with file upload to bucket + URLs); App Projects: list; submit app_change request
- Mail: connect OAuth (get_auth_url/exchange_code + user_connections upsert); list accounts/messages; sync; send; star/read; disconnect; realtime on both tables
- CRM (leads): list 10k; select→notes+history; add note; change status (+history insert); edit; create; delete; CSV import (chunks); deals CRUD + activities (hook); proposals CRUD (hook)
- CRM workspace (crm/): paged entity fetch; create company/contact/opportunity; notes add/delete; timeline/financials/LTV/lifecycle (rpcs); bulk owner assign; CSV import/export; workflows list
- Team: resolve/create team (rpc code); list members+profiles; change role; remove member; create member login (edge fn); channel membership add/remove/mute
- White label: load/save brand settings; upload personal/team logo; toggle badge; push logo to member; team branding list
- Settings: load/save profile; avatar upload/replace/remove; connections list/save/delete (ConnectionsSettings); Google Calendar connect
- Calendar: range fetch; create/update/delete event; Google import/push (edge fns)
- Notifications: list; mark one/all read; delete one/all; realtime INSERT/DELETE
- Team calls (global): incoming-call realtime; start/accept/decline/end call; busy check; call notification insert
- Products (storefront): list products/categories/sites; product create/edit/duplicate/delete/status/feature; category CRUD; variant CRUD; orders list
- Ecommerce workspace: home stats; products CRUD; collections CRUD; orders/customers/inventory views; payment+store settings upsert; image upload (bucket product-images); embed snippet gen
- Inventory: bootstrap settings+default location; companies CRUD (+bulk delete); products CRUD (+category quick-add, stock level init); stock adjust (movement+level upsert); locations CRUD/default/toggle; stock count create→seed items→count→finalize (movements+levels+session); reports (valuation/movements/reorder)
- Office hub/OneDrive: recent files+docs; star/trash; new doc; Word home: list/create/duplicate/star/delete
- OneNote: load/autosave notebook to platform_files; PDF home: list/star/trash; Invoices: register generated invoice in platform_files
- Sticky Wall: load/save wall; home list/star/delete; Wiki: list/create/star/edit/delete; Calculator: history load/save/clear; Pomodoro: sessions load/complete; TimeTracker: entries load/timer save/manual add/delete
- Expenses: list; add (manual or parse-receipt AI); approve/reject; delete. HR: employees add/remove; time-off approve/deny; candidates stage advance; reviews list
- Password Vault: list vaults; create vault; unlock (failed_attempts counters); items list/add/star/delete
- Polls: list mine (+options/votes/voter names); create (+options); vote; close; delete; share to channel/DM (ensure membership/DM channel, comm_messages insert)
- Automations Pro: runs list; schedules create/toggle/delete; API keys create/delete
- SEO checker: scrape URL/sitemap/robots (edge fn ×4). Ad/Social/Marketing calendar: read-only lists
- Subscription sites (OfficeEcommerce): list+realtime; create/edit (+event rows); status change; delete; link accounting (orgs/customers/accounts/invoices); generate AR invoice (+line, renewal bump, event)
- Accounting: org bootstrap/select (owner or accountant membership); COA CRUD; manual journal post/reverse (lines, posted_at, rollback deletes); trial balance; AR/AP full cycle (customers/suppliers, invoices/bills+lines, post/void via rpc, payments+post rpc, aging); banking (accounts, CSV txn import, matching/journal-from-txn rpcs, reconciliation sessions+complete rpc); payroll (employees, pay runs, payslips seed/edit, recalc/post/pay rpcs); VAT (calc/create/submit/pay rpcs); fixed assets (create, acquisition/dispose/depreciation rpcs); FX rates CRUD + revaluation rpc; reports (reportsData/Extra selects + recalc audit inserts) with realtime bump channels; audit trail realtime; accountant invites (create/revoke/email fn, login-creation fn, member remove); submit-for-assessment (edge fn with attachment)
- CAD Studio: list/sort projects; create/duplicate/rename/delete
- Sidebar personalization: load/save layout (upsert); account-type presets; unread badge realtime; presence tracking; paywall check/checkout

## QUOORO OFFICE + AUTH


**SignInSelect / UnifiedSignIn** — login: signInWithPassword → user_roles role gate → profiles cache → security-log → check-ip → route (/dashboard | /lounge | /accountant/dashboard | /verify-new-ip | /verify-2fa); forgot password: resetPasswordForEmail(redirect /reset-password); accountant ID → `@acct.quooro.app` email; Google: signInWithOAuth.
**Login (Team)** — login: signIn → user_roles .single() admin gate (deny = signOut) → security-log events → profiles.two_factor_enabled → checkIP/addKnownIP → /verify-2fa | /verify-new-ip | /dashboard.
**CustomerLogin** — signup: optional lookup_team_by_code rpc ×2 → auth.signUp(metadata) → send-verification-email invoke (is_resend variant for existing) → /check-email.
**CheckEmail** — poll profiles.email_verified every 3s → /lounge; resend: send-verification-email {user_id, is_resend}; dev token from profiles.verification_token.
**VerifyEmail** — rpc verify_email_token(p_token); resend via getUser + send-verification-email.
**Verify2FA** — two-factor-auth {action:'verify'|'verify-backup', code}; sign out = quickSignOut.
**VerifyNewIP** — two-factor-auth {action:'verify-ip', code, ip}; sign out = quickSignOut.
**ResetPassword** — setSession from recovery hash → auth.updateUser({password}) → /lounge.
**AccountSwitcher** — setSession(saved tokens) + full reload; fallback prefill email.
**Logout (all admin/team shells)** — AuthContext.signOut (profiles name cache + auth.signOut) or quickSignOut.
**Dashboard (Quooro Office hub)** — enquiry list/filter/status/notes; client list/filter/edit (profiles.update); uploads list/status/delete (+storage remove); create client (create-client raw fetch); reset client password (reset-client-password raw fetch); delete client (delete-client invoke, typed confirm).
**ExecutiveDashboard** — read-only KPI queries under exec-* queryKeys.
**AccountCreation wizard** — create admin (create-admin-account {action:'create'}) or client (create-client raw fetch with accountType); manage admins (create/revoke); presets upsert account_type_presets.
**Marketing suite** — section edit/save via site_content upsert (useSiteContent); visual editor per-field merge upsert + marketing-copy-rewrite invoke; workshop resolves/creates designer_sites + designer_pages; analytics reads marketing_page_views.
**Accountant portal** — login (signInWithPassword); invite accept (invite lookup → signUp/signIn → acc-accept-invite invoke); dashboard org list (acc_org_members → acc_organizations); logout signOut.
**Client Accounts** — team/member browse; member role change (team_memberships.update); pricing add/delete/toggle-visibility (client_pricing).
**Invoices** — create (rpc generate_invoice_number + insert), edit, status/paid_at, delete, PDF (profiles email lookup).
**Billing** — create/edit client_billing; add one-off charge; toggle charge paid; send payment request; mark paid; send invoice (team lookup → rpc → client_invoices insert → billing sync).
**Leads CRM** — paged/filtered list; status drag (leads.update + history insert); notes add/delete; lead create/edit/delete; CSV/HTML import (dupe check, batch insert, lead_imports log); convert→client (create-client invoke + leads/profiles/history updates); deals via useCRMDeals (auto client_onboarding on won); proposals via useProposals (rpc generate_proposal_number).
**Enquiries** — paged/filtered list; status/notes update; convert→lead (leads insert + enquiry status); convert→client (create-client raw fetch).
**Messaging** — realtime admin-messages channel (messages INSERT/UPDATE); thread fetch; send (messages.insert); mark read; conversation open/waiting/closed (conversations upsert-ish); typing broadcast channel.
**Support / Announcements / KB / Automation** — ticket status+priority update; announcement create/toggle/delete; KB article CRUD + pin; automation rule CRUD + toggle (logs read-only).
**App projects** — CRUD on app_projects with full form payload.
**Content requests** — status/assign/notes/delivery update with storage uploads to content-requests bucket; delete.
**Ads / Social / Calendar** — campaign CRUD + creative upload (ad-creatives); social account & post CRUD + media upload (ad-creatives); calendar reads per-client campaigns/posts/requests.
**Website management** — site-files upload (site-files bucket, upsert) then profiles website fields update; version history append.
**Assets** — browse profiles/storage_quotas/client_assets; signed-url download; delete (storage remove + row delete); quota edit.
**Security** — 2FA setup/verify-setup/disable + admin-stats (two-factor-auth); security_logs panel read; IP block/unblock/whitelist/remove (two-factor-auth actions); trusted IPs via useIPCheck.
**RBAC** — role create/edit/delete/duplicate; permission toggle/bulk; user role assign/remove; every mutation writes rbac_audit_log; audit tab read.
**Greetings / Team inbox / Live sessions** — greeting upsert per client; inbox availability + primary admin upserts; live presence via lounge-presence channel (read-only).
**Settings** — vault configs read-only lists; sidebar folders + UI prefs are localStorage only (no network).
