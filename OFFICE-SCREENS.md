<!-- Office overhaul Phase 0 · module census · 2026-08-02 -->
# OFFICE-SCREENS.md

Every Quooro Office route, its component, its module type (per the
anatomy standard), and where its state actually lives. Routes are
frozen; labels and grouping are presentation. Census generated from
src/App.tsx + per-file data-call scan; DATA-CONTRACTS.md Part A carries
the wire detail.

Access: every route below is CustomerGuard-protected (customer role);
admins reach Office equivalents through the Team dashboard. No Office
route is role-split internally.

| Route | Component | Type | State lives |
|---|---|---|---|
| `/lounge/office` | LoungeOffice | shell | server:office_documents,platform_files |
| `/lounge/office/word/:docId` | LoungeWordEditor | record(editor) | stateless/in-memory |
| `/lounge/office/word-home` | OfficeWordHome | list | server:office_documents |
| `/lounge/office/excel-home` | OfficeExcelHome | record(editor) | stateless/in-memory |
| `/lounge/office/sheets-home` | SheetsHomeDash | list | stateless/in-memory |
| `/lounge/office/powerpoint-home` | SlidesHome | list | stateless/in-memory |
| `/lounge/office/slides/edit` | OfficePowerPointHome | record(editor) | stateless/in-memory |
| `/lounge/office/onenote-home` | OfficeOneNoteHome | record(editor) | server:platform_files |
| `/lounge/office/onedrive` | OfficeOneDrive | files | server:office_documents,platform_files |
| `/lounge/office/design-studio` | DesignStudioHome | list | stateless/in-memory |
| `/lounge/office/design-studio/editor` | DesignStudioEditor | record(editor) | stateless/in-memory |
| `/lounge/office/design-studio/projects` | DesignStudioProjects | list | stateless/in-memory |
| `/lounge/office/design-studio/templates` | DesignStudioTemplates | list | stateless/in-memory |
| `/lounge/office/design-studio/brand` | DesignStudioBrand | settings | stateless/in-memory |
| `/lounge/office/design-studio/ai` | DesignStudioAI | record(tool) | stateless/in-memory |
| `/lounge/office/whiteboard` | OfficeWhiteboard | record(editor) | stateless/in-memory |
| `/lounge/office/whiteboard-home` | OfficeWhiteboardHome | list | stateless/in-memory |
| `/lounge/office/forms` | OfficeForms | record(editor) | stateless/in-memory |
| `/lounge/office/pdf` | OfficePDF | record(editor) | stateless/in-memory |
| `/lounge/office/pdf-home` | OfficePDFHome | list | server:platform_files |
| `/lounge/office/pdf-creator` | OfficePDFCreator | record(editor) | stateless/in-memory |
| `/lounge/office/tasks` | OfficeTasks | list | local:office-tasks |
| `/lounge/office/calculator` | OfficeCalculator | record(tool) | server:calculator_history |
| `/lounge/office/pomodoro` | OfficePomodoro | record(tool) | server:pomodoro_sessions |
| `/lounge/office/polls` | OfficePolls | board | server:comm_channel_members,comm_channels,comm_messages,office_poll_options,office_poll_votes,office_polls,profiles |
| `/lounge/office/polls-create` | OfficePolls | board | server:comm_channel_members,comm_channels,comm_messages,office_poll_options,office_poll_votes,office_polls,profiles |
| `/lounge/office/polls-home` | OfficePollsHome | list | stateless/in-memory |
| `/lounge/office/bookmarks` | OfficeBookmarks | list | stateless/in-memory |
| `/lounge/office/sticky-wall` | OfficeStickyWall | board | server:sticky_walls |
| `/lounge/office/sticky-wall-home` | OfficeStickyWallHome | list | server:sticky_walls |
| `/lounge/office/operations` | OfficeOperations | board | stateless/in-memory |
| `/lounge/office/accounting` | OfficeAccounting | list/table | server:acc_chart_of_accounts,acc_journal_entries,acc_journal_lines,acc_org_members,acc_organizations,acc_trial_balance |
| `/lounge/office/ecommerce` | OfficeEcommerce | list/table | server:acc_ar_invoice_lines,acc_ar_invoices,acc_chart_of_accounts,acc_customers,acc_organizations,subscription_site_events,subscription_sites |
| `/lounge/office/invoices` | OfficeInvoices | record(editor) | server:platform_files |
| `/lounge/office/hr` | OfficeHR | list/record | server:hr_candidates,hr_employees,hr_performance_reviews,hr_time_off_requests |
| `/lounge/office/wiki` | OfficeWiki | record(editor) | server:wiki_pages |
| `/lounge/office/forms-home` | OfficeFormsHome | list | stateless/in-memory |
| `/lounge/office/analytics` | OfficeAnalyticsStudio | record(tool) | stateless/in-memory |
| `/lounge/office/expenses` | OfficeExpenseManager | list | server:expenses · edge:parse-receipt |
| `/lounge/office/time-tracker` | OfficeTimeTracker | list | server:time_entries |
| `/lounge/office/contracts` | OfficeContractManager | list | stateless/in-memory |
| `/lounge/office/passwords` | OfficePasswordVault | settings/list | server:password_vault_configs,password_vault_items |

## Census findings (feed Checkpoint 1)

1. **Reachable but unlisted.** `/lounge/office/bookmarks` (OfficeBookmarks,
   list, in-memory) is a live route absent from the shell's app registry -
   reachable only by URL. IA proposal must list it or mark it legacy.
2. **Editor pairs.** Docs, Sheets (excel-home), Slides (slides/edit),
   PDF (pdf, pdf-creator), Whiteboard, Forms, Design Studio each split
   into home/list + editor routes. The anatomy treats homes as list
   modules and editors as record modules (full-bleed canvas allowed,
   shared header anatomy still applies).
3. **Microsoft residue in the seams.** Routes and components still say
   word-home / excel-home / powerpoint-home / onenote / onedrive.
   Routes are frozen (fine, invisible); user-facing labels are already
   Quooro (Docs/Sheets/Slides/Notes/Files) - keep it that way in every
   module header when interiors are rebuilt.
4. **State honesty for the Today briefing** (3C):
   - EXISTS server-side: hr_time_off_requests (pending approvals),
     office_polls (open polls), time_entries (running timer),
     expenses, office_documents + platform_files (recents, starred),
     pomodoro_sessions, sticky_walls, wiki_pages, password vault,
     acc_* ledger, subscription_sites (+ AR invoices).
   - EXISTS locally: office-tasks (localStorage) - due tasks CAN feed
     Today with a "this device" caveat, roadmap server persistence.
   - ABSENT: unified activity stream -> "Movement" block does NOT ship;
     logged to OFFICE-ROADMAP (see CRM-ROADMAP.md appendix note).
5. **Stateless tools** (calculator keeps history server-side; contracts,
   operations, analytics, bookmarks, tasks, sheets, slides, forms,
   design studio, whiteboard hold nothing server-side): their empty
   states must say so honestly - no fake ledgers.
