<!-- Office overhaul · honest gaps + rollout queue · 2026-08-02 -->
# OFFICE-ROADMAP.md

## 1. Anatomy rollout queue (band + toolbar + content + empty states)
word-home, sheets-home/excel editor, powerpoint/slides editor,
onenote, onedrive, design-studio (5 screens - NOTE: its editor
gradients are canvas features, chrome only), pdf trio, tasks,
calculator, pomodoro, polls workspace, sticky wall editor, operations,
accounting, ecommerce, invoices, hr, wiki, forms builder, analytics,
time-tracker, contracts, passwords. Each: same band, LABEL furniture,
OfficeEmpty, mobile card transformation where tables exist
(accounting, HR, ecommerce flagged at 390 in AUDIT Part O).

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
