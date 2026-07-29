# MOTION.md — the motion system

One vocabulary, one engine, one budget. Every animated moment on the site is a
named move from §2, implemented once in `src/lib/motion.ts` +
`src/components/motion/*`, and every page pulls from that source. A timing
change is a one-line edit.

## 1. Engine

**Framer Motion, exclusively.** The brief's own rule decides this: "if the
redesign already installed an animation library, extend that one rather than
adding a second." The design overhaul built its motion layer on Framer Motion
and it now appears in 305 files; adding GSAP would mean two engines and two
timing sources on one site. Native CSS scroll-driven animations
(`animation-timeline: view()/scroll()`) remain Chromium-only, so scroll-linked
work uses Framer's `useScroll`/`useTransform` (already in use for the process
spine), and simple loops (marquee, grain) stay in plain CSS.

GSAP's licence question is therefore moot; Framer Motion is MIT.

## 2. Tokens

Already in `src/lib/motion.ts`; Phase 2 mirrors the two easings as CSS custom
properties for CSS-side animations.

| token | value | use |
| --- | --- | --- |
| `EASE_OUT` / `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | all entrances |
| `EASE_IN_OUT` / `--ease-smooth` | `cubic-bezier(0.65, 0, 0.35, 1)` | scrubbed / state |
| micro | 150–250ms | hover, focus |
| entrance | 550–700ms | Rise, Cascade items |
| feature | 700–1100ms | Line Reveal, Mask Reveal, Line Draw |
| stagger | 60ms (`STAGGER`) | cascade siblings, full run ≤ 900ms |
| travel | 14–22px standard; 32–48px hero only | |
| trigger | `VIEWPORT` = once, −12% margin | nothing replays on scroll-up |

## 3. Vocabulary — status against the existing system

| move | status | implementation |
| --- | --- | --- |
| **Rise** | ✅ exists | `<Reveal>` (clip-and-lift, 0.7s, EASE_OUT) |
| **Cascade** | ✅ exists | `<RevealGroup>/<RevealItem>` (60ms stagger) |
| **Line Reveal** | ✅ exists | `<SplitText>` (measured lines, masked rise) |
| **Mask Reveal** | 🆕 Phase 2 | `<MaskReveal>` — `clip-path` inset open + inner scale 1.15→1, 900–1100ms; imagery only |
| **Line Draw** | 🆕 Phase 2 | `<LineDraw>` — SVG `stroke-dashoffset`, 800–1200ms, once; the graphics motif's move |
| **Drift** | 🆕 Phase 2 | `<Drift>` — `useScroll`-scrubbed translateY, 2–6% of scroll delta; max 2/page |
| **Scrub Scene** | 🆕/partial | `<Scrub>` wrapper; process spine already scrubs (moves to `scaleY` per audit F2); globe **wrapper** scrub on home |
| **Pin Scene** | ✅ exists | `<StickySequence>` (home platform section); unpins to stacked Cascade below `lg` |
| **Tick** | ✅ exists, unused on marketing | `AnimatedCounter`; policy: real numerals only — nothing currently qualifies except "25+" |
| **Marquee** | ✅ exists | CSS ticker, 54s loop, `aria-hidden` duplicate; Phase 2 adds pause-on-hover |

Banned stays banned: no AOS/animate.css, no particles, no cursor trails, no
width/height/top/left animation (audit F2 is the one violation and is being
fixed), no scroll hijacking.

## 4. Budget (per page)

≤ 1 Pin · ≤ 2 Scrubs · ≤ 2 Drifts · everything else once-only entrances ·
~8–10 animated moments total · hero choreography ≤ 700ms and never delaying
LCP · conversion surfaces (forms) get a single Rise, nothing else. Every
moment must be nameable in one sentence (hierarchy, sequence, spatial
relationship, craft) or it does not ship.

Reduced motion: every move degrades to a fast opacity fade (existing
`reducedVariants`); scrubs and drifts render at their final state; the marquee
stops. Verified per route in Phase 5, not assumed.

## 5. Page-by-page map

**Home** — the showcase. Load: Line Reveal on the headline (already live),
Rise on subtitle/CTAs, ≤ 700ms total. Scrub 1: globe **wrapper** drifts and
scales gently through the hero scroll. Scrub 2: process spine (scaleY). Pin:
platform StickySequence (existing, stays the only pin). Cascade: practice
index rows, service matrix. Line Draw: orbital motif behind the reach
statement + section dividers. Drift: one background motif layer, hero only.
Marquee: capability ticker (existing). Footer: big-type Rise.

**Packages** — Cascade on package grids; Line Draw divider per category;
Scrub-linked section numeral; no pin.

**Features** — Cascade on the feature matrix; one Line Draw motif in the hero;
Tick nothing (no real numerals).

**Portfolio (Reference Builds)** — Mask Reveal on thumbnails + hover states;
one Drift on imagery; everything else static so the work reads.

**Pricing / Comparison** — Cascade rows; Rise on the tables; no scrubs (data
pages stay calm).

**Service pages** (SocialMedia, AdManagement, SEO, Content, Account) — shared
class: hero Line Reveal, Cascade on card matrices, one Line Draw accent,
nothing scrubbed.

**Preview-* pages** — same class as service pages, lighter: Rise + Cascade
only.

**Get Started / Support** — conversion zones: a single Rise on the form block.
Nothing else moves.

**Quooro Office** — hero Line Reveal + Cascade on the tool grid; one Line
Draw motif.

**Legal (Privacy/Terms/Cookies/Trust/SLA)** — one Rise on the title. Body
static.

**404** — one playful Line Draw orbit moment.

**Footer (site-wide)** — identical single Rise on the sign-off line, every
page.

## 6. Natural graphics layer

Lead motif: **orbital linework** — meridians, latitude arcs, orbital paths,
plotted coordinate points and route lines drawn as thin SVG strokes in the
ink/ember palette at low contrast, revealed with Line Draw. It extends the one
asset the site already owns (the globe) into a graphic language: every page
carries a trace of the hero without repeating it. Coordinate micro-labels
(`52.13° N, 3.78° W`) already exist in the system and become part of the motif.

Alternatives presented at Checkpoint 1: cartographic contours (Wales as a
place, not a sphere) and drafting-grid plotting (extends the existing hero
grid). Samples in `public/motif-samples/` rendered in the real palette, both
themes.

Toolkit rules: linework is hand-authored SVG in code; grain overlay stays
static at ≤ 4%; icons remain Lucide; no stock, no AI imagery, no mesh
gradients, no blobs.

## 7. Perf gates (from MOTION-AUDIT.md)

Production-build numbers may not regress: interior routes ≥ ~54fps scroll at
4× throttle, homepage recovers to ≥ 50fps once audit F1 (globe frameloop)
lands, CLS stays ≤ 0.01 per route, homepage LCP ≤ 1.4s. `transform`/`opacity`
only; `will-change` only while animating; every entrance IO-triggered, once.
