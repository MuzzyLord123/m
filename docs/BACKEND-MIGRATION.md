# Backend migration — Lovable project → new Supabase project

## Status

| | |
|---|---|
| **New project** | `Quooro` — ref `tkvphfxqyoavnuibvmfp`, region `eu-west-2` (London), free tier |
| **New URL** | `https://tkvphfxqyoavnuibvmfp.supabase.co` |
| **Old project** | ref `ijybotwfiediocoewwux` — **not reachable from this session** |
| **Schema** | Validated and consolidated → `supabase/consolidated-schema.sql` |
| **Data** | **Not migrated.** Needs a dump you run — see below |
| **Edge functions** | Not deployed. Need their secrets first — see below |

Frontend config for the new project is in `.env.new-project`. Do **not** rename it to
`.env` until the schema and data are actually in place, or the app will point at an
empty database.

---

## Why the data could not be copied automatically

Two independent blockers, both outside the code:

1. **The old project is not in this Supabase account.** The account connected here has
   one organisation (`Peptides`) containing one unrelated project. Asking the API for
   `ijybotwfiediocoewwux` returns *"You do not have permission to perform this action"*.
2. **All outbound traffic to `supabase.co` is blocked** by this session's network policy
   (`403` on CONNECT). So `psql`, `pg_dump` and the Supabase CLI cannot reach either
   project from here — the new project could only be built through the management API.

Because of (2), bulk data — your ~4,000 leads — cannot be streamed through this session
at all. That part has to be a direct database-to-database transfer, which is a couple of
commands on your machine.

---

## What the migrations do and don't cover

All 149 migrations in `supabase/migrations/` were replayed against a local PostgreSQL 16
with a Supabase-compatible shim. **146 applied cleanly**, producing:

- 187 tables
- 545 RLS policies
- 351 functions
- 146 triggers
- 22 enum types

That consolidated end state is dumped to `supabase/consolidated-schema.sql`.

### Three migrations are genuinely broken

These fail on *any* database, not just locally — worth knowing because it means the live
database and the migration history already disagree:

1. `20260714001231_a734910e…sql` — `acc_is_accountant_of()` filters on
   `acc_org_members.role`, but that column is never created by any migration. This is the
   same broken accounting role model flagged as **H8** in the security audit.
2. `20260714024522_59e78b6e…sql` — alters policies on `public.ai_model_settings`, a table
   **no migration ever creates**. It exists in your live database because it was made
   through the Lovable/Supabase dashboard rather than a migration.
3. `20260714134307_34b040a5…sql` — seeds `crm_lifecycle_stages` using
   `get_primary_admin_id()`, which is NULL until an admin account exists. It will apply
   once your owner accounts are restored.

**Point 2 is the important one:** the migration files do not fully describe your live
database. Anything else created through the dashboard is missing from them too. That is
why the route below restores from a real dump rather than replaying migrations.

---

## Recommended route — restore from a dump (captures everything)

Run these on your own machine, where the network isn't restricted. Get the two connection
strings from **Dashboard → Project Settings → Database → Connection string (URI)**.

```bash
# 0. Install the CLI once
npm i -g supabase

OLD="postgresql://postgres:<OLD_PASSWORD>@db.ijybotwfiediocoewwux.supabase.co:5432/postgres"
NEW="postgresql://postgres:<NEW_PASSWORD>@db.tkvphfxqyoavnuibvmfp.supabase.co:5432/postgres"

# 1. Schema, data, and auth users — three separate dumps
supabase db dump --db-url "$OLD" -f schema.sql
supabase db dump --db-url "$OLD" -f data.sql  --data-only --use-copy
supabase db dump --db-url "$OLD" -f auth.sql  --data-only --use-copy --schema auth

# 2. Restore into the new project, in this order
psql "$NEW" -f schema.sql
psql "$NEW" -f auth.sql     # keeps user ids AND password hashes, so logins still work
psql "$NEW" -f data.sql
```

Restoring `auth.sql` preserves both the user UUIDs and the bcrypt password hashes, so your
two owner accounts sign in with their existing passwords, and every row that references a
`user_id` still lines up. Restore auth **before** data for that reason.

If the new project already has objects in it when you start, reset it first:
**Dashboard → Settings → General → Reset database**.

### Fallback — if you cannot get the old database password

Use `supabase/consolidated-schema.sql` from this repo for the structure, then export each
table you care about from the old project's **Table Editor → Export → CSV** and import via
**Table Editor → Import**. Do `profiles` and `user_roles` before `leads`, or the foreign
keys will reject the rows. Auth users cannot be exported this way — everyone would need a
password reset.

---

## Then: edge functions

43 functions live in `supabase/functions/`. They are code, not data, so no dump includes
them — deploy them after the database is up:

```bash
supabase link --project-ref tkvphfxqyoavnuibvmfp
supabase functions deploy
```

They will fail until their secrets exist on the new project. Set them under
**Dashboard → Edge Functions → Secrets** (or `supabase secrets set NAME=value`). From the
function sources, you need at least:

`STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `LOVABLE_API_KEY`, `FIRECRAWL_API_KEY`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, plus `SITE_URL`.

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically — don't set those by hand.

`supabase/config.toml` carries the `verify_jwt = false` settings across, which is what
makes several functions publicly callable. Read the next section before deploying.

---

## Read this before you point the app at the new database

A fresh backend is the one moment where the schema-level findings from
`docs/SECURITY-AUDIT-2026-07.md` are free to fix — nothing depends on the new database yet.

Restoring the dump (or applying the consolidated schema) **recreates every one of them**,
because they live in the policies themselves:

- **C3** — the nine `crm_*` tables have a tenant policy that is true for every logged-in user.
- **C4** — `ecommerce_orders` has an `anon SELECT` policy of `USING (true)`.
- **C5** — `decrypt_pii`, `get_security_logs_decrypted` and friends are callable by `anon`.

And on the functions side, deploying `config.toml` as-is republishes **C1** (`quooro-chat`
taking `user_id` from the request body under the service-role key) and **C2**
(`execute-workflow` running arbitrary JavaScript).

Also note: **do not reuse the old project's secrets on the new one.** C2 means the old
`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `LOVABLE_API_KEY` and
`FIRECRAWL_API_KEY` should be treated as already leaked. Rotate them at the source
(Stripe, Resend, etc.) and set the new values on the new project.

---

## Final switch-over

1. `mv .env.new-project .env`
2. `npm run build` and check the app signs in against the new project
3. Update the Google OAuth redirect URIs to the new project URL
4. Point Stripe webhooks at the new project's function URLs
