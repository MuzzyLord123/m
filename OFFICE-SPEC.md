<!-- Office overhaul · shell + anatomy spec · 2026-08-02 -->
# OFFICE-SPEC.md

The chosen chrome is **Instrument ink** (Checkpoint 1): black chrome
under a lifted content plane, one ember accent, whispered-tint app
marks. This document is the contract every module is held to.

## 1. The shell (src/pages/lounge/LoungeOffice.tsx)

- **Title band** — h-12, bg-black/60, hairline bottom + 1px ember
  scanline (bg-primary/60). Contents: exit (round ghost), divider,
  Q mark (22px primary tile), "Office", centre command affordance
  (lg+, 300px, rounded-[7px]), mobile search icon, account button
  (initials, real profile menu). No dead affordances: the settings
  gear and notifications bell ship only when wired to real surfaces.
- **Sidebar** — 216px, bg-black/60. Workspace (Today / Every app /
  Recent work, active = ember text + left bar) then the six IA groups,
  each label ember-ticked, app rows h-8 with 20px marks. Footer:
  "Quooro Office 2.0" + collapse. Collapses to the 64px pinned rail
  (localStorage `office:rail`).
- **Command palette** — ⌘K / Ctrl K / `/`, and both search
  affordances. Sections: Views, Create, Apps, Recent work. Arrow keys,
  Enter, Esc; listbox semantics. It is the only global search surface.
- **Shortcut overlay** — `?`. Lists only keys that work.
- **Mobile** — frosted tab bar (Home/Apps/Recents, active tinted
  ember), launcher clear of the tab bar, palette from the band icon.

## 2. Page anatomy (src/pages/lounge/office/ModuleShell.tsx)

Every module mounts: **OfficeModuleBand** (back → Office with
fromOfficeApp state; AppTile 22 + module name; optional context count;
right-side actions) → toolbar (module's own filters/search) →
**OfficeContent** (bg-card/45 plane, max-w 1000/1240) → detail
(drawer/sheet per module). **OfficeEmpty** is the only empty state.
Editors (Docs, Sheets canvas, Design, Whiteboard, PDF) may run
full-bleed under the band — the band itself is non-negotiable.

Deviating from the anatomy requires a written reason here. Current
deviations: none.

## 3. Type + surface system

- SECTION `text-[13.5px] font-semibold tracking-[-0.01em]`
- LABEL `text-[10px] uppercase tracking-[0.09em]` (table furniture only)
- GROUP `rounded-[14px] border-border/40 bg-card`; PILL for search
- AppTile (office/AppTile.tsx): graphite squircle, glyph in the app hue
  desaturated ≤34% sat, lightness via --office-glyph-l (36% light /
  71% dark). The ONLY place app colour exists.
- One accent (ember) for intent: active states, primary buttons,
  scanline, text links.
- No gradients, glass, scale-hovers, emoji, or purple outside tokens.

## 4. Today briefing (home)

Composed only from sources the census proved: greeting + counts
(merged recents), operational line, **Needs you** (pending
hr_time_off_requests · open office_polls · due localStorage tasks with
"saved on this device"), Continue working, Create, Frequent, suite
index, Starred. Blocks self-remove when empty; the quiet state says
"Nothing needs you right now."

## 4b. What the suite contains, and what it refuses to

Office is a business toolkit, not an app store. Four apps were retired
because no enterprise suite ships them and their presence undercut
everything around them: **Pomodoro** (a personal focus timer),
**Calculator** (an operating-system accessory), **Bookmarks** (a
browser feature, and in-memory), and **Sticky wall** (duplicated
Whiteboard). Routes, registry entries and files are gone; their tables
(calculator_history, pomodoro_sessions, sticky_walls) are orphaned and
should be dropped once the backend freeze lifts.

Six modules that were already built but reachable only from the Lounge
now appear in the suite: **Mail**, **Calendar**, **Bookings**, **Team
chat**, **Inventory**, and a new seventh family, **Communicate**.
Accounting's description was rewritten from "Ledger and reports" to
"Ledger, VAT, payroll, banking" because that is what it actually
contains.

**Profitability** is new and is the suite's argument for existing: it
reads billable time (hours x the rate on each entry) and expenses
tagged to the same project, and states the margin per job. It invents
nothing, excludes rejected expenses, and gathers untagged work under
"Untagged" rather than flattering the total by dropping it.

The **opening splash** was replaced. The old one ran four seconds of
orbiting 3D tiles, a particle burst and a white flash over a progress
bar narrating "Loading modules...", painted in Microsoft's and Canva's
registered brand colours. It is now the mark, the wordmark and a
hairline that fills while the app mounts - 820ms, no 3D engine, and it
exits immediately under prefers-reduced-motion.

## 5. Module status (rollout ledger)

**On the band (OfficeModuleBand):** Expenses, Docs home, Sheets home,
Slides home, Files, PDF hub + PDF editor + PDF creator, Tasks, Time,
Contracts, Operations, Calculator, Pomodoro, Passwords, Invoices,
Accounting, HR, Analytics, Polls home + Polls workspace, Sticky wall
home + editor, Wiki (band on index; internal page header carries the
ink signature), Forms home + builder, Whiteboard home, Bookmarks, and
the whole Design studio (its shell mounts the band above its section
rail - one fix, five screens; its dead More button removed).

**De-faked during rollout:** Sheets and Slides homes shipped seeded
demo files ("Budget 2026", "Revenue Tracker") - both now start honest
and empty. Time's dead Reports button removed.

**Canvas editors (done):** Sheets and Slides now mount the band, with
the document name and their own commands (Find/Export; title +
transition + slide position) as band furniture. Sheets' 25-button
ribbon condenses to core formatting plus a **Data** menu (sort,
conditional formatting, freeze) and **Formulas**; its toolbar, formula
bar, grid gutters and sheet-tab strip wear the ink surface, and the
9px mono furniture rises to a legible 10.5px. Slides' overview
sub-view carries the ink header with a labelled back control. The
Design editor loses its gradient app mark (now the real Design mark),
its gradient template plates, glass panels and scale-hovers; the
canvas dot-grid is a feature and stays.

**Written deviations:**
1. E-commerce keeps its own header - it is a dual-context surface also
   mounted in the Lounge (`embedded` prop); its back targets the Lounge
   when standalone. Adopting the band would break the second context.
   Queued for a context-aware band.
2. Notes keeps its per-view headers on mobile (Folders → Notes →
   Editor) - they carry the labelled back controls the drill needs;
   they wear the ink surface and scanline so they read as one
   instrument. Desktop Notes mounts the band.
3. The Design editor keeps its own top bar (File/Edit/View menus, zoom,
   share, save, export) - a canvas menubar the band cannot hold; it
   wears the ink surface and scanline.

**Rollout verification:** 22 routes × 1440 + 390 - band present, no
legacy back-chrome text, no horizontal overflow, no crashes, zero page
errors.
