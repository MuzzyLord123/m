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
