# Agent platform access — what an agent can do, and what it structurally cannot

An agent in the Quooro office can be told to do anything with the
platform's *data*. It can never touch the platform's *structure*. That
line is enforced in SQL, not in a prompt — a model talked into something
by injected text still meets code that does not negotiate.

## The two moving parts

- **`platform_op_policy`** (207 rows) — the allowlist. One row per
  reachable table: `can_read`, `can_insert`, `can_update`, `can_delete`,
  `denied_columns`, `max_rows`. Adding or removing agent reach is a row
  edit, never a deploy.
- **`platform_op(...)`** — the only executor. Structured parameters
  only: table, op, payload, match. **It accepts no SQL text**, so there
  is no passthrough to abuse.

Reached by agents through `mesh-worker`'s tool loop (`<op>{...}</op>`
blocks in a reply, max 6 per task), or directly via the `platform-ops`
edge function (`action: op | schema | escalate | log`).

## What is refused, always

| Attempt | Result |
|---|---|
| `create` / `drop` / `alter` / `truncate` / raw `sql` | refused, `final: true` — before anything else is considered |
| Any table not in the policy | refused — 31 tables are unlisted and unreachable |
| Secrets, API keys, vaults, 2FA, owners, roles, RBAC, audit logs, bridges, profiles | unlisted → invisible |
| `update` with no `match` filter | refused — blind table-wide writes |
| `update` touching more rows than `max_rows` | refused with the real count |
| Editing `id` / `created_at` | refused — identity is not editable |
| Columns named like credentials (`password_hash`, `token_hash`, `secret`, `api_key`, `access_token`, `refresh_token`) | stripped from reads and writes on every table |
| `delete` | refused with `escalate: "bridge"` — deletion needs the owner-authorised seat |

Everything is written to **`platform_op_log`** with actor, task, table,
op, match, rows affected, outcome and the agent's stated reason.

## Why DDL is impossible rather than merely forbidden

`platform_op` has no code path that emits anything but SELECT / INSERT /
UPDATE / DELETE. Table names come from the policy table via `%I`, never
from the caller; filter and payload keys are checked against
`information_schema` before use; values ride `%L`. Execute privilege is
granted to `service_role` only — never `anon`, never `authenticated`.

## Verified live (2026-08-08)

17 executor tests plus 2 end-to-end loop runs against production:
DDL refusal (drop/create), unlisted-table refusal (secrets, owners,
roles), read, insert, update, unfiltered-update refusal, empty-filter
refusal, identity-edit refusal, delete escalation, row-cap refusal
(7,308 rows vs a 200 cap), and four injection attempts — malicious table
name, filter key, filter value and payload key. `crm_deals` still
existed afterwards; the company count was unchanged at 7,307.

**Reflection guard.** The loop test found a real weakness: a model that
echoes its prompt back returns the briefing's own worked examples, and
those were being parsed as instructions. `mesh-worker` v4 now treats a
reply still carrying the briefing header as a reflection — zero ops run,
and the task fails honestly rather than storing documentation as an
answer. Re-tested: 0 ops, data untouched.
