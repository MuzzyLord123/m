<!-- Office overhaul Phase 1 · IA proposal + shell concepts · 2026-08-02 -->
# OFFICE-IA.md — the proposal for Checkpoint 1

Presentation only: every route stays; role gating untouched. This
document is what gets approved or amended at Checkpoint 1.

## 1. Personas (PROVISIONAL — no team research supplied yet)

**The operator at the desk.** Runs a small business inside Quooro
(census: every Office route is customer-gated — Office IS the client's
business toolkit, which is why it sells). Long sessions, keyboard,
two-column density, jumps between money surfaces (Invoices, Expenses,
Accounting) and paper surfaces (Docs, Files). Wants the day's state on
one screen.

**The same operator in the field.** Phone, one hand, thirty seconds.
Five jobs: check status, approve/respond (time-off, polls), quick-add
(expense, task, note), find a record, act on it. Nothing may be buried
below two taps.

If real team/customer feedback is supplied, research synthesis runs
then; skipped until it exists.

## 2. Conceptual-model findings (layers audit residue)

- **"Invoice" is two objects wearing one name** (shapeshifter): the
  Invoice studio makes branded PDF documents (platform_files); the
  accounting/e-commerce context has acc_ar_invoices (ledger objects).
  DECISION PROPOSED: surface vocabulary splits — "Invoices" stays the
  studio; ledger surfaces say "Accounts receivable". No route or
  payload changes.
- **Document vs File** (masked pair): office_documents and
  platform_files both present as "work". Already resolved at the
  surface: one merged ledger, the app column tells them apart. Keep.
- **Vocabulary rule:** no Microsoft residue on any surface (routes may
  keep word-home etc. — frozen and invisible). One name per concept:
  Docs, Sheets, Slides, Notes, Files.
- **Task is device-local** (localStorage). It may feed Today with a
  "this device" caveat; server persistence is a roadmap item, never a
  silent pretence.

## 3. Navigation proposal (groupings + labels only)

Sidebar groups, in the order a working day runs:

| Group | Entries (route unchanged) |
|---|---|
| Workspace | Today (home) · Every app · Recent work |
| Documents | Docs · Notes · Files · PDF · Wiki |
| Money | Sheets · Invoices · Accounting · Expenses · Time |
| Build | Design · Slides · Whiteboard · E-commerce |
| Think | Analytics · Forms · Polls · Sticky wall |
| Run | Operations · HR · Tasks · Contracts |
| Utilities | Passwords · Calculator · Pomodoro · **Bookmarks** |

Changes vs today: **Bookmarks joins the registry** (census: live route,
currently reachable only by URL — the alternative is retiring it, which
is a product call, not a design one). Everything else is the six
families already in the shell. Rail (collapsed) mode pins the daily
drivers; ⌘K jumps to everything.

## 4. Today briefing — block plan (data-honest)

| Block | Source | Status |
|---|---|---|
| Greeting + counts | profile name, merged recents | SHIPS (live now) |
| Needs you: approvals | hr_time_off_requests status=pending | SHIPS Phase 3 |
| Needs you: open polls | office_polls not yet voted by user | SHIPS Phase 3 |
| Needs you: running timer | — time_entries stores completed durations only; no running state exists | OMITTED → OFFICE-ROADMAP |
| Today: due tasks | localStorage office-tasks | SHIPS Phase 3, "this device" caveat |
| Today: edited today | merged recents (exists) | SHIPS (live now) |
| Movement feed | no unified activity source | OMITTED → OFFICE-ROADMAP |

## 5. The two shell concepts (both on the shared tokens)

**A — Studio graphite.** The platform direction at operator density.
Card-surface chrome, 10–14px radii, whispered-tint app marks, one ember
accent. Calm, warm, reads as the same family as the Client Portal.

**B — Instrument ink.** Office-only presence: band and sidebar drop to
the true near-black page ink and the CONTENT carries the lift; corners
tighten to 6–8px; nav rows densify; a single ember scanline under the
band. Reads as a console — the team side visibly its own instrument
while every token stays shared.

Both are implemented behind a presentational `?chrome=ink` toggle for
side-by-side review; the loser is deleted in Phase 2, not kept as a
theme.

## 6. Deferred to Phase 2 (so no dead affordances ship in concepts)

- Notifications bell: renders only once wired to the real notifications
  source; no decorative bell.
- ⌘K palette: the shortcut and search affordance land in the shell now
  (they focus the real command bar); the full jump/action palette is
  Phase 2.
- The dead Settings gear in the band is REMOVED (audit: dead
  affordance) until a real settings surface exists.
