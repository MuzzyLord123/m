# MOTION-AUDIT.md — Phase 0

Baseline recorded 2026-07-29 on the `motion-pass` branch (from `design-overhaul`
@ `7114a86`), before any motion work.

## Method

Lighthouse is not runnable in this container, so the baseline is collected with
Playwright + CDP under fixed, reproducible conditions: 1440×900, dark theme,
cookie banner pre-dismissed, **4× CPU throttle** via
`Emulation.setCPUThrottlingRate`. Metrics per route: FCP and LCP
(`PerformanceObserver`, buffered), CLS (layout-shift observer), and scroll FPS
(rAF count while stepping through 6000px of scroll over 2s). The same script
must be re-run for the Phase 5 comparison: `scratchpad/perf-baseline.mjs`.
Numbers may not get worse.

## Baseline — production build (`vite preview`)

| route | FCP (ms) | LCP (ms) | CLS | scroll FPS @4× |
| --- | ---: | ---: | ---: | ---: |
| `/` | 1400 | 1400 | 0.0094 | **4.0** |
| `/packages` | 496 | 1664 | 0.0022 | 54.2 |
| `/features` | 572 | 1072 | 0.0022 | 56.7 |
| `/portfolio` | 516 | 920 | 0.0022 | 59.5 |
| `/get-started` | 516 | 992 | 0.0022 | 59.0 |
| `/quooro-office` | 480 | 940 | 0.0022 | 59.8 |
| `/support` | 480 | 964 | 0.0022 | 58.8 |

Dev-server numbers were also recorded and are uniformly worse (homepage FCP
3020ms); the production table above is the binding baseline.

## Inventory

- **framer-motion in 305 files** — 1348 `<motion.*>` elements, 264
  `whileInView`, 812 `animate={}`, 77 `whileHover`. Framer Motion is
  unambiguously the incumbent engine.
- Scroll-linked (`useScroll`): 9 files — Navbar, ProcessSection spine,
  ParallaxImage, StickyScrollReveal, MobileStickyCTA, PackagesStickyNav,
  ChatBot, Pricing hero, useScrollAnimation hook.
- 15 `@keyframes` (incl. a duplicate marquee pair: `marquee` and
  `marquee-scroll`), 120 `animate-pulse`, 298 `animate-spin` (app-side
  loaders — out of scope), 708 `transition-all`.
- **12 rogue cubic-beziers** outside the system tokens; the worst offender
  (`0.25,0.46,0.45,0.94`) appears 14 times, mostly legacy pre-overhaul files.
- The design-overhaul motion layer (`lib/motion.ts` + `components/motion/*`)
  already implements Rise, Cascade, Line Reveal, Pin Scene, and Marquee with
  exactly the brief's two easing curves. This pass extends it; it does not
  start over.

## Findings

### F1 — the globe renders every frame, even off-screen (CRITICAL)

Homepage scroll under 4× throttle is **4.1fps**. A/B with the globe canvas
hidden: **55.6fps**. The `three.js` frame loop runs continuously
(`frameloop="always"` default); the existing viewport pause only freezes the
rotation value, not the renderer, so the GPU/CPU pipeline runs at full rate
while the user is three screens below the hero. Fix in Phase 2: drive the R3F
`frameloop` from the existing `useInViewport` signal (`always` in view,
`never` out). The globe keeps spinning whenever it is visible — the constraint
protects the spin, not the wasted frames. This single fix is expected to
recover the homepage to ~55fps.

### F2 — ProcessSection spine animates `height` (banned property)

The scroll-scrubbed spine fill animates CSS `height` through a spring on every
scroll frame — a layout property, explicitly banned by the vocabulary. Not the
homepage jank driver (A/B confirmed), but wrong. Fix: `scaleY` with
`transform-origin: top`, same visual, compositor-only.

### F3 — PageTransition animates `filter: blur` on every route change

Full-page blur is paint-heavy and uses a rogue ease. Fix: opacity/transform
only, system tokens.

### F4 — Marquee lacks pause-on-hover

The vocabulary requires it. The track is CSS-driven, so it is one
`animation-play-state` rule.

### F5 — token drift

12 non-system easings and the duplicate marquee keyframe. Consolidate in
passing wherever a file is already being edited; grep gate in Phase 5.

### F6 — `transition-all` ×708

Transitions arbitrary properties (including layout ones) wherever state
changes. Not a scroll-jank driver; tighten opportunistically, do not
mass-rewrite.

## Constraint reality checks

- **No-JS content:** the site is a client-rendered SPA (Vite + React, no SSR).
  Without JavaScript there is no DOM at all, on any route — the constraint as
  written assumes server-rendered HTML. What IS enforceable, and will be: no
  in-app flash-of-hidden-content (initial states are applied at mount, never
  via static CSS `opacity: 0`), and reduced-motion as a first-class path.
- **Cursor effects:** `CustomCursor` is a single dot, opt-in behind a user
  preference, default off. It is not a cursor trail; compliant, left alone.
- **Globe position:** the globe sits in the hero's right column inside a
  plain `aspect-square` wrapper div (`HomeHero.tsx`) with its space reserved
  (homepage CLS 0.0094, within budget). That wrapper is the legal target for
  the Scrub Scene; the component internals stay untouched apart from F1.
- **Tick:** marketing stats are mostly non-numeric ("UK", "Free", "100%");
  Tick applies to nothing on the homepage except possibly "25+". No fabricated
  numbers exist to tick — the honesty pass already removed them.

## Skills note

`modern-web-guidance`, `impeccable`, and the `design:*` family named in the
brief are not installed in this environment. Substitutions: compositor-property
and reduced-motion guidance is encoded directly in this document and MOTION.md
(transform/opacity only, `will-change` scoped to active animation, IO-based
triggers); taste gates run against `design-taste-frontend`'s ruleset, which was
loaded during the overhaul. Native CSS scroll-driven animations
(`animation-timeline`) remain Chromium-only without a Firefox/Safari story as
of this audit, which settles the engine question in favour of the incumbent JS
engine (see MOTION.md §Engine).
