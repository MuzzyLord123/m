## Goal

Create a single, dedicated **Account Creation** section under the Admin menu that handles all account provisioning (admins + clients), replacing the standalone `/admin/team` (Manage Admins) page. The existing **Clients** tab stays as-is for managing existing client accounts and creating live-preview accounts on the fly.

## New Admin tab: "Account Creation"

- Sidebar entry: **Account Creation** (replaces the "Manage Admins" link and the current `/admin/team` route becomes a redirect).
- Tab key: `account-creation`, rendered inside the existing Dashboard admin shell (`src/pages/Dashboard.tsx`) so it uses the same layout/style as other admin tabs.
- Layout: left sub-nav with three sections + settings:
  1. **Create Account** (wizard)
  2. **Manage Admins** (list + create/revoke — moved from `/admin/team`)
  3. **Settings → Account Type Presets** (controls what each account type can see)

## Create-Account wizard

Step 1 — Pick account type (four options, each with clear description):

| Type | Purpose | Default access preset |
|---|---|---|
| **Paid Client** | Full paying customer | Everything (current client default) |
| **Live Preview** | Prospect exploring the platform | Website / preview features, no billing prompts (current live-preview behavior) |
| **Viewer Only** | Just looking around, no prompts | Read-only browse of demo areas. **No** "check your live preview" prompt, no upgrade banners, no billing nags |
| **Business Management** | Non-website client using CRM/Office/etc. | CRM, Quooro Office, Planner, Files, Vault, Calendar, Email, Comms, Bookings, Inventory, Accounting, HR, Reports, Notifications. **No** website builder, CAD studio, hosted sites, subscription sites, ecommerce site builder, preview prompts |
| **Admin** | Internal team member | Full Quooro Team access |

Step 2 — Enter account details. Reuses the same form fields the current **Clients → Create Account** flow uses (email, password, full name, company, phone, plan/notes, etc.). For Admin, uses the simpler admin form. For Viewer/Business Management, hides website-only fields (plan, page count, preview URL, website status).

Step 3 — Confirm & create. Calls the appropriate edge function:
- Admin → existing `create-admin-account`
- Client types → existing `create-client` (extended with an `account_type` field so the backend stamps the profile)

## Access-preset settings

New sub-page **Settings → Account Type Presets** inside Account Creation. For each of the four client-facing types, an admin can toggle which apps/pages that type sees. Each toggle maps to an existing sidebar item key. Auto-populated defaults per the table above; admins can add/remove per type.

Storage: new `account_type_presets` table (`account_type`, `visible_features jsonb`, timestamps). Read at login on the client side to filter the sidebar layout. Existing `useSidebarLayout` / `useTeamSidebarLayout` hooks get a filter applied based on the current user's `profiles.account_type`.

Auto-generated preset for Business Management (from a scan of features present in the app): CRM, Quooro Office (docs/sheets/slides/wiki), Planner, Calendar, Files, Vault, Email, Team Comms, Bookings, Inventory, Accounting, HR, Ad Management, Social Media, Marketing Calendar, Content Requests, Notifications, Support Tickets. Excluded: Website Designer, CAD Studio, Hosted/Subscription Sites, Ecommerce site builder, live-preview banners.

## Database changes (single migration)

- `profiles.account_type` text (values: `paid_client`, `live_preview`, `viewer_only`, `business_management`, `admin`). Default `paid_client` for existing rows; backfill admins from `user_roles`.
- New table `account_type_presets` (account_type PK, visible_features jsonb, updated_at) + GRANT + RLS: read by any authenticated user, write only by admins. Seeded with defaults on migration.
- Client code reads `profiles.account_type` + preset to filter sidebar and hide preview/billing prompts.

## Prompt suppression

- Viewer Only and Business Management: `EmailVerificationBanner`, "check your live preview" prompts, billing/upgrade CTAs, and website-onboarding modals all guarded by `if (accountType !== 'viewer_only' && accountType !== 'business_management')`.

## Files to add / edit

**New**
- `supabase/migrations/<timestamp>_account_creation_and_presets.sql`
- `src/pages/admin/AccountCreation.tsx` (wizard + sub-nav shell)
- `src/pages/admin/account-creation/CreateAccountWizard.tsx`
- `src/pages/admin/account-creation/AccountTypePresets.tsx`
- `src/pages/admin/account-creation/ManageAdminsPanel.tsx` (extracted from current `AdminManagement.tsx`)
- `src/hooks/useAccountType.ts` (reads `profiles.account_type` + preset, exposes `canSee(featureKey)`)

**Edited**
- `supabase/functions/create-client/index.ts` — accept and store `accountType`
- `src/pages/Dashboard.tsx` — add `'account-creation'` to `mainTab` union + render `<AccountCreation />`; keep `'clients'` tab intact
- `src/components/layout/TeamLayout.tsx` (or wherever admin sidebar items live) — add "Account Creation" entry, remove "Manage Admins" link (or link it inside the new page)
- `src/App.tsx` — `/admin/team` → redirect to `/dashboard?tab=account-creation`
- `src/components/EmailVerificationBanner.tsx` and any "live preview" prompts — gate on account type
- `src/hooks/useSidebarLayout.ts` / `useTeamSidebarLayout.ts` — apply preset filter

## Out of scope

- No change to the **Clients** tab (creation/management flow there stays)
- No change to the CRM work already shipped
- No new pricing / plan logic
