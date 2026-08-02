<!-- Platform overhaul Phase 0 · slop audit · 2026-07-29 -->

# Recon Audit — Authenticated Platform UI ("AI slop" survey)

Scope: src/pages/{lounge,admin,accountant,workshop}/**, the 5 named dashboard pages, src/components/{lounge,admin,auth,ui}/**. 266 tsx files scanned.

## 1. Executive summary (current visual language)

1. The platform is **two design systems fighting**: a genuinely reformed token layer ("Night Shift" — warm paper light mode `#F4F3EF`, true near-black dark `#0B0B0C`, ember primary `#C2410C`/`#E8613C`, brass accent, Bricolage Grotesque display / Geist body / JetBrains Mono figures, AA-measured contrast comments in `src/index.css`) sitting under ~100 page files that never adopted it.
2. Shared shadcn primitives (`ui/button.tsx`, `card.tsx`, `badge.tsx`, `table.tsx`) are **already reskinned, not stock** — comments even document removal of the blue-to-violet CTA ramp. The slop lives almost entirely at page level.
3. Biggest tell: **989 raw hex hits**. Whole screens hand-roll private dark themes (`#141414/#1a1a1a/#2a2a2a` in LoungeInventory; `#111/#1e1e1e/#0073E6` in AdminLeadManagement + AdminEnquiries), bypassing tokens and silently breaking light mode on those screens.
4. Second tell: the **copy-pasted rainbow STATUS_CONFIG object** — `new: #60a5fa (blue), contacted: #a78bfa (purple), engaged: #34d399, …` — duplicated verbatim in LoungeCRM, AdminLeadManagement, AdminCommandCenter, and echoed as Tailwind `bg-*-500/20` maps in Dashboard.tsx and LoungeAppProjects. Six-plus hues per widget.
5. Third tell: **KPI stat-card rows** — icon + hex accent + delta + sparkline in `grid-cols-4` (or 6) on OfficeAnalyticsStudio, OfficeHR, CustomerDashboard, LoungeOverview, LoungeProducts. `KPICardWithTrend` institutionalises it with a raw-hex `color` prop and an "ambient corner glow" blur div.
6. Fourth tell: **gradient logo chips per sub-app** mimicking Microsoft/Adobe branding — Word-home blue→indigo, OneNote violet→purple, accountant emerald→teal, DesignStudioHome's rainbow of `from-pink-100 to-rose-50` template tiles and a literal Photoshop gradient (`#001E36 → #31A8FF`).
7. **Glassmorphism is institutionalised**: a `.glass` utility (`bg-card/60 backdrop-blur-xl`), `bg-card/60 + rounded-2xl + border-border/20` card recipe across Office pages, `bg-background/80 backdrop-blur-xl` sticky headers, and an animated canvas of floating hue orbs (`LoungeBackground.tsx`) behind the entire lounge.
8. **Loading = bare spinners** (284 hits): hand-rolled `border-2 border-t-transparent animate-spin` divs as full-page states (Dashboard.tsx:857, LoungeWebsiteDesigner:325/537) even though a proper `SkeletonLoading.tsx` library exists and is under-used.
9. **Emoji as data icons**: CRM source map (🗺️🤝🌐📧📱✏️📊), OfficeBookmarks emoji favicons, LoungeMail provider dots — 87 emoji-in-JSX hits.
10. **Sparkles everywhere** (144 Sparkles/Wand2 hits): sidebar "Quooro AI" item, LoungeAIBuilder's purple `#a78bfa` sparkle hero on a hardcoded-black canvas, workshop pages' `text-gradient` headline spans.
11. `FigmaDesigner.tsx` (2,506 lines) is a Figma clone in **stock light-gray + `bg-blue-500`** — zero theme awareness, the single most off-brand screen in the product.
12. Card language is inconsistent: reskinned `Card` on some screens, `.glass rounded-2xl` on others, `bg-[#161616]` on others — three surface systems visible within one session.
13. Copy is comparatively clean: no "Oops/Whoops", one "Something went wrong" (SubmitForAssessment), one "Welcome back, X!" toast (UnifiedSignIn). Marketing-fluff scan is ~all false positives ("unlock" in the password vault).
14. Icons are 100% lucide-react — no mixed icon libraries anywhere in scope. One consistent win.
15. Net read: the shell (auth, tokens, primitives, empty/skeleton components) looks designed; the feature pages read as independently AI-generated one-shots that each invented a palette, a status rainbow, and a KPI row.

## 2. Violation table

| Category | Hits | Worst 5 files (src/…) |
|---|---|---|
| Raw hex in className/style | 989 | pages/lounge/LoungeCRM.tsx (87), pages/lounge/LoungeInventory.tsx (82), pages/lounge/OfficeAnalyticsStudio.tsx (74), components/admin/AdminLeadManagement.tsx (56), pages/lounge/OfficeInvoices.tsx (46) |
| Status `bg-*-500/100` rainbow maps | 456 | pages/lounge/LoungeAppProjects.tsx (27), pages/Dashboard.tsx (27), pages/lounge/accounting/ReportsCentre.tsx (17), pages/lounge/LoungeAdManagement.tsx (16), pages/lounge/OfficeOneDrive.tsx (14) |
| rounded-2xl/3xl (mostly with shadow/glass) | 310 | OfficeAnalyticsStudio (22), OfficeInvoices (14), OfficeHR (14), OfficeAccounting (11), accounting/ReportsCentre (10) |
| Spinners as loading state (animate-spin/Loader2) | 284 | pages/Dashboard.tsx (11), LoungeWebsiteDesigner (8), LoungeMail (8), LoungeInventory (8), accounting/FixedAssetsView (7) |
| Default-blue primary (bg/text/border-blue-*) | 181 | FigmaDesigner (40), LoungeAppProjects (25), accounting/ReportsCentre (8), OfficeWordHome (7), Dashboard.tsx (7) |
| Glassmorphism (backdrop-blur, + `.glass` util) | 149+ | OfficePowerPointHome (7), OfficeEcommerce (7), OfficeWordHome (6), OfficeOneDrive (5), LoungeCADStudio (5); plus `.glass` classes throughout Dashboard.tsx |
| Sparkles/Wand2/"AI" affordances | 144 | LoungeBilling (6), LoungeAIBuilder (6), LoungeAI (6), DesignStudioEditor (5), components/lounge/PortalSidebar (5) |
| shadow-lg/xl/2xl | 142 | OfficeHR (10), OfficeInvoices (6), FigmaDesigner (6), SheetsHomeDash (5), CustomerDashboard (5) |
| bg-gradient-to-* | 138 | DesignStudioHome (12), DesignStudioProjects (10), DesignStudioTemplates (9), SheetsHomeDash (7), OfficeWordHome (7) |
| Purple/indigo/violet/fuchsia classes | 117 | OfficeOneNoteHome (13), DesignStudioHome (13), OfficeWordHome (6), DesignStudioTemplates (6), FigmaDesigner (5) |
| Emoji in JSX | 87 | LoungeCRM (12), OfficeBookmarks (9), LoungeContentRequests (9), components/admin/AdminContentRequests (8), LoungeMail (7) |
| User-facing "!" strings | 25 | OfficePolls (3), LoungeSEOChecker (3), OfficeCalculator (2), LoungeTeam (2), UnifiedSignIn toast |
| Banned copy phrases | 7 | components/auth/UnifiedSignIn.tsx ("Welcome back…!" x2 user-facing), pages/lounge/accounting/SubmitForAssessment.tsx ("Something went wrong" x2) |
| Marketing fluff | ~2 real | OfficePasswordVault's 58 hits are the word "unlock" (domain-correct, NOT slop); real fluff limited to workshop marketing pages ("Zero Complexity", text-gradient heroes) |
| Mixed icon libraries | 0 | none — all lucide-react |
| Vague "An error occurred" | 0 | none found |

## 3. Screen-by-screen notes — 15 worst offenders

### 1. src/pages/lounge/FigmaDesigner.tsx (2,506 lines; 116 weighted hits)
A whole Figma clone that ignores the design system: `bg-blue-500 hover:bg-blue-600` CTAs, `bg-gray-50/gray-200/gray-900` chrome, `focus:ring-blue-500/20`, hardcoded `#f5f5f5` canvas, indigo `#6366f1` default fill and a 10-hex rainbow `COLORS` array. Light-only; renders as an alien app inside the dark lounge. The clearest "generated in one prompt, never themed" artifact.

### 2. src/pages/lounge/OfficeAnalyticsStudio.tsx (937 lines)
The canonical AI dashboard: a row of SIX KPI cards, each `{label, value, change, icon, color: '#10b981'|'#6366f1'|'#f59e0b'|'#06b6d4'|'#ec4899'|'#ef4444', sparkline}` — indigo/pink/cyan straight from the default LLM palette, fake demo numbers ("12,847 users", "£127.50 AOV"). Every panel is `rounded-2xl bg-card/60 border-border/20 hover:shadow-xl` glass. 74 raw hex.

### 3. src/pages/lounge/LoungeCRM.tsx (1,543 lines)
`STATUS_CONFIG` rainbow: 7 pipeline stages mapped to 7 raw-hex hues with `rgba(...,0.12)` tints (blue→purple→green→yellow→green→red→gray). `SOURCE_CONFIG` maps lead sources to emoji (🗺️🤝🌐📧📱✏️📊📄📋) used as icons. 87 raw hex total. Duplicated nearly verbatim in AdminLeadManagement — copy-paste slop across user and admin surfaces.

### 4. src/pages/lounge/LoungeInventory.tsx (1,301 lines)
Hand-rolled private dark theme: `bg-[#141414]`, `border-[#2a2a2a]`, `placeholder:text-[#555]`, `bg-[#161616]` dialogs — 82 raw hex. Ignores `--card/--border/--muted` entirely, so it can never follow the light "paper" mode. Plus the hex status trio (`#34d399/#fbbf24/#ef4444`) and 8 spinner instances.

### 5. src/components/admin/AdminLeadManagement.tsx (1,087 lines)
Same STATUS_CONFIG rainbow as LoungeCRM plus its own `#111/#1e1e1e/#333` shadow-theme and an off-brand **blue** accent `#0073E6` (the banned default-blue, hardcoded). Line 109 builds `text-[${v.color}]` / `bg-[${v.bg}]` classes at runtime — Tailwind JIT cannot compile dynamic arbitrary values, so these classes are dead: a functional bug that fingerprints generated code.

### 6. src/components/admin/AdminEnquiries.tsx (47 hits)
Styled as a fake desktop app: inline `style={{ backgroundColor: '#111', fontFamily: "'Inter', sans-serif" }}` — hardcoded Inter overriding the Geist brand font, `#0073E6` blue accents, `#2a2a2a` borders, hex status map (blue/yellow/purple/green). Another private theme inside the admin panel.

### 7. src/pages/Dashboard.tsx (2,053 lines)
Three separate Tailwind rainbow status maps (upload status, enquiry status, project stage: blue/yellow/purple/green/orange `bg-*-500/20 text-*-500 border-*-500/30`), `bg-purple-500` stage chips, `.glass rounded-2xl` panels throughout, and a hand-rolled `border-t-transparent animate-spin` div as the page loading state at line 857 — with SkeletonLoading sitting unused in the same codebase.

### 8. src/pages/lounge/LoungeAppProjects.tsx (765 lines)
Textbook status rainbow (`design: purple, development: blue, testing: amber, deployed: emerald, completed: green` at lines 75–82) plus repeated `bg-blue-500/10` + `text-blue-500` icon chips — banned default-blue as the de facto accent of the whole screen.

### 9. src/pages/lounge/OfficeInvoices.tsx (1,140 lines)
Eight invoice "themes" defined as raw-hex objects (`#0071e3` sapphire, `#7c3aed` violet, `#be185d` rosé…) with matching preview tints, plus hex-colored service templates. 46 raw hex, 14 rounded-2xl, glass cards. The template-picker-with-color-swatches pattern is itself a generated-UI staple.

### 10. src/pages/lounge/OfficeHR.tsx (775 lines)
Department→hex map (8 hues), status→hex map, recruiting stage→hex map (`#8b5cf6` offer), a `from-cyan-500 to-blue-600` gradient logo chip, and a 4-up KPI row (`Headcount/On Leave/Avg Rating/Open Roles`) with icon + hex color + sub — the exact banned KPI grid. 10 shadow-lg/xl, 14 rounded-2xl.

### 11. src/pages/lounge/DesignStudioHome.tsx (205 lines)
Gradient museum: create-buttons colored `bg-purple-600/bg-violet-500/bg-indigo-500`, tool tiles with literal Adobe gradients (`linear-gradient(135deg,#001E36,#31A8FF)` = Photoshop), and 12 template categories each with its own pastel `from-*-100 to-*-50` ramp — pink, amber, violet, indigo, rose… the full rainbow in one file. Sibling files DesignStudioProjects/Templates repeat it (10 and 9 gradients).

### 12. src/pages/lounge/OfficeWordHome.tsx + OfficeOneNoteHome.tsx
Per-app fake branding: Word-home hero has `bg-gradient-to-br from-blue-600/8 via-indigo-500/5`, blur-3xl indigo orb, `from-blue-600 to-indigo-700` logo chip with `shadow-lg shadow-blue-600/25`; seven template cards each carry color+bg+border+gradient in a different hue. OneNote repeats it in violet→purple. Skeuomorphic Microsoft-color mimicry, banned-purple and banned-blue at once.

### 13. src/pages/CustomerDashboard.tsx (827 lines)
Row of 4 stat cards, each `rounded-2xl bg-gradient-to-br from-{amber|blue|emerald}-500/10 …/5` with a colored icon — the banned KPI grid with gradient tint variant. `hover:shadow-xl shadow-primary/10` cards, `bg-gradient-to-t from-black/50` image overlays.

### 14. src/pages/lounge/LoungeAIBuilder.tsx (+ LoungeAI, LoungeBilling)
The "AI surface" cluster: Sparkles icons as hero art in purple `text-[#a78bfa]`, hardcoded `#333`-border spinner on black, faint white grid-line gradient background — AI-tool-landing-page cliché, and again a private dark theme instead of tokens.

### 15. src/pages/lounge/OfficeEcommerce.tsx + LoungeWebsiteDesigner.tsx
Glass everywhere (`backdrop-blur-2xl` header, `backdrop-blur-xl` tab bar, `backdrop-blur-md` badges, `bg-card/40-80` at four different opacities in one file), status dot maps (`trial: blue, paused: amber, building: blue animate-pulse`), and in WebsiteDesigner two different hand-rolled spinner divs plus 8 Loader2 instances and a Sparkles CTA.

Dishonourable mentions: `components/admin/AdminCommandCenter.tsx` (7-stage hex pipeline rainbow + `#2a1a1a` toast palette), `pages/lounge/accounting/ReportsCentre.tsx` (17 status-color hits, 10 rounded-2xl, blue accents), `pages/accountant/*` (emerald→teal gradient logo chips — a third brand identity), `components/lounge/LoungeBackground.tsx` (animated floating hue-orb canvas behind every lounge page), `components/lounge/KPICardWithTrend.tsx` (raw-hex color prop + corner-glow blur), `pages/lounge/OfficeBookmarks.tsx` (emoji favicons), `components/auth/UnifiedSignIn.tsx` ("Welcome back, {name}!" toast + banner).

## 4. Already decent (keep / build on)

- `src/index.css` — the Night Shift token system: warm paper + ember, documented contrast ratios, motion tokens, reduced-motion handling, focus-visible treatment. This IS the target language; pages just ignore it.
- `src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `table.tsx` — reskinned, not stock; badge already ships semantic `success/warning/info` variants that would replace every rainbow map.
- Typography stack: Bricolage Grotesque display / Geist body / JetBrains Mono figures, `tabular-nums` used on numbers (e.g. KPICardWithTrend).
- `src/components/lounge/SkeletonLoading.tsx` — proper card/list/table skeletons, just under-adopted (spinners still dominate).
- `src/components/lounge/EmptyState.tsx` — icon + calm title + one action, with sensible preconfigured variants ("Just you for now"). Good copy voice.
- Icon discipline: lucide-react only, everywhere (0 foreign icon imports).
- Copy overall: no Oops/Whoops, no vague "An error occurred", almost no marketing fluff inside the product; auth flow (`UnifiedSignIn`) is largely on-system apart from the exclamation-mark toast.
- `ui/table.tsx` wrapper already provides the overflow container + muted header treatment — table quality issues are page-level, not primitive-level.

Method note: OfficePasswordVault's 58 "marketing fluff" grep hits are the verb "unlock" for a password vault — excluded as false positives. Raw-hex counts include chart/canvas color constants (recharts fills, FigmaDesigner canvas), which are the least-bad hex uses but still bypass the palette.

---

# CRM AUDIT ADDENDUM — 2026-07-30

# CRM Recon — Slop Audit, Inconsistencies, Mobile, Conceptual Model, Feature Inventory

## 1. Post-platform-overhaul state: what got fixed vs what still reads template/default

Fixed by platform overhaul (verified): LoungeCRM, AdminLeadManagement and AdminEnquiries now use the tone vocabulary (StatusDot/StatusBadge/Tone maps), SkeletonLedger, platform DataTable/DetailDrawer (enquiries); the old hex STATUS_CONFIG rainbows and emoji source icons are gone from those three files (AUDIT.md items 3/5/6 largely addressed). The crm/ workspace was built on platform components (Panel, EmptyState, AvatarID, SkeletonLedger) from the start.

Still template/default:
- **The whole `src/components/crm/` satellite family never got the overhaul.** FullScreenLeadView (18 shadow-theme hex hits), DealPipeline (~25), DealForecast, DealDialog, ProposalList, ProposalEditor all keep the hand-rolled `#111/#1a1a1a/#2a2a2a` private dark theme, the banned default-blue `#0073E6` accent, green `#22c55e` money text, and framer-motion wrappers. FullScreenLeadView additionally hardcodes `fontFamily: "'Inter', sans-serif"` (L189) overriding the brand font, and keeps its own hex STATUS_CONFIG rainbow (L64-72) with divergent labels ('Preview Wanted', 'Do Not Contact' vs 'Preview wanted', 'Do not contact'). These render INSIDE the token-converted LoungeCRM/AdminLeadManagement — visible theme break when opening Deals/Forecast/Proposals views or double-clicking a lead. None follow light mode.
- **DEAL_STAGES hex rainbow** lives in the hook itself (`useCRMDeals.ts:39-47`: blue/purple/amber/orange/emerald/green/red) — data-layer file carrying presentation slop.
- **LoungeCRM residue**: L800 and L847 still contain `text-[#ccc] placeholder:text-[#555]` under a `[&>textarea]:!text-foreground` override hack — patched over, not removed. Splash gate (CRMSplash/ExitSplash) on every legacy entry/exit remains.
- **Proposal templates** (`useProposals.ts:66-127`): three fully canned proposals (£2,500 website, £499/mo SEO, £5,000 bundle, boilerplate intros/terms) — placeholder business content shipped as product data.
- **CRMLeadImportDialog** duplicates ~85% of admin LeadImportDialog (autoMap, parseHtml heuristics, FIELD_OPTIONS, flow states) — freshly written copy-paste of legacy slop into the flagship workspace.
- Unused imports linger (LeadDetailDialog: motion, Target, Tag, User…; CRMLeadImportDialog: AlertCircle, FileText, cn).

## 2. Inconsistencies between the three CRM surfaces
- **Identity**: workspace header says "Business relationships" with Radar icon; legacy + admin say "CRM" with Target icon; nav/registry calls it CRM; AdminLiveSessions labels /lounge/crm "CRM".
- **Toast systems**: workspace uses use-toast in 5 files but sonner in CRMLeadImportDialog; admin files use sonner; legacy uses use-toast. Two toast stacks can appear on one screen.
- **Stage models**: workspace = DB-driven `crm_lifecycle_stages` (colored dots from DB hex) set via RPC with server-side workflow side-effects; legacy/admin = hardcoded 7-status PIPELINE_ORDER written directly to `leads.status` + manual history insert; deals = third hardcoded DEAL_STAGES with probabilities. Three stage vocabularies, none mapped to each other.
- **Duplicate constants**: STATUS_CONFIG/TONE_TEXT/TONE_BG/PIPELINE_ORDER duplicated verbatim in LoungeCRM + AdminLeadManagement (+ hex variant in FullScreenLeadView); SOURCE_CONFIG differs (legacy: 9 sources incl. referral/website/cold_outreach/social_media; admin type union: 5; workspace writes free-string `tab+'_import'` e.g. 'excel_import' which no config anywhere labels).
- **Search capability**: server-side ilike + pagination (admin, dead) vs client-side over 10k rows (legacy) vs client-side name-only over up-to-50k prefetch (workspace, the survivor — a functional regression vs the dead admin one).
- **Detail navigation**: keyboard arrows exist in LeadDetailDialog/FullScreenLeadView, absent in workspace EntityDetail (buttons only).
- **PII**: admin lead/enquiry lists decrypt ENC: phone/email via rpc; legacy LoungeCRM and workspace CRM read the same kind of data with NO decrypt path (encrypted rows would render raw); csvIO/CRM imports write plaintext.
- **Delete safety**: LeadDetailDialog wraps delete in AlertDialog confirm; legacy/admin panes and workspace NotesPanel delete instantly with no confirm.
- **updated_at discipline**: admin edits stamp `updated_at` manually; legacy saveEdit does not; workspace relies on DB.
- **Export scope**: legacy exports filtered set; admin exports only the loaded 50-row page while toasting "Exported N leads"; workspace exports current filtered view.

## 3. Mobile behaviour problems
- **Legacy + admin micro-type**: pervasive text-[8px]/[9px]/[10px] labels and h-5/h-6/h-7 (20-28px) tap targets — far below 44px; pagination buttons h-5 w-5 (admin desktop) and h-7 w-7 (mobile).
- **Legacy fixed-width modals**: Add contact `w-[520px]`, Import `w-[640px]` in hand-rolled overlays — overflow a 390px viewport (horizontal clipping; import is desktop-hidden `sm:flex` but Add is reachable via... actually Add button visible on mobile with icon only).
- **Deal board on touch**: HTML5 dragstart/drop only — no touch drag support, so mobile users cannot move deals; board columns stack vertically full-width (usable but drag-dead). Desktop board relies on horizontal overflow-x scroll.
- **FullScreenLeadView isMobile** = `window.innerWidth < 768` read per render with no resize listener — wrong layout after rotation; whole component ignores safe-area/theme.
- **Workspace CRMShell mobile**: solid pattern overall (Sheet nav, full-screen detail overlay, virtualised list) but: header search shrinks to `w-40` next to exit+title (cramped); Dashboard `grid-cols-3` KPI row squashes three cards on narrow phones; row checkboxes are small targets inside 84px rows; filter chip row is overflow-x-auto (fine) yet unlabeled for scroll.
- **Import dialogs on mobile**: CRMLeadImportDialog `max-w-4xl` with 5-column TabsList (`grid-cols-5`) squeezes tab labels; mapping/preview tables scroll inside `overflow-auto` (fine); admin LeadImportDialog uses `w-[95vw]` (fine).
- **Tables**: enquiries uses platform DataTable with mobileCard (good); import preview tables are min-width unconstrained `w-full text-xs` — long emails wrap/truncate acceptably.

## 4. Conceptual-model notes (naming only, no fixes)
- **Two disjoint lead universes**: legacy `leads` (flat row: business/personal/contact names, google_rating, source, status) vs workspace `crm_contacts`+`crm_companies`+`crm_opportunities` (relational, relationship_type[], lifecycle_stage_id). Nothing bridges them. Consequence: AdminEnquiries "Convert to lead → View it in the CRM" inserts into `leads`, but the only nav-reachable CRM reads `crm_contacts` — converted enquiries are invisible except via the orphan /lounge/crm-legacy URL or the unmounted admin panel.
- **"Lead" vs "contact"**: workspace calls crm_contacts rows "Contacts" in nav but "My leads / Team total (All leads & contacts)" on the dashboard, and its import dialog is "Import leads" that creates contacts with `relationship_type:['lead']`. Legacy calls `leads` rows "contacts" in the list/view toggle ("Contacts", "Add contact", "Search contacts…") while the admin twin calls the same rows "Leads" ("Lead deleted", "Import Leads"). The word means the opposite thing on each side.
- **"Company"**: legacy leads store company as a name string (business_name) + category; workspace has first-class crm_companies — but the workspace's own rich import discards company structure, flattening business_name/website/city/rating into the contact's `notes` string and mapping `category → job_title` (semantically wrong: a business category is not a person's job title).
- **"Opportunity" vs "deal"**: crm_opportunities (org-scoped, contact/company FKs, lifecycle stage) vs crm_deals (user-scoped, free-text contact_name/company_name, own stage set, lead_id FK into the LEGACY leads table). Both mean "pipeline revenue object"; they never see each other. Proposals also FK lead_id → legacy leads.
- **Ownership vocabulary**: owner_id (crm_*) vs assigned_to (leads) vs user_id-as-owner (crm_deals, proposals).
- **org model**: workspace org_id = "first-created admin's user_id" resolved ad hoc in two import engines and inferred from row[0] in the shell — an implicit single-tenant assumption wearing multi-tenant clothes.
- **Enquiry** is a fourth proto-lead entity with its own status pipeline (new/contacted/in-progress/completed/closed) overlapping but not matching lead statuses.

## 5. Feature inventory vs enterprise CRM canon
| Capability | Status | Where / gap |
|---|---|---|
| Records (companies/contacts/opps) | EXISTS (workspace) | crm_companies/contacts/opportunities + legacy leads in parallel |
| Custom fields | ABSENT | fixed schemas everywhere; tags[] is the only extensibility |
| Pipelines | PARTIAL | lifecycle stages DB-driven (workspace, no stage-editing UI); hardcoded status pipeline (legacy/admin); deal stages hardcoded |
| Forecasting | PARTIAL | DealForecast (weighted pipeline, 6-mo projection, win/loss) — client-computed, legacy/admin views only; workspace shows raw pipeline £ "Not yet weighted" |
| Activities / tasks / reminders | ABSENT | no task object, no due dates, no reminders anywhere; timeline is passive event log |
| Notes | EXISTS | three systems: crm_communications(kind=note), lead_notes, enquiries.notes text |
| Tags / segmentation | PARTIAL | tags columns rendered read-only in all detail views; settable only via import/LeadDetailDialog state (no tag editor UI); no segments/lists |
| Saved views / filters | ABSENT | all filters ephemeral component state |
| Global search | PARTIAL | per-section name-only (workspace); multi-field client (legacy); server ilike (dead admin). No cross-entity search |
| Bulk operations | PARTIAL | workspace multi-select → assign/unassign only; no bulk stage/tag/delete/export-selected |
| Import / export | EXISTS | 4 import engines + 3 CSV exports + template download (see contracts doc §5-6) |
| Reporting | PARTIAL | workspace dashboard cards + DealForecast; no report builder, no date-ranged lead reports |
| Assignment / ownership | EXISTS | workspace: bulk + per-record OwnerPicker + owner filters + per-admin dashboard; admin dialog select; legacy: implicit self-assign only |
| Automations | PARTIAL | crm_workflows/crm_workflow_runs read-only list; RPC stage-change "may fire workflows" server-side; deal→won auto-creates client_onboarding; no builder UI |
| Email / calendar integration | ABSENT (in CRM) | LoungeMail/Calendar exist platform-wide but no linkage to CRM records; timeline could surface crm_communications but nothing writes emails to it |
| Audit trail | PARTIAL | lead_status_history, crm_deal_activities, lead_imports (admin engine only), crm_timeline RPC; no field-level audit, no workspace assignment/note history |
| API / webhooks | ABSENT | no public API, no webhook config |
| Permissions | PARTIAL | route guards (admin/user) + RLS assumed; no per-record sharing, no team scoping in workspace (everyone sees org-wide book); crm_deals/proposals silo per user_id |
| Duplicate management | PARTIAL | import-time only (2 of 4 engines); no merge, no dedupe review UI |
| Lead conversion | EXISTS (legacy chain) | enquiry→lead (AdminEnquiries), lead→client (LeadDetailDialog via create-client edge fn); NO conversion concept in workspace crm_* model |

## 6. Notable functional traps found during recon (for the overhaul plan)
- CRMShell "New" button disabled when book is empty (orgId derived from first fetched row) — cold-start cannot create records; import is the only bootstrap.
- WorkflowsView fetches crm_workflow_runs and drops them (never rendered).
- Legacy inline edit silently drops personal_name/postcode edits; name input writes personal-name edits into business_name.
- Admin export exports the current 50-row page only; toast implies full export.
- LeadImportDialog dupe `.or()` interpolates raw CSV values (commas/quotes in a business name break the filter string).
- useCRMDeals fetch has no user filter while insert is user-scoped — cross-user visibility depends entirely on RLS.
- AdminLeadManagement + LeadImportDialog + LeadDetailDialog + FullScreenLeadView(admin path) are currently unreachable (Dashboard leads tab redirects) — "protected" import engine #4 is dead code today but is also the ONLY audited import engine.

---

# PART O — QUOORO OFFICE COHERENCE AUDIT (office overhaul Phase 0 · 2026-08-02)

Scan: 53 files (42 routed screens + office components), automated tell
scan + census cross-read. The shell (LoungeOffice, OfficeQuickActions,
AppTile, officeIdentity) was rebuilt this cycle and is clean; the
findings below are the interiors.

## O.1 The structural finding — bolted-together, not ugly
Every module home carries its own chrome: its own back button style, its
own header block, its own paddings/radii/table treatment. 12 modules use
`rounded-2xl/3xl` cards while the platform kit is 10-14px; 17 files
still use `backdrop-blur` glass; 19 gradient washes survive inside
editors; 17 purple/indigo hits contradict the token palette (worst:
DesignStudioEditor 14 gradients + 6 indigo, WordEditor 4 + 3). No two
modules share a toolbar. This is the "separate generated modules"
diagnosis - the anatomy (header → toolbar → content → detail) does not
exist anywhere yet.

## O.2 Tell inventory (automated, per worst offender)
- DesignStudioEditor.tsx: 27 tells (gradients, glass, indigo, scale-hover)
- WordEditor.tsx: 12 (gradients, glass, purple)
- OfficePollsHome / StickyWallHome / FormsHome / WhiteboardHome: glass +
  rounded-3xl template homes, near-identical to each other and to any
  Lovable starter (Section 2 fail)
- OfficeBookmarks: 9 emoji in UI copy; OfficeOneNoteHome: 7
- EmojiPicker.tsx: 341 emoji are DATA (its picker set), not slop - exempt
- SlashCommandMenu / AIWritingAssistant / WordRibbon: purple accents,
  glass, scale-hovers inside the Docs editor
- 6 scale-hovers, 0 animate-ping (swept previously)

## O.3 Coherence breaks beyond styling
- Back navigation: four different exit affordances across module homes
  (ghost button, plain arrow, breadcrumb text, none-just-browser-back).
- Empty states: five different patterns (some dashed boxes, some emoji
  headlines, some nothing).
- Search: per-module search inputs restyle themselves; none open a
  shared surface. No ⌘K anywhere in Office yet.
- Mobile: several module homes overflow at 390 (tables without card
  transformation: OfficeAccounting, OfficeHR review table, OfficeEcommerce).
- Stateless modules present fake-looking sample chrome instead of honest
  empty states (Operations board, Analytics Studio, Contracts).
