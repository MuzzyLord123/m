# FEATURE-GAP.md
## The CRM vs the enterprise canon — 2026-07-30 · branch crm-overhaul

Classification: **A** exists (polish to standard) · **B** achievable in
the presentation layer now (ships in this overhaul) · **C** requires
backend (specified in CRM-ROADMAP.md, untouched until the freeze lifts
and each item is approved).

| Canon feature | Today | Class | Plan |
|---|---|---|---|
| Records (companies/contacts/opportunities) | Workspace CRUD on crm_* tables, virtualised list | **A** | Polish: record header, facts panel, mobile card list |
| Custom fields | Absent (fixed schema; extras folded into notes) | **C** | Roadmap: crm_field_defs + JSONB values |
| Pipeline / stages | Lifecycle stage field exists; kanban only in legacy deals view; touch-dead drag | **B** | Kanban over the existing stage-update request; tap-to-move on mobile |
| Forecasting / weighted pipeline | "Not yet weighted" placeholder | **C** | Roadmap: probability field + aggregates |
| Activities / tasks / reminders | Absent (workspace); legacy deals have activity rows | **C** | Roadmap: crm_activities + notification hook |
| Notes | NotesPanel per record (crm_notes CRUD) | **A** | Polish into the timeline |
| Timeline | Timeline rpc exists (per-record events) | **A/B** | Compose notes + stage history + imports into one ledger |
| Tags / segmentation | relationship_type array exists ('lead' etc.) | **B** | Tag chips UI over the existing field + filter by it |
| Saved views & filter builder | Absent | **B** | Client-side filter builder; views persist in localStorage (no endpoint exists) → roadmap server-side |
| Global search | Workspace search field (client-side over fetched page) | **B** | Debounced search UX + ⌘K "jump to lead" (client-side over fetched rows; stated limit: current page/book ≤ fetched set) |
| Bulk operations | Bulk owner-assign exists; no bulk UI polish | **A/B** | Bulk bar on the existing bulk endpoints only |
| Import / export | THE golden feature (see IMPORT-CONTRACT.md); csvIO export | **A** | Shell rebuild to 4D; engine byte-identical; fix the vanishing receipt |
| Import history | Only dormant admin engine logs lead_imports | **C** | Roadmap: wire lead_imports read into the new shell |
| Reporting | Business overview fact tiles | **B** | Honest client-side reports view (by stage/source; limit: computed over fetched rows, book ≤ ~10k; beyond that → roadmap aggregates) |
| Assignment / ownership | Owner picker + bulk assign exist | **A** | Polish with AvatarID + briefing counts |
| Automations | Workflows surface exists (rules elsewhere) | **C** | Roadmap: CRM-triggered automations |
| Email / calendar integration | Mail + calendar exist as apps, not linked to records | **C** | Roadmap: activity sync |
| Audit trail | Absent (workspace) | **C** | Roadmap: crm_audit rows |
| API / webhooks | Absent | **C** | Roadmap |
| Permissions | Role gates (admin/user) only | **C** | Roadmap: per-team visibility |

## Conceptual-model findings (naming = presentation; structure = roadmap)

1. **Two lead universes.** Enquiry → convert inserts into `leads`;
   the only nav-reachable CRM reads `crm_contacts`. Deals/proposals FK
   the legacy `leads` table. Presentation can label honestly ("Enquiry
   leads" vs "Relationships") but UNIFICATION IS C-TRACK (top of the
   roadmap — this is the biggest structural debt in the product).
2. "Opportunities" (workspace) vs "Deals" (legacy) — same concept, two
   names. B-track: consistent naming in UI copy ("Opportunities").
3. Satellite `src/components/crm/` family (FullScreenLeadView, Deal*,
   Proposal*) still wears the pre-overhaul theme — Phase 3 scope.

## Personas (provisional)

- **The client on a bus** (390px, one thumb): checks who came in, calls
  a lead, imports a file a supplier sent. Speed + trust + zero mistakes.
- **The operator at the desk** (1440px, keyboard): works the whole book,
  filters, bulk-assigns, moves stages, reports Monday numbers.
