# CRM Rebuild — Existing Data Audit & Mapping (Phase 1)

Status: **read-only audit**. No schema changes yet. Approve or amend this doc, then I run the Phase 1 migration.

## 1. What already exists

| Table | Rows | Role today | Notes |
|---|---:|---|---|
| `leads` | 4,372 | Main CRM entity. One flat row = one prospect. Fields: `business_name`, `personal_name`, `contact_name`, `is_personal`, `email`, `phone`, `website_url`, `location_*`, `google_rating`, `review_count`, `category`, `source` (enum), `status` (enum), `assigned_to`, `last_contacted_at`, `tags` (jsonb), `converted_client_id`, `enquiry_id`, `enquiry_data` (jsonb) | No company/contact separation. `is_personal` distinguishes solo contacts from businesses. |
| `enquiries` | 6 | Inbound web-form submissions with `resume_token`, `form_step`, `is_draft` | Referenced by `leads.enquiry_id` |
| `lead_notes` | — | Text notes per lead | Keep — becomes `communications` rows (channel=`internal`) |
| `lead_status_history` | — | Per-lead status transitions | Keep — folds into `lifecycle_history` |
| `lead_imports` | — | Bulk-import audit | Keep as-is (operational metadata) |
| `crm_deals` | **0** | Deals schema exists but unused. Fields: `deal_name`, `stage` (flat text), `probability`, `deal_value`, `won`, `lost_reason`, `lead_id` | Empty — safe to restructure/replace |
| `crm_deal_activities` | 0 | Deal audit log | Empty — replace with `lifecycle_history` + `communications` |
| `client_teams` | 25 | "Customer" today. `primary_account_id → auth.users`, `team_code`, `team_name` | **This is your de-facto Company table.** Migrate 1:1 into `companies` |
| `team_memberships` | 26 | Users belonging to a client team | Keep — feed `contacts` (each membership becomes a contact row linked to the company) |
| `client_onboarding` | 0 | Onboarding checklist per team | Empty — keep table; will be triggered by Phase 5 workflow "Lead → Customer" |
| `client_contracts` | 1 | Signed contracts per team | Keep; later gains `opportunity_id` + `renewal_date` (Phase 2) |
| `client_pricing` | 4 | Negotiated per-team pricing | Keep as-is (finance concern, not CRM identity) |
| `client_billing` | — | Billing snapshots per team | Keep as-is |
| `client_invoices` | — | Invoices per team | Keep as-is; Phase 4 wires `crm_financial_links` |
| `proposals` | 2 | Proposals with `lead_id` + `deal_id` | Keep; `deal_id` will point at new `opportunities` |
| `app_projects` | 2 | User's project list (`user_id`), **not linked to a customer** | Later gains optional `company_id` / `opportunity_id` (Phase 5) |
| `support_tickets` | — | Support requests | Later linked into unified timeline |
| `comm_messages` | 6 | Internal team chat channels | **Separate concern** — team chat, not customer comms. Leave alone. |
| `acc_customers` | 0 | Accounting's own customer roster | Empty. Phase 4 adds `crm_company_id` FK. Not touched now. |

## 2. Phase 1 target model (unified entity graph)

New tables introduced:

- **`companies`** — canonical org identity. Populated from `client_teams` + any `leads` row where `is_personal = false`.
- **`contacts`** — canonical people identity. Populated from `team_memberships` + `leads` where `is_personal = true` + any lead with an email/phone.
- **`crm_lifecycle_stages`** (seeded per org) + **`crm_lifecycle_history`** — replaces flat `crm_deals.stage` text.
- **`opportunities`** — replaces `crm_deals`. FK to `companies` / `contacts` / `crm_lifecycle_stages`. `crm_deals` stays as a **view** for one release so existing UI keeps compiling.

Both `companies` and `contacts` get `relationship_type text[]` with values from `{customer, lead, supplier, partner, investor}`. Multi-badge display per your answer.

## 3. Migration plan (no data loss)

1. Create `companies`, `contacts`, `crm_lifecycle_stages`, `crm_lifecycle_history`, `opportunities` (+ GRANTs + RLS + indexes).
2. **Backfill `companies`** from:
   - Every `client_teams` row → 1 company (relationship_type = `['customer']`, keep `client_teams.id` as `companies.legacy_team_id`).
   - Every `leads` row where `is_personal = false` AND no matching company by `business_name` → 1 company (relationship_type = `['lead']`, `legacy_lead_id` set).
3. **Backfill `contacts`** from:
   - Each `team_memberships` row → 1 contact linked to that company.
   - Each `leads` row → 1 contact (linked to the company from step 2 if business, else standalone).
4. Seed default `crm_lifecycle_stages` per org (Prospect → Qualified → Proposal → Contract → Onboarding → Active → Renewal → Churned).
5. `crm_deals` is empty — skip data migration; create `crm_deals_compat` **view** that projects `opportunities` back into the old column shape so `useCRMDeals`, `DealPipeline`, `DealForecast`, `DealDialog` keep working unchanged until Phase 2 UI update.
6. Add nullable `company_id` / `contact_id` columns to `proposals`, `client_contracts`, `client_onboarding`, `support_tickets`, `app_projects` and backfill from existing FKs. Old FKs stay in place.

**Nothing is dropped in Phase 1.** `leads`, `client_teams`, `crm_deals`, `team_memberships` all remain intact so the current UI keeps rendering.

## 4. Code that will keep working unchanged after Phase 1

Verified references — none require edits in Phase 1:

- `src/hooks/useCRMDeals.ts` — reads `crm_deals` → served by the compat view.
- `src/components/crm/{DealDialog,DealPipeline,DealForecast,ProposalEditor,ProposalList,FullScreenLeadView}.tsx` — untouched.
- `src/pages/lounge/LoungeCRM.tsx`, `AdminLeadManagement`, `LeadDetailDialog`, `AdminEnquiries`, `AdminClientAccounts` — untouched.
- `LoungeTeam`, `LoungeWhiteLabel`, `LoungeOverview`, `CustomerLogin` — read `client_teams` directly → untouched.

Phase 2 is when the UI starts reading from `companies` / `contacts` / `opportunities` and the compat view can be retired.

## 5. Open questions before I run the migration

1. **`org_id` scoping** — the spec references `org_id` everywhere, but this project currently scopes admin CRM data by the primary admin (single-tenant on the CRM side). Options:
   - **(a)** Use `get_primary_admin_id()` as the `org_id` for all backfilled rows now, add real org scoping when multi-tenant is needed.
   - **(b)** Use `acc_organizations.id` (accounting is already multi-org) as the source of truth for `org_id` — requires every admin to have an accounting org first.
   - **Recommend (a)** for Phase 1 — matches current CRM behaviour, doesn't block accounting.
2. **Personal leads → contacts only?** A lead like "John Smith, freelancer, no company" today has `is_personal = true`. Migrate as **contact only** (no company row) — confirm?
3. **Deduping companies by domain** — if two `client_teams` share a domain (e.g. two teams for the same real company), keep them as two `companies` rows in Phase 1 and add a dedupe UI later. Confirm?

Reply "go" (with any answers to 1–3) and I'll write the Phase 1 migration.
