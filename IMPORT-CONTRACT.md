# IMPORT-CONTRACT.md
## The golden feature, measured — 2026-07-30 · branch crm-overhaul

The LIVE import engine is `src/pages/lounge/crm/CRMLeadImportDialog.tsx`
(reached via the Contacts toolbar → Data → "Import leads"). The richer
admin engine (`src/components/admin/LeadImportDialog.tsx`, the only one
writing `lead_imports` audit rows) is currently UNREACHABLE — the team
dashboard's leads tab redirects to /lounge/crm. Both are PROTECTED.

## Engine behaviour (from code + capture)

- Parsers: CSV (quote-aware, header automap → mapping step), Excel
  (.xlsx), JSON (alias keys incl. Google Maps exports), HTML tables
  (heuristic cell typing), manual.
- Validity: a row needs business_name OR personal_name OR phone OR email.
- Dedupe: signature set built once per run from existing
  `crm_contacts (email, phone, full_name)` org-scoped (limit 20000):
  `e:` lowercased email, `p:` whitespace-stripped phone, `n:` lowercased
  name (name = personal_name ?? contact_name ?? business_name). Matches
  BOTH the existing book and earlier rows in the same file. Zero
  duplicate inserts by construction.
- Writes: chunked `crm_contacts` inserts, 500 rows per request; extras
  folded into `notes`; `relationship_type: ['lead']`.
- Progress: processed/total and %, chunk-granular.

## Captured runs (constructed fixtures, scratchpad/import-fixtures/)

Real export samples were requested; until supplied, fixtures are built
from the live schema. Transport: stateful network mock at ~0 latency
(direct Supabase egress is unavailable in this environment), so
durations measure engine overhead, not network. Replay in Phase 6 uses
the identical mock + files, so every number below must reproduce
exactly.

| Run | Rows in file | Valid parsed | Imported | Duplicates | Insert POSTs | Duration |
|---|---|---|---|---|---|---|
| leads.csv (12 clean rows) | 12 | 12 | **12** | 0 | 1 | 211 ms |
| leads.csv again — dedupe proof | 12 | 12 | **0** | **12** | **0** | 221 ms |
| leads.json (10 objects, 2 invalid) | 10 | 8 | **8** | 0 | 1 | 161 ms |
| leads.html (10 rows, 1 too short) | 10 | 9 | **9** | 0 | 1 | 186 ms |
| messy.csv (whitespace/quotes/blank lines, 2 no-identifier rows) | 15 lines | 13 | **7** | **6** | 1 | 193 ms |
| bulk.csv (1,200 rows, 60 intra-file repeats) | 1,200 | 1,200 | **1,140** | **60** | 3 | 383 ms |

Book after sequence: 1,176 contacts. Zero page errors. One signature
SELECT per run.

The messy-file duplicates are fully explained: six cross-file
name-signature collisions with rows imported from earlier fixtures
(verified by hand against the generator); the engine treats a matching
name alone as a duplicate — this is its real, current behaviour and the
contract preserves it.

## Observed shell defects (rebuild targets, engine untouched)

1. **The receipt vanishes on success.** `onImportComplete()` refreshes
   the list, which re-renders the toolbar and unmounts the dialog — the
   Added/Duplicates/Errors screen survives only when nothing was added.
   Captured: resultScreenStillVisible=false on every successful run.
2. Excel path exists but has no fixture yet (needs a real .xlsx sample).
3. No import history surface (only the dormant admin engine logs to
   `lead_imports`).

## Replay protocol (Phase 6)

Same fixtures, same mock (`scratchpad/pw-crm-import.mjs`), same
sequence, fresh store. Pass = identical Imported/Duplicates/Insert-POST
counts on all six runs. Any drift is a stop-the-line bug.
