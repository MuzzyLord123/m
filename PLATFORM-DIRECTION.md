# PLATFORM-DIRECTION.md
## Phase 1 — system direction for the Quooro platform overhaul

Design read: authenticated SaaS product surfaces (Client Portal + Quooro
Office) for existing clients and the operating team, in a
Linear/Stripe-dashboard precision language, inheriting the website's Night
Shift token system unchanged and extending it with an app-semantic layer.
Presentation only; every request stays byte-identical (see
DATA-CONTRACTS.md).

Dials
- Client Portal: VARIANCE 6 · MOTION 3 · DENSITY 5
- Quooro Office: VARIANCE 5 · MOTION 3 · DENSITY 7

---

## 1. Provisional personas

**The client (Portal).** Runs a small Welsh business; commissioned a site or
app; checks in on a phone at odd hours, on a laptop during work. Not
technical. Wants to know three things in ten seconds: where is my project,
does anything need me, is anything wrong with money. Trust is won by calm,
named address and honest status, and lost by dashboard noise, jargon and
emoji.

**The operator (Office).** Quooro team member living in the CRM all day.
Keyboard-first, many records, repeated actions. Wants density, speed,
predictable tables, visible system state. Trust is won by never losing
work, never guessing state, never waiting for chrome.

Both provisional; replace with research when real feedback exists.

## 2. Two temperaments, one system

| | Client Portal | Quooro Office |
|---|---|---|
| Feel | Concierge. The only client. | Instrument. Operators at speed. |
| Greeting | "Good evening, Carys." + one contextual line | Briefing: "Good morning, Dan. 3 approvals waiting." |
| Density | 5 — air where decisions happen | 7 — 40px table rows, tight ledgers |
| Display face | Bricolage at the greeting and empty states only | Almost never; Geist + mono carry everything |
| Chrome | Sidebar quiet, generous gutters | Sidebar compact, panels edge-to-edge |
| Motion | 120–200ms micro only | Same, minus any entrance motion |

Identical across both: tokens, components, type scale, voice rules, focus
treatment, semantic colours, keyboard model (⌘K palette, `?` overlay).

## 3. Token extension — the app-semantic layer

The website tokens are inherited untouched (`--background`, `--foreground`,
`--card`, `--primary` ember, `--gold` brass, `--border`, sidebar set,
`--ease-out`). The platform adds ONE layer, defined once in
`src/index.css` under a `/* App-semantic layer */` block, both modes:

```css
/* Surfaces */
--surface:         var(--background);        /* page wash            */
--surface-raised:  var(--card);              /* panels, drawers      */
--surface-sunken:  (light: 45 14% 92%; dark: 240 5% 4%)  /* wells, table heads */
--surface-overlay: var(--popover);           /* menus, palette       */

/* Text tiers */
--text-primary:    var(--foreground);
--text-secondary:  (light: 220 8% 30%;  dark: 60 5% 72%)
--text-tertiary:   var(--muted-foreground);
--text-disabled:   (light: 220 6% 60%;  dark: 240 4% 38%)

/* Lines */
--line:            var(--border) at /60      /* hairline default     */
--line-strong:     var(--border)             /* section boundaries   */
--line-focus:      var(--ring)

/* Muted enterprise semantics — dot+label badges, never fills.
   Desaturated from the site's status set; each ships a bg tint and a
   text tone that pass AA on both modes. */
--ok:       (light: 142 45% 30%; dark: 142 40% 62%)   /* delivered, live, paid   */
--attend:   (light: 34 70% 32%;  dark: 38 60% 60%)    /* awaiting client, review */
--risk:     (light: 0 55% 38%;   dark: 0 65% 68%)     /* overdue, failed         */
--neutral:  = --text-tertiary                          /* draft, queued          */
```

Rules: the ember accent is reserved for the one primary action per view,
focus, selection, and the live position on any rail. Semantic colours never
exceed one dot + one word. No raw hex in components — the STATUS_MAP-style
hex objects in the current code all resolve to these tokens in Phase 2/3.

## 4. Type at UI scale

- Body 14px / 1.45 (tables 13px), meta 12px, mono micro-labels 10px
  uppercase `tracking-[0.14em]` (the site's `.mono-label`, rationed: group
  headers and column heads, not every element).
- `tabular-nums` on every numeric; JetBrains Mono for IDs (`QUO-A4022`),
  team codes, timestamps, money in tables.
- Bricolage display only at: greeting, auth, empty states, big zero
  moments. One display moment per screen, maximum.

## 5. Chrome and surfaces

1px hairlines over shadows; elevation = surface tone steps
(sunken → surface → raised → overlay) plus `--shadow-card` only on true
overlays. Radius: `--radius` (10px) for controls and panels, `rounded-xl`
cap for floating overlays; no `rounded-2xl`+shadow stacks. Spacing on a
4px base: Portal sections breathe at 24/32, Office at 12/16.

## 6. Motion

120–200ms, `--ease-out`, opacity/transform only. Hover/press/focus/open
states; drawer and palette ≤ 250ms; skeleton→content crossfade 150ms. Data
renders instantly — zero entrance animation on content, zero scroll
choreography. The existing `page-enter` blur-rise is retired inside the
platform. `prefers-reduced-motion` collapses everything to instant.

## 7. The greeting layer (engineering, not sprinkling)

Deterministic, composed client-side from data each home screen already
fetches — no new endpoints, no runtime AI. Full matrix in GREETINGS.md.

Portal inputs (all already in LoungeOverview's existing requests):
`profiles.full_name/website_status/preview_url`, pending content count,
awaiting-action items, `client_billing.payment_status`, announcements.
Office inputs: the admin dashboard's existing queue counts (approvals,
tickets, due projects).

Form: time-band salutation + first name, then ONE contextual line chosen
by priority order (overdue money → awaiting your action → project moved →
recently delivered → quiet), several rotating variants per cell, claims
only what the fetched data supports.

## 8. What stays

Routes, guards, LoungeLayout's structure (PortalSidebar, MobileBottomNav,
GlobalSearch, banners), every data hook. GlobalSearch grows into the ⌘K
palette (client-side navigation + existing actions only). The orbital
LineDraw motif appears at login, empty states and loading moments only.

## 9. Login concept

The dual-panel auth screens shipped in the site phase already meet the
front-door bar (brand panel + elite field recipe, one-viewport). Phase 3
brings them onto the app-semantic tokens and the platform focus/error
patterns; no structural change, no field changes.
