# CRM-ROADMAP.md
## C-track: backend-dependent features, specified for after the freeze

Nothing here is built until the platform freeze lifts AND each item is
approved individually. Every addition is additive-only: new tables,
new endpoints, new RPCs — existing contracts and the PROTECTED import
engine untouched.

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
