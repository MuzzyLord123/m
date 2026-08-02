<!-- Office overhaul · honest gaps + rollout queue · 2026-08-02 -->
# OFFICE-ROADMAP.md

## 1. Anatomy rollout - COMPLETE
Every routed Office screen now carries the band or a written deviation
(OFFICE-SPEC §5), including the three canvas editors. Remaining
polish, not structure:
- Sheets: mobile ribbon could collapse further at 390 (currently
  scrolls); column/row resize handles unstyled.
- Design editor: the Templates panel plates are neutral placeholders -
  real template thumbnails need a template source.
- Accounting/HR/E-commerce wide tables scroll horizontally inside
  their own wrappers (by design); card transformation would suit 390
  better.

## 2. Missing data sources (blocks that could not ship honestly)
- Movement/activity feed: no unified activity source in Office.
- Running timer: time_entries stores completed durations only.
- Tasks: localStorage only - server persistence unlocks cross-device
  Today and reminders.
- Forms + Whiteboard persistence: builders are in-memory; saved forms
  with response collection, saved boards.
- Bookmarks persistence: in-memory today (honest note shipped).
- Notifications tray: no Office-scoped notification source; band bell
  ships only with it.

## 3. Platform items
- Server-side persistence for office:rail, office:lastView, saved views.
- Lighthouse + full WCAG keyboard audit to run in CI against the
  deployed build (target A11y ≥ 95, BP ≥ 95, Perf ≥ 85) - not
  measurable meaningfully from the dev container.
- Invoice vocabulary split ("Accounts receivable" on ledger surfaces)
  lands with the accounting/ecommerce rollout.
