# GREETINGS.md
## The greeting matrix — deterministic, data-honest, no runtime AI

Both home screens compose their greeting client-side from data the page
already fetches. No new endpoints. Every line below only fires when the
data that justifies it is actually present. Variants rotate by
`(day-of-year + variantCount) % variantCount` so repeat visits vary
without randomness at render time.

Salutation bands (local device time):
- 05:00–11:59 → "Good morning"
- 12:00–17:59 → "Good afternoon"
- 18:00–04:59 → "Good evening"

Name: `profiles.full_name` first token; if absent, the salutation stands
alone ("Good evening." is complete). Never "there", never "user".

---

## Client Portal (Lounge home)

Salutation line: `{salutation}, {firstName}.`

Contextual line — first matching state wins:

| Priority | State (existing data) | Variants |
|---|---|---|
| 1 | `client_billing.payment_status === 'overdue'` | "An invoice is overdue. Billing has the details." / "There's an overdue invoice waiting in Billing." |
| 2 | Items awaiting client action (content_requests status `awaiting_feedback`, approvals) | "{n} thing(s) need your eye today." / "We're waiting on you for {n} item(s)." / "Your review unblocks {n} piece(s) of work." |
| 3 | `website_status` changed to `review` | "Your build moved to review today." / "The site is in review — take a look when you're ready." |
| 4 | `website_status === 'development'` with recent activity | "Your build moved forward today." / "Progress on your build since your last visit." |
| 5 | Content delivered in last 7 days | "{n} piece(s) delivered this week." / "New work landed in your library this week." |
| 6 | `website_status === 'live'`, nothing pending | "Your site is live and healthy." / "All quiet — your site is live." |
| 7 | Quiet (nothing above) | "Nothing needs you right now — we're on it." / "All quiet. We'll flag anything that needs you." |

Rules: exactly one contextual line; counts are exact
(never "a few"); UK English; sentence case; no exclamation marks; no
emoji; claims must trace to a fetched field.

## Quooro Office (team home)

Briefing form: `{salutation}, {firstName}. {Briefing}.`

Briefing assembles up to TWO clauses, comma-joined, from live queue counts
the dashboard already fetches, in priority order:

| Priority | State | Clause |
|---|---|---|
| 1 | pending approvals > 0 | "{n} approval(s) waiting" |
| 2 | open tickets marked urgent | "{n} urgent ticket(s)" |
| 3 | projects due within 7 days | "{n} project(s) due this week" |
| 4 | new enquiries since yesterday | "{n} new enquir(y/ies) overnight" |
| 5 | unread client messages | "{n} unread client message(s)" |
| — | all zero | "the board is clear" |

Examples: "Good morning, Dan. 3 approvals waiting, 2 projects due this
week." · "Good afternoon, Carys. The board is clear."

No em-dashes anywhere in shipped strings; sentences, commas and colons
carry the rhythm instead.

## Implementation notes (Phase 3)

- One pure function per face: `composePortalGreeting(data)` /
  `composeOfficeBriefing(data)` in `src/lib/greetings.ts`, unit-testable,
  taking exactly the fields the page already holds in state.
- The salutation renders instantly (no data needed); the contextual line
  renders with the data it depends on — no layout shift (reserved line
  height).
- Pluralisation handled explicitly ("1 thing needs" / "2 things need").
- The existing admin-authored `greeting_messages` modal remains a separate,
  unchanged feature (it is a message from the studio, not the greeting
  layer); its presentation is restyled in Phase 3 with the same voice.
