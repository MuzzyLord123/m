# CRM-ROADMAP.md
## C-track: backend-dependent features, specified for after the freeze

Nothing here is built until the platform freeze lifts AND each item is
approved individually. Every addition is additive-only: new tables,
new endpoints, new RPCs — existing contracts and the PROTECTED import
engine untouched.

## Priority program: CRM and accounting unification (owner request, 2026-07-30)

The goal, in the owner's words: the CRM connected to the accounts so a
record is the entire business relationship, and invoices generated
automatically on a won deal instead of manually in the Office invoice
maker.

**What already ships now, presentation-side (no freeze exception needed):**
- Account standing (Invoiced / Paid / Outstanding) on every record, from
  the existing `crm_entity_lifetime_value` rpc, loaded when the record
  opens instead of hidden behind the Financials tab.
- Linked financial documents per record from the existing
  `crm_entity_financials` rpc (Financials tab).
- Relationship links (company, people, deals) joined client-side over the
  already-fetched books.

**What needs the freeze lifted plus per-item approval (backend work):**

A. **Deal-won auto-invoice.** On a lifecycle move into a won stage
   (`crm_set_lifecycle_stage` already logs the transition), a database
   trigger or edge function: find-or-create the `acc_customers` row for
   the linked company/contact, insert `acc_ar_invoices` +
   `acc_ar_invoice_lines` from the deal's value and currency as a DRAFT,
   then optionally `acc_post_ar_invoice`. This drives the exact tables
   and rpcs the Office AR screen writes by hand today, so the manual
   invoice maker keeps working unchanged and drafts stay reviewable
   before posting. Recommended default: create as draft, owners approve
   to post.
B. **Payment sync into the CRM.** `acc_post_ar_payment` (and any future
   provider webhooks from Xero/QuickBooks if external books are added)
   also writes a CRM timeline event, so "Invoice QU-1042 posted" and
   "Payment received: GBP 2,100" appear in the record's activity stream
   next to notes and stage changes. Needs a small append into the
   timeline source the `crm_timeline` rpc reads.
C. **Aggregated metrics engine.** A materialised rollup (or scheduled
   rpc) of per-entity invoiced/paid/outstanding so the LIST view can show
   balances beside names without one rpc call per row. Today the
   per-entity rpc is fine for the open record; a list-wide column needs
   the batch rollup first. Also unlocks overdue flags in the table.
D. **Overdue surfacing.** `acc_ar_aging` already buckets overdue AR.
   Join it to CRM records (via the same links `crm_entity_financials`
   uses) to flag "payment overdue" on the record header and dashboard
   before the client ever has to chase.

Order of build once approved: C (rollup) then A (auto-invoice) then B
(timeline events) then D (overdue flags). A alone delivers the "stop
making invoices manually" outcome.

Suggested order:

1. **Lead universe unification** (the structural debt). Enquiry
   conversion and deals/proposals live on `leads`; the flagship CRM
   reads `crm_contacts`. Additive path: a `crm_contacts.legacy_lead_id`
   link + a one-time backfill migration + conversion flow writing both
   (or a view). Until then the UI labels the two books honestly.
2. **Server-side saved views** — `crm_saved_views` (user_id, entity,
   name, filters JSONB, sort). Replaces the localStorage views shipped
   now (marked in-app as "Saved on this device").
3. **Tasks & reminders** — `crm_activities` (record FK, type, due_at,
   done_at, owner) + notification fan-out; unlocks "due today" briefing
   counts.
4. **Reporting aggregates** — RPCs for stage/source/owner rollups so
   reports stop depending on client-side maths over fetched rows.
5. **Import history surface** — read path for `lead_imports` (the
   dormant admin engine already writes it) + write from the live engine
   (one additive insert after runImport; engine core untouched).
6. **Weighted pipeline / forecasting** — probability per stage,
   weighted totals in the overview.
7. **Automations** — stage-change triggers into the existing
   automation_rules framework.
8. **Email/calendar linkage** — activity rows from Mail/Calendar apps
   onto records.
9. **Audit trail** — `crm_audit` append-only, surfaced on the record
   timeline.
10. **Public API + webhooks** — scoped keys, outbound events.
11. **Per-team permissions** — visibility scopes beyond admin/user.

Each item ships with: schema, RLS policies, DATA-CONTRACTS.md update,
and a UI already designed for it in this overhaul (the surfaces exist
as designed placeholders or localStorage versions today).
