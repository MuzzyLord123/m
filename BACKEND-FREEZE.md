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
