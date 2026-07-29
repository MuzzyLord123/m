# BACKEND-FREEZE.md

Everything listed here is **frozen** for the design overhaul. No path below may
appear in `git diff main --stat` when the branch is reviewed.

The backend was migrated off Lovable and hardened immediately before this
project, and is verified working end to end. The redesign is presentation only.

## Frozen directories

| Path | Why |
| --- | --- |
| `supabase/functions/**` | All 41 deployed edge functions |
| `supabase/migrations/**` | Schema, RLS policies, encryption functions |
| `supabase/config.toml` | Function JWT config, project ref |
| `supabase/schema-parts/**`, `supabase/consolidated-schema.sql` | Schema snapshots |
| `src/integrations/supabase/**` | Generated client and types |

## Frozen files

| Path | Why |
| --- | --- |
| `.env`, `.env.*` | Project ref, anon key, build-time config |
| `vercel.json`, `vite.config.ts`, `vite.preview.config.ts` | Build and deploy |
| `package.json` scripts block | Build pipeline |
| `src/contexts/AuthContext.tsx` | Session handling, `signInWithPassword` |
| `src/components/auth/**` | Login/OAuth surface **logic** — see exception below |
| `src/hooks/use*Supabase*.ts`, data-fetching hooks | Query shapes |

## Frozen behaviour (may be restyled, never rewired)

- **Every `supabase.functions.invoke(...)` call** — name, payload keys, order.
- **Every `.from('table').insert/update/select(...)`** — table names, column
  names, filter columns.
- **Form field `name` attributes** and the object keys submitted from
  `GetStarted.tsx` (the enquiry form → `enquiries` table) and every other form.
- **All 133 routes** in `src/App.tsx` stay reachable at their current paths.
- `src/components/Globe3D.tsx` may be **restyled** (colours, materials, markers,
  size) but not removed, replaced with an image, or stopped from spinning.

## Recorded exception — 2026-07-29

`UnifiedSignIn.tsx` was restyled at the owner's explicit request ("make the
login portal more professional"). Presentation only: page shell, classNames,
copy, and off-system colours. Every handler, validation function, supabase
call, field id/name/autoComplete and state flow is byte-identical — verified
by diffing all logic-bearing lines before and after (47 lines, zero
differences). The verification snapshots are the `auth-logic-before/after`
pair produced during the change.

## Rule for mixed files

Several page components contain both data access and presentation. In those
files, change **only** JSX/className/copy lines. Leave every `useQuery`,
`useEffect`, `supabase.*`, and handler body byte-identical. After editing a mixed
file, re-read the data lines and confirm they are unchanged.

## Verification before ship

**Diff against the branch point, not `main`.** `main` predates the Lovable-to-
Supabase migration, so `git diff main` includes all of that backend work and
looks like a catastrophic freeze breach when nothing is actually wrong. The
redesign branched from `0f6742e`.

```bash
git diff 0f6742e..HEAD --name-only -- \
  supabase/ src/integrations/ .env vite.config.ts \
  src/contexts/AuthContext.tsx src/components/auth/
# must output nothing
```

Verified empty at the end of Phase 2.

## Recorded addition — 2026-07-29

`/pricing` route added to `src/App.tsx` (additive only — no existing route
renamed or removed). `Pricing.tsx` was imported but never routed; the admin
visual editor already linked to `/pricing`, which 404'd. No payloads, forms,
or backend surfaces touched.

## Recorded exception addendum — 2026-07-29 (2)

Second presentation-only pass on the auth surfaces at the owner's explicit
request ("make sign-in and sign-up enterprise level… all on one page, no
scroll"): UnifiedSignIn.tsx and CustomerLogin.tsx restyled (field surfaces,
labels, account-type selector, layout compression), plus
PasswordStrengthIndicator.tsx compacted to a single line. Verified by
sorted-diff of all logic-bearing lines against HEAD: the only differences
are className strings and one removed marketing microcopy paragraph. All
handlers, ids, values, validation, autoComplete and supabase calls are
byte-identical.

## Recorded exception addendum — 2026-07-29 (3)

GetStarted.tsx enquiry wizard rebuilt as a dual-panel experience at the
owner's explicit request ("enterprise level… dual page look… fits on the
entire page, no scroll"). Presentation only: new EnquiryBrandPanel
(marketing component) on the left, compressed elite field layout on the
right. Verified by sorted-diff of every logic-bearing line (supabase
insert, handlers, validation, autosave, field names/values) against HEAD:
zero non-className differences.

## Recorded exception — 2026-07-29 (4) — BACKEND CHANGE, owner-mandated

The owner's instruction "ensure account creation for customers works 100%"
required a genuine backend fix — the frozen state was broken, not working:

1. **Signup provisioning could never run.** With email confirmation on,
   `signUp()` returns no session, so every post-signup write in
   `CustomerLogin.tsx` (profile enrichment, customer ID, team creation,
   membership, verification token) was silently rejected by RLS as anon.
   Zero teams and zero memberships existed in production.
2. **Team-code validation was impossible.** `client_teams` has no anon
   SELECT policy, so the signup page's direct select always failed.
3. **`team_memberships_member_role_check` rejected `'member'`** — the
   column's own default and the value used by both signup and the lounge's
   "View Only" role selector.

Changes (applied as Supabase migrations `signup_server_side_provisioning`
and `allow_member_role_in_team_memberships`):

- `handle_new_user()` extended: provisions profile (company/phone/industry
  from signup metadata), customer ID, client team + owner membership for
  primary accounts, member membership for team-code signups. Team
  provisioning is exception-guarded so it can never block account creation.
- New `lookup_team_by_code(p_code)` SECURITY DEFINER fn (anon +
  authenticated) returning only `(id, team_name)` for exact code match.
- Check constraint widened to `owner|financial|project|member`.
- `CustomerLogin.tsx`: team lookups now use the RPC, signup metadata
  carries the profile fields, and the dead client-side provisioning block
  was removed (it would double-create teams now that the trigger works).
- `src/integrations/supabase/types.ts`: `lookup_team_by_code` added to
  the `Functions` typings (matches the live schema).

Verified by SQL simulation of both signup paths (primary → team + owner
membership + customer ID; team_member → joins team as `member`), anon RPC
execution, and cleanup. Both flows now provision correctly server-side.
