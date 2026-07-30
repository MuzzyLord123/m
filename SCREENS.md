<!-- Platform overhaul Phase 0 · screen inventory · 2026-07-29 -->

# Quooro Platform Screen Inventory (authenticated surfaces)

Repo root: `/home/user/m` — all file paths below are relative to it. Router: `src/App.tsx` (single flat `<Routes>`; only `/lounge` uses nested child routes via `LoungeLayout`'s `<Outlet/>`).

## Summary

**Route totals** (from `src/App.tsx`):
- **Client Portal (lounge core):** 31 routes — `/lounge` + 29 children + `/customer-dashboard`
- **Client Portal (full-screen apps, shared w/ admins):** 49 routes — office suite (42), design/CAD/site editors, photo studio
- **Ambiguous (shared team/customer):** 2 — `/lounge/crm`, `/lounge/crm-legacy`
- **Quooro Office (team/admin):** 15 routes + 1 redirect — `/dashboard` (36 tabs), planner, executive, 2 `/team/*` pages, 9 `/admin/marketing-site*` pages
- **Accountant Portal (external accountant face):** 2 routes (+2 auth)
- **Auth:** 11 screens
- **Public utility (unauthenticated):** 2 — `/checkout`, `/book/:slug`
- **Marketing/legal (public):** 51 routes + `*` NotFound catch-all — counted only, not listed
- **Platform grand total: 110 routes** (incl. auth, excl. marketing & public utility)

**Guard mechanics (5 lines):**
1. `ProtectedRoute` (`src/components/ProtectedRoute.tsx`) — session-presence only (`useAuth`), no role check; redirects to `/sign-in`.
2. `TeamGuard` (`src/components/guards/TeamGuard.tsx`) — **admin only** (`useUserRole` → Supabase `user_roles` table); non-admins are security-logged, force-signed-out, sent to `/unauthorized`.
3. `CustomerGuard` (`src/components/guards/CustomerGuard.tsx`) — **role `user` only**, 5-min auth cache; admins are bounced to `/dashboard` EXCEPT on shared-app paths (`/lounge/office*`, `/lounge/creative*`, `/lounge/editor*`, `/lounge/cad-studio*`, `/lounge/ai-builder`, `/lounge/site-settings*`, `/lounge/crm*`) where admins pass through.
4. `ExecutiveGuard` (`src/components/guards/ExecutiveGuard.tsx`) — admin OR executive; gates `/executive` only. `/admin/marketing-site*` pages use `ProtectedRoute` + an inline `isAdmin` check ("Admins only.") inside each page.
5. Roles come from `useUserRole` (`src/hooks/useUserRole.ts`), defaulting to `user` when unassigned. **`financial` and `team_member` roles have NO dedicated guard/surface** — they fail both TeamGuard and CustomerGuard → `/unauthorized`. The Accountant portal bypasses app_role entirely: inline `supabase.auth` session checks + `acc_org_members.role='accountant'` rows.

**Layout shells:**
- **`LoungeLayout`** — `src/components/lounge/LoungeLayout.tsx`. Client Portal chrome: `PortalSidebar` (DnD folders, collapsible, position left/right/top/bottom per user pref), sticky top header (logo, `GlobalSearch`, notification bell → messages, theme toggle, burger), mobile Sheet drawer + `MobileBottomNav`, `FloatingDock`, `LoungeBackground`, splash screen, 2FA + email-verification banners, incoming-call overlay; applies UI prefs (accent, density, card style, font size) as body classes.
- **`TeamLayout`** — `src/components/layout/TeamLayout.tsx`. Quooro Office chrome: `TeamSidebar` (collapsible) + mobile Sheet nav listing 37 tab items, topbar (logo, avatar, theme toggle, sign-out), 2FA warning; tab-driven (`activeTab`/`onTabChange` — content is tabs inside `/dashboard`, not routes). Also used by `SubscriptionWebsitesPage` and `HostedWebsitesPage`.
- **Accountant shell** — no shared component; each `src/pages/accountant/*` page renders its own minimal sticky header (emerald Calculator badge, sign-out). `AccountantOrgView` wraps the shared `OfficeAccounting` app.
- **`CRMShell`** — self-contained fixed-inset app shell (own topbar w/ "Exit to Team/Lounge", 240px sidebar, mobile Sheet nav); not inside LoungeLayout.
- **Full-screen apps** (`/lounge/office/*`, editors, design studio) render their own chrome; no shared shell.

**Flags:** `AccountManagement.tsx` (`/account-management`) is a **marketing service page** ("Service 05 — account management") despite the name — counted under marketing. `StoreCheckout` (`/checkout`) is **unauthenticated** (public storefront checkout). Dead imports in App.tsx (no route): `LoungeWorkshop`, `AdminManagement`. `AccountCreation` (`src/pages/admin/AccountCreation.tsx` + `account-creation/` wizard) is reachable only as a Dashboard tab (`/dashboard?tab=account-creation`; `/admin/team` redirects there).

---

## Auth (11 screens)

| path | component file | guard/role | face | purpose |
|---|---|---|---|---|
| /sign-in | src/pages/SignInSelect.tsx → src/components/auth/UnifiedSignIn.tsx | none | Auth | unified sign-in ("Welcome back") with Customer/Team account-type toggle, saved-accounts picker; routes admins to Team Portal |
| /login | src/pages/Login.tsx | none | Auth | Team Portal (admin) login |
| /customer-login | src/pages/CustomerLogin.tsx | none | Auth | customer login + "Create account" signup split-panel |
| /reset-password | src/pages/ResetPassword.tsx | none | Auth | set new password after recovery link |
| /verify-email | src/pages/VerifyEmail.tsx | none | Auth | email verification landing/confirmation |
| /check-email | src/pages/CheckEmail.tsx | ProtectedRoute | Auth | "check your inbox" holding screen post-signup |
| /verify-2fa | src/pages/Verify2FA.tsx | ProtectedRoute | Auth | TOTP two-factor challenge |
| /verify-new-ip | src/pages/VerifyNewIP.tsx | ProtectedRoute | Auth | new-device/IP identity verification |
| /unauthorized | src/pages/Unauthorized.tsx | none | Auth | "Access Denied" — wrong-portal/role error with attempted-portal context |
| /accountant | src/pages/accountant/AccountantLogin.tsx | none (inline session redirect) | Auth | Accountant Portal email/password login |
| /accountant/accept/:token | src/pages/accountant/AccountantAccept.tsx | none (token validation) | Auth | accountant invite acceptance — signup/signin against `acc_accountant_invites` |

## Client Portal — Lounge core (LoungeLayout children + customer dashboard)

Guard for all rows: `ProtectedRoute` + `CustomerGuard` (role `user`; admins redirected to `/dashboard`). All render inside `LoungeLayout`.

| path | component file | face | purpose | notes (key screens) |
|---|---|---|---|---|
| /lounge | src/pages/lounge/LoungeOverview.tsx | Client Portal | client home dashboard | KPI cards w/ trends, DashboardCharts, LiveActivityFeed, UsageInsights, ActivityHeatmap, ClientHealthScore, OnboardingWizard, GreetingBanner, quick-nav grid |
| /lounge/ai | src/pages/lounge/LoungeAI.tsx | Client Portal | AI assistant hub | |
| /lounge/tickets | src/pages/lounge/LoungeTickets.tsx | Client Portal | support tickets list | status filter select; Create Ticket dialog (priority low→urgent); ticket-detail dialog w/ reference id + thread |
| /lounge/team | src/pages/lounge/LoungeTeam.tsx | Client Portal | client team management | tabs: Members / Roles; invite sub-tabs Share Code / Create Account; Update Member Role dialog |
| /lounge/website | src/pages/lounge/LoungeWebsiteManagement.tsx | Client Portal | website management/status | |
| /lounge/website-designer | src/pages/lounge/LoungeWebsiteDesigner.tsx | Client Portal | website dashboard/designer entry | |
| /lounge/apps | src/pages/lounge/LoungeAppProjects.tsx | Client Portal | app project tracking | |
| /lounge/products | src/pages/lounge/LoungeProducts.tsx | Client Portal | products catalog | |
| /lounge/seo-checker | src/pages/lounge/LoungeSEOChecker.tsx | Client Portal | SEO checker tool | |
| /lounge/ads | src/pages/lounge/LoungeAdManagement.tsx | Client Portal | ad campaign management | |
| /lounge/social | src/pages/lounge/LoungeSocialMedia.tsx | Client Portal | social media management | |
| /lounge/content | src/pages/lounge/LoungeContentRequests.tsx | Client Portal | content request submission/tracking | |
| /lounge/calendar | src/pages/lounge/LoungeCalendar.tsx | Client Portal | calendar (Google Calendar integration) | |
| /lounge/google-calendar-callback | src/pages/lounge/GoogleCalendarCallback.tsx | Client Portal | OAuth callback (utility, not a real screen) | |
| /lounge/marketing-calendar | src/pages/lounge/LoungeMarketingCalendar.tsx | Client Portal | marketing calendar | |
| /lounge/uploads | src/pages/lounge/LoungeUploads.tsx | Client Portal | file uploads to team | Create Upload dialog; upload-detail/preview dialog |
| /lounge/assets | src/pages/lounge/LoungeAssetStorage.tsx | Client Portal | asset storage browser | |
| /lounge/vault | src/pages/lounge/LoungeVault.tsx | Client Portal | secure vault | |
| /lounge/mail | src/pages/lounge/LoungeMail.tsx | Client Portal | email client (inbox/compose) | |
| /lounge/messages | src/pages/lounge/LoungeMessages.tsx | Client Portal | 1:1 support chat w/ Quooro team | single-thread realtime chat, typing indicator, read receipts (no tabs) |
| /lounge/team-comms | src/pages/lounge/LoungeTeamComms.tsx | Client Portal | team chat/calls | |
| /lounge/billing | src/pages/lounge/LoungeBilling.tsx | Client Portal | billing & subscriptions | 5 tabs: My Pricing / Subscriptions / Checkout / Invoices / History (+website TabsContent); 2-step checkout flow (selection → billing) |
| /lounge/settings | src/pages/lounge/LoungeSettings.tsx | Client Portal | account settings | 8 side-tabs: Profile / Security / UI / Theme / Sidebar / Device / Performance / Connections |
| /lounge/workflows | src/pages/lounge/LoungeWorkflows.tsx | Client Portal | workflow automations | |
| /lounge/notifications | src/pages/lounge/LoungeNotifications.tsx | Client Portal | notification center | |
| /lounge/cad-studio | src/pages/lounge/LoungeCADStudio.tsx | Client Portal | CAD studio home (projects list) | |
| /lounge/inventory | src/pages/lounge/LoungeInventory.tsx | Client Portal | inventory dashboard | |
| /lounge/white-label | src/pages/lounge/LoungeWhiteLabel.tsx | Client Portal | white-label & branding config | |
| /lounge/automations-pro | src/pages/lounge/LoungeAutomationsPro.tsx | Client Portal | advanced automations | |
| /lounge/planner | src/pages/lounge/LoungePlanner.tsx | Client Portal | planner board | |
| /lounge/bookings | src/pages/lounge/LoungeBookings.tsx | Client Portal | bookings/scheduling management (public page at /book/:slug) | |
| /customer-dashboard | src/pages/CustomerDashboard.tsx | Client Portal | legacy "Quooro Lounge" customer dashboard (welcome, website status, uploads) — own chrome, not LoungeLayout | |

## Client Portal — full-screen apps (own chrome, shared with admins)

Guard for all rows: `ProtectedRoute` + `CustomerGuard` **shared-path carve-out** → role `user` OR `admin`. Face: Client Portal (admins reach the same screens from Dashboard tabs). No shared shell — each app renders its own.

| path | component file | purpose |
|---|---|---|
| /lounge/editor/:siteId | src/pages/lounge/WebsiteEditor.tsx | full-screen website editor for a site |
| /lounge/site-settings/:siteId | src/pages/lounge/SiteSettingsPage.tsx | per-site settings (domain, meta) |
| /lounge/ai-builder | src/pages/lounge/LoungeAIBuilder.tsx | AI website builder |
| /lounge/cad-studio/edit | src/pages/lounge/LoungeCADEditor.tsx | CAD editor canvas |
| /lounge/workshop-studio | src/pages/lounge/FigmaDesigner.tsx | Figma-style design studio |
| /lounge/figma-studio | src/pages/lounge/FigmaDesigner.tsx | alias route for the same design studio |
| /lounge/creative/photo-studio | src/pages/lounge/CreativePhotoStudio.tsx | photo editing studio |
| /lounge/office | src/pages/lounge/LoungeOffice.tsx | Office suite launcher ("All Apps" grid) |
| /lounge/office/word/:docId | src/pages/lounge/LoungeWordEditor.tsx | Word-style document editor |
| /lounge/office/word-home | src/pages/lounge/OfficeWordHome.tsx | Documents home (doc list) |
| /lounge/office/excel-home | src/pages/lounge/OfficeExcelHome.tsx | spreadsheet editor |
| /lounge/office/sheets-home | src/pages/lounge/SheetsHomeDash.tsx | Spreadsheets home (file list) |
| /lounge/office/powerpoint-home | src/pages/lounge/SlidesHome.tsx | Slides home (deck list) |
| /lounge/office/slides/edit | src/pages/lounge/OfficePowerPointHome.tsx | slides editor |
| /lounge/office/onenote-home | src/pages/lounge/OfficeOneNoteHome.tsx | notes app (OneNote-style) |
| /lounge/office/onedrive | src/pages/lounge/OfficeOneDrive.tsx | Files/drive browser |
| /lounge/office/design-studio | src/pages/lounge/DesignStudioHome.tsx | design studio (Canva-style) home |
| /lounge/office/design-studio/editor | src/pages/lounge/DesignStudioEditor.tsx | design canvas editor |
| /lounge/office/design-studio/projects | src/pages/lounge/DesignStudioProjects.tsx | design projects list |
| /lounge/office/design-studio/templates | src/pages/lounge/DesignStudioTemplates.tsx | design templates gallery |
| /lounge/office/design-studio/brand | src/pages/lounge/DesignStudioBrand.tsx | Brand Kit management |
| /lounge/office/design-studio/ai | src/pages/lounge/DesignStudioAI.tsx | "Quooro AI" design generation |
| /lounge/office/whiteboard | src/pages/lounge/OfficeWhiteboard.tsx | whiteboard canvas |
| /lounge/office/whiteboard-home | src/pages/lounge/OfficeWhiteboardHome.tsx | Whiteboards home |
| /lounge/office/forms | src/pages/lounge/OfficeForms.tsx | form builder/runner |
| /lounge/office/forms-home | src/pages/lounge/OfficeFormsHome.tsx | Forms & Surveys home |
| /lounge/office/pdf | src/pages/lounge/OfficePDF.tsx | PDF viewer/tools |
| /lounge/office/pdf-home | src/pages/lounge/OfficePDFHome.tsx | PDF Studio home |
| /lounge/office/pdf-creator | src/pages/lounge/OfficePDFCreator.tsx | block-based PDF creator |
| /lounge/office/tasks | src/pages/lounge/OfficeTasks.tsx | task manager |
| /lounge/office/calculator | src/pages/lounge/OfficeCalculator.tsx | calculator |
| /lounge/office/pomodoro | src/pages/lounge/OfficePomodoro.tsx | pomodoro timer |
| /lounge/office/polls | src/pages/lounge/OfficePolls.tsx | polls create/vote |
| /lounge/office/polls-create | src/pages/lounge/OfficePolls.tsx | alias route → same Polls component |
| /lounge/office/polls-home | src/pages/lounge/OfficePollsHome.tsx | Polls & Voting home |
| /lounge/office/bookmarks | src/pages/lounge/OfficeBookmarks.tsx | bookmarks manager |
| /lounge/office/sticky-wall | src/pages/lounge/OfficeStickyWall.tsx | sticky-notes wall |
| /lounge/office/sticky-wall-home | src/pages/lounge/OfficeStickyWallHome.tsx | Sticky Wall home |
| /lounge/office/operations | src/pages/lounge/OfficeOperations.tsx | Operations Manager |
| /lounge/office/accounting | src/pages/lounge/OfficeAccounting.tsx | full accounting app (also embedded in Accountant portal) |
| /lounge/office/ecommerce | src/pages/lounge/OfficeEcommerce.tsx | e-commerce store manager (feeds public /checkout) |
| /lounge/office/invoices | src/pages/lounge/OfficeInvoices.tsx | Invoice & Expenses |
| /lounge/office/hr | src/pages/lounge/OfficeHR.tsx | HR management |
| /lounge/office/wiki | src/pages/lounge/OfficeWiki.tsx | wiki/knowledge pages |
| /lounge/office/analytics | src/pages/lounge/OfficeAnalyticsStudio.tsx | analytics studio |
| /lounge/office/expenses | src/pages/lounge/OfficeExpenseManager.tsx | expense manager |
| /lounge/office/time-tracker | src/pages/lounge/OfficeTimeTracker.tsx | time tracker |
| /lounge/office/contracts | src/pages/lounge/OfficeContractManager.tsx | contract manager |
| /lounge/office/passwords | src/pages/lounge/OfficePasswordVault.tsx | password vault |

## Ambiguous — shared CRM

| path | component file | guard/role | face | purpose | notes |
|---|---|---|---|---|---|
| /lounge/crm | src/pages/lounge/crm/CRMShell.tsx | ProtectedRoute + CustomerGuard (shared: user OR admin) | Ambiguous (team-leaning: assigns leads to admins; Dashboard "Leads" tab redirects here) | "Business Relationships" CRM | Self-contained shell; sections: Dashboard (KPIs, leads-per-admin bars, lifecycle stages, recently updated) / Companies / Contacts / Opportunities / Workflows. Split list+detail (`EntityDetail` panel w/ timeline & financials, full-screen on mobile), virtualized list, owner filter chips + teammate dropdown, bulk-select assign dropdown, `NewEntityDialog`, `ImportExportMenu` (CSV), mobile Sheet nav, "Manage admins" link (admin only), exit to portal home |
| /lounge/crm-legacy | src/pages/lounge/LoungeCRM.tsx | same as above | Ambiguous | legacy CRM screen (kept as fallback) | |

## Quooro Office (team/admin)

| path | component file | guard/role | face | purpose | notes |
|---|---|---|---|---|---|
| /dashboard | src/pages/Dashboard.tsx | ProtectedRoute + TeamGuard (admin) | Quooro Office | team command center — the entire admin product in one URL-tab-driven screen (`?tab=`) | `TeamLayout` shell; 36 tabs: command-center, enquiries, leads(→/lounge/crm), clients, client-accounts, account-creation (`src/pages/admin/AccountCreation.tsx` + CreateAccountWizard/AccountTypePresets/ManageAdminsPanel), greeting-messages, apps, ads, social, content, calendar, websites, marketing-site, website-designer, cad-studio, office, ecommerce, subscription-sites, hosted-sites, invoices, billing, messages, security, site-analytics, assets, tickets, announcements, workflows, resources, live-sessions, settings, knowledge-base, automation-rules, planner, team-comms, roles-permissions (components in `src/components/admin/`). Dialogs: Create Client, Edit/Delete client (type-to-confirm), Reset Password |
| /dashboard/planner | src/pages/DashboardPlanner.tsx | ProtectedRoute + TeamGuard (admin) | Quooro Office | "Team Planner" kanban (`src/components/planner/PlannerBoard.tsx`) | |
| /executive | src/pages/ExecutiveDashboard.tsx | ProtectedRoute + ExecutiveGuard (admin or executive) | Quooro Office | executive KPI overview | own chrome (no shell); sections: KPI trend tiles, Revenue vs Expenses chart, Financial Summary, Project Status, Sales Pipeline, Platform Activity, Executive Alerts, Live Activity Feed, Quick Actions grid |
| /team/subscription-websites | src/pages/SubscriptionWebsitesPage.tsx | ProtectedRoute + TeamGuard (admin) | Quooro Office | manage client subscription websites (TeamLayout) | |
| /team/hosted-websites | src/pages/HostedWebsitesPage.tsx | ProtectedRoute + TeamGuard (admin) | Quooro Office | manage hosted websites (TeamLayout) | |
| /admin/team | (redirect) | — | Quooro Office | `Navigate` → `/dashboard?tab=account-creation` | |
| /admin/marketing-site | src/pages/admin/AdminMarketingSiteIndex.tsx | ProtectedRoute + inline isAdmin | Quooro Office | marketing-site CMS index (links to section editors) | |
| /admin/marketing-site/hero | src/pages/admin/AdminMarketingHero.tsx | ProtectedRoute + inline isAdmin | Quooro Office | edit homepage hero copy | |
| /admin/marketing-site/process | src/pages/admin/AdminMarketingProcess.tsx | ProtectedRoute + inline isAdmin | Quooro Office | edit homepage process section | |
| /admin/marketing-site/why | src/pages/admin/AdminMarketingWhy.tsx | ProtectedRoute + inline isAdmin | Quooro Office | edit "Why Quooro" section | |
| /admin/marketing-site/headers | src/pages/admin/AdminMarketingHeaders.tsx | ProtectedRoute + inline isAdmin | Quooro Office | edit all homepage section headers | |
| /admin/marketing-site/builder | src/pages/admin/AdminMarketingBuilder.tsx | ProtectedRoute + inline isAdmin | Quooro Office | full marketing-page builder | |
| /admin/marketing-site/visual-editor | src/pages/admin/AdminMarketingVisualEditor.tsx | ProtectedRoute + inline isAdmin | Quooro Office | in-iframe visual editor of live marketing site (`?__edit=1`) | |
| /admin/marketing-site/workshop(/:siteId) | src/pages/admin/AdminMarketingWorkshop.tsx | ProtectedRoute + inline isAdmin | Quooro Office | workshop site editor (2 routes, optional :siteId) | |

## Accountant Portal (external accountant face)

| path | component file | guard/role | face | purpose | notes |
|---|---|---|---|---|---|
| /accountant/dashboard | src/pages/accountant/AccountantDashboard.tsx | inline session check + `acc_org_members` role='accountant' | Ambiguous (external accountant) | org picker — list of client organizations the accountant serves | minimal own header (emerald Calculator brand, sign-out); org rows → org view |
| /accountant/org/:orgId | src/pages/accountant/AccountantOrgView.tsx | inline session check | Ambiguous (external accountant) | single org's books — wraps shared `OfficeAccounting` in accountant shell (`data-accountant-org` attr) | header: back to all orgs, sign-out |

## Public utility (unauthenticated, product-adjacent)

| path | component file | guard/role | face | purpose |
|---|---|---|---|---|
| /checkout | src/pages/StoreCheckout.tsx | none | Ambiguous (public storefront of client e-commerce) | store checkout: contact, shipping address, order confirmation |
| /book/:slug | src/pages/BookingPage.tsx | none | Ambiguous (public face of /lounge/bookings) | public booking/scheduling page per slug |

## Marketing routes (counted, not listed)

51 public marketing/legal routes + `*` NotFound catch-all: home, packages/pricing/plan pages (7), service pages (6, incl. `/account-management` — marketing despite the platform-sounding name), portfolio + 6 demos, preview-* (6), workshop marketing (3), legal/policy (5), plus features/comparison/support/etc.

---

# CRM OVERHAUL ADDENDUM — 2026-07-30 (branch crm-overhaul)

# CRM Recon — Surfaces & Flows (Phase 0, branch crm-overhaul)

## 1. Surface map

### A. CRM workspace — `/lounge/crm` (FLAGSHIP, only nav-linked CRM)
Route: `App.tsx:307` `ProtectedRoute > CustomerGuard > CRMShell` (lazy). `CustomerGuard` allows BOTH roles: `/lounge/crm` is on the shared-app path whitelist (`CustomerGuard.tsx:57`), so admins pass through; clients (`isUser`) pass normally. Treated as editor-route (no lounge chrome, `App.tsx:216`).
Entry points: lounge sidebar/mobile drawer via `navRegistry.ts:33`; LoungeOverview quick links (`LoungeOverview.tsx:205,417,564`); ExecutiveDashboard "View CRM" (`ExecutiveDashboard.tsx:399`); **admin Dashboard "leads" tab is now `<Navigate to="/lounge/crm" replace />` (`Dashboard.tsx:772`)** — the workspace is the de-facto team lead surface too.
Files: `src/pages/lounge/crm/` — CRMShell.tsx (600), useCRMData.ts (137), EntityDetail.tsx (388), NotesPanel.tsx (122), NewEntityDialog.tsx (259), ImportExportMenu.tsx (92), CRMLeadImportDialog.tsx (444), csvIO.ts (155), useAdmins.ts (53).

Screens/views (single-page `section` state, no sub-routes):
- **Dashboard** (default): 3 workload KPIs (My leads / Unassigned / Team total), 4 entity KPIs (Companies/Contacts/Opportunities/Pipeline £), "Leads assigned per admin" bars, "Lifecycle stages" bars (dedupe heuristic `max(contacts,companies)+opps`), "Recently updated" list (top 6 across entities).
- **Companies / Contacts / Opportunities**: master list (virtualised, @tanstack/react-virtual, row est. 84px) + detail pane. Toolbar: owner filter chips (All/Mine/Unassigned/Teammate dropdown), count label, bulk-select Assign dropdown, ImportExportMenu ("Data"), New button (disabled until `orgId` derivable from an existing row — cold-start dead-end).
- **Workflows**: read-only list from `crm_workflows` + fetches `crm_workflow_runs` (runs fetched but never rendered).
Dialogs/sheets: mobile nav Sheet (left); NewEntityDialog; CRMLeadImportDialog (contacts only, 5 tabs: CSV/Excel/JSON/HTML/Manual → mapping → preview → progress → result); ImportExportMenu dropdown (Import leads / Export CSV / Quick CSV import / Download template); EntityDetail call-confirm AlertDialog (tel:).
EntityDetail: header (type kicker, rel-type + stage chips, prev/next through filtered list, close), tabs Overview (stage Select → RPC, OwnerPicker dropdown, contact fields, notes text, tags read-only, NotesPanel CRUD) / Timeline (RPC `crm_timeline`) / Financials (RPC links + LTV stats).
States: loading `SkeletonLedger`; empty `EmptyState` ("No record selected", "No records", timeline/financials empties, "No workflows configured"); error → toast (use-toast in siblings, **sonner in CRMLeadImportDialog**); import progress bar + result screen (Added/Duplicates/Errors).
Mobile: sidebar → Sheet; list full-width; detail becomes `fixed inset-0 z-40` overlay; search shrinks to `w-40`.

### B. Legacy client CRM — `/lounge/crm-legacy` (ORPHAN: no in-app link, URL-only)
Route: `App.tsx:309` same guards → `src/pages/lounge/LoungeCRM.tsx` (1534). Gated by `CRMSplash` on entry and `ExitSplash` on back (splash pair unique to legacy).
Data: `leads` table (NOT crm_*). Shares satellites with admin: FullScreenLeadView, DealPipelineBoard, DealForecast, DealDialog, ProposalList, ProposalEditor + hooks useCRMDeals, useProposals.
Views (top-bar toggle): **Contacts** (list) / **Pipeline** (kanban mini-list, not a board) / **Deals** (drag-drop DealPipelineBoard on `crm_deals`) / **Forecast** (DealForecast, recharts) / **Proposals** (ProposalList → ProposalEditor).
Desktop: 3-pane ResizablePanelGroup (list 28 / detail 44 / activity 28). Mobile: single view with back header + Details/Activity tabs.
Dialogs: Add-contact modal (hand-rolled fixed overlay, `w-[520px]`, Business/Personal toggle, status+source selects); Import modal (hand-rolled, `w-[640px]`, CSV-only: file → auto-map → mapping grid → 5-row preview → import); DealDialog; FullScreenLeadView (double-click or Maximize icon; own hardcoded dark theme).
Detail pane: header (initials chip, StatusBadge, source line, edit/delete/full-screen), Pipeline-stage button row (7 statuses), 2-col info grid (email/phone/website/category/location/rating; inline edit mode), tags, timestamps. Activity pane: note composer + notes + status-history feed.
States: SkeletonLedger loading, icon empty-states, stat pills (Total/New/Engaged/Converted), collapsible filter bar (status × source chips).

### C. Team side — Dashboard admin components
- **AdminLeadManagement.tsx** (1092) — **DEAD CODE**: imported in `Dashboard.tsx:49` but never rendered (leads tab redirects to `/lounge/crm`). Was the admin twin of LoungeCRM: same 5 view modes, same 3-pane/mobile layout, but server-side paged `leads` query (50/page, ilike or-search, PII decrypt) + pagination footer; Add contact opens LeadDetailDialog; Import opens LeadImportDialog. Exports leadStatusConfig/sourceLabels consumed by LeadDetailDialog.
- **LeadDetailDialog.tsx** (903) — reachable only via AdminLeadManagement. `w-[95vw] sm:max-w-4xl h-[90vh]` dialog; tabs Details / Enquiry (only if `enquiry_data`) / Notes / History; right action rail (Save, Convert to Client via `create-client` edge fn, Delete AlertDialog, Quick Info tel:/mailto:); prev/next + ArrowLeft/Right keyboard nav; doubles as "new lead" form.
- **LeadImportDialog.tsx** (1007) — admin import engine (CSV/JSON/HTML/Manual tabs, mapping step, preview, batch-10 import with per-lead dupe query, progress + ETA, `lead_imports` audit log). Reachable only via AdminLeadManagement.
- **AdminEnquiries.tsx** (660) — LIVE at Dashboard `enquiries` tab (`Dashboard.tsx:789`). Platform DataTable + DetailDrawer (Contact/Project/Business/Notes tabs). Actions: status select, **Convert to client** (password modal → `create-client` edge fn), **convert-to-lead** (`convertToLead()` L149-196: dupe-check by email → insert into `leads` with `tags:['from-enquiry']`, `enquiry_id`, `enquiry_data` → enquiry status 'in-progress'). NOTE: the resulting lead lands in the `leads` table, which the flagship `/lounge/crm` never reads — only orphaned surfaces show it.
- **FullScreenLeadView.tsx** (461, src/components/crm/) — fixed z-50 overlay over `leads`; keyboard prev/next/Esc; own hex STATUS_CONFIG + `#111` theme.
Hooks: `useCRMDeals` (crm_deals CRUD + activities + analytics/forecast math + auto `client_onboarding` insert on stage→won), `useProposals` (proposals CRUD, 3 canned templates, `generate_proposal_number` RPC). `useClientPricing` reviewed — billing-only (client_pricing/client_invoices/client_contracts for LoungeBilling), NOT CRM-relevant.

### Role reachability summary
| Surface | Client ('user') | Admin | Linked in nav? |
|---|---|---|---|
| /lounge/crm workspace | yes | yes (shared-app whitelist; Dashboard leads tab redirects here) | yes |
| /lounge/crm-legacy | yes | yes (same whitelist prefix `/lounge/crm`) | no (URL only) |
| AdminLeadManagement (+LeadImport/LeadDetail dialogs) | no | not mounted (dead) | no |
| AdminEnquiries (convert-to-lead) | no | yes (Dashboard enquiries tab) | yes |

## 2. Five core flows, as-built

### Flow 1 — Find a lead
- Workspace (both roles): open /lounge/crm → useCRMData prefetches ALL rows client-side (`crm_companies|contacts|opportunities` paged 1000/req up to 50k) → pick section → type in header search (client-side, name-ish field only, deferred) → owner chips (All/Mine/Unassigned/teammate) → click row → EntityDetail. No server search; email/phone/tag not searchable (contacts fall back to email only when nameless).
- Legacy client: `leads` select limit 10000 → client-side filter across business/personal/contact name, email, category + status/source filter bar + sort select.
- Admin (dead path): server query `from('leads').select('*',{count:'exact'}).or(6-field ilike).order(sort).range(page)` + `decryptPiiFields(phone,email)`.

### Flow 2 — Add a lead
- Workspace: "+ New" (needs orgId from an existing row) → NewEntityDialog → contact: `crm_contacts.insert({org_id, owner_id:user.id, full_name, email, phone, company_id?, relationship_type:['lead']})`; company/opportunity analogous. Or Data → Import leads → Manual tab → `runImport([manual],'manual')` (dedupe + insert crm_contacts).
- Legacy: "Add contact" modal → `leads.insert({business/personal/contact_name, email, phone, website_url, category, location_*, status, source, is_personal, assigned_to:user.id})`.
- Admin (dead): Add contact → LeadDetailDialog new-mode → `leads.insert({...fields, source:'manual', status:'new', assigned_to, tags}).select().single()`.
- From enquiry (admin, live): AdminEnquiries convertToLead → dupe check → `leads.insert` with enquiry payload.

### Flow 3 — Progress a lead through stages
- Workspace: EntityDetail → Lifecycle stage Select → `rpc('crm_set_lifecycle_stage', {_entity_type,_entity_id,_new_stage_id,_note:null})` → toast "Workflows may have fired automatically" → refetch. Stages come from `crm_lifecycle_stages` (server-defined, colored, ordered).
- Legacy/FullScreen/Admin: stage button row (hardcoded PIPELINE_ORDER new→contacted→engaged→live_preview_wanted→converted→lost→do_not_contact) → `leads.update({status})` + `lead_status_history.insert({lead_id, old_status, new_status, changed_by})` (two unwrapped writes, no transaction). LeadDetailDialog additionally auto-stamps `last_contacted_at` on →contacted and offers Convert-to-Client: `functions.invoke('create-client')` → `leads.update({status:'converted', converted_client_id})` → copy notes into `profiles.notes` → history insert.
- Deals (legacy/admin views): drag card between DEAL_STAGES → `crm_deals.update({stage, probability, won?, actual_close_date?})` + `crm_deal_activities.insert` + auto `client_onboarding.insert` on won.

### Flow 4 — Import a book (see contracts doc for engine-by-engine detail)
- Workspace contacts: Data → "Import leads" → CRMLeadImportDialog (CSV/Excel(XLSX)/JSON/HTML/Manual → autoMap → mapping table → preview → org resolve → 20k-signature dedupe preload → 500-row chunk inserts into `crm_contacts` with business data flattened into `notes`) OR "Quick CSV import" → csvIO.importEntities (no preview/dedupe, 200-row chunks, per-entity column synonyms). Template download available.
- Legacy client: Import modal → CSV only → parseCSV (regex, quote-fragile) → auto-map → editable mapping → 50-row chunk `leads.insert`, defaults status new/source csv_import/assigned_to me. No dedupe, no audit.
- Admin (dead): LeadImportDialog → CSV/JSON/HTML/Manual → mapping/preview → batch-10 with per-lead `.or()` dupe query → `leads.insert` → progress %, ETA → `lead_imports` audit row. Only this engine logs imports.

### Flow 5 — Review / report
- Workspace: Dashboard section (workload + entity KPIs, per-admin lead distribution, lifecycle distribution, recent activity); Financials tab per record (invoiced/paid/outstanding via RPCs); Workflows list. Export current view to CSV.
- Legacy/Admin: stat pills; Forecast view = DealForecast (pipeline value, weighted forecast, win rate, avg deal size, 6-mo projection + win/loss recharts from useCRMDeals.analytics — computed client-side); Deals board totals per column; Proposals list w/ status. Export CSV of filtered contacts (legacy) / current page (admin — exports only the 50 loaded rows).
