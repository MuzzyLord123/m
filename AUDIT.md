# AUDIT.md — Phase 0

Evidence gathered from the built production bundle, rendered in Chromium at
1440px and 390px, plus static analysis of `src/pages` and `src/components`.

## Stack (detected — unchanged)

React 18 + Vite + TypeScript, Tailwind + shadcn/Radix, framer-motion,
`@react-three/fiber` + `drei` for the globe, Supabase client. **133 routes.**

---

## 1. The finding that outranks every styling issue

**`SocialProofRotator` renders twice on the live `/packages` page, cycling
fabricated purchase notifications.**

```
"Manchester Pub — Business Site — 2 hours ago"
"London Electrician — Starter Site — 5 hours ago"
"Bristol Dental Practice — Growth Site — 1 day ago"
"Cardiff Fitness Studio — Booking System — 3 days ago"
```

`SocialProofToast.tsx` holds a second invented list ("A Cardiff law firm", "A
Leeds consultancy", …).

These customers do not exist. This is not a design preference — inventing
"someone just bought this" notifications is a false representation of a
transaction. It breaches Constraint 4 outright, and it is the single loudest
AI-slop signal on the site. **Recommend deletion, not redesign.** Flagged as a
decision for the owner rather than removed unilaterally.

## 2. Location: the site is already correct

`london` appears 20 times but **every instance is demo/seed data inside the
logged-in app** (invoice templates, expense rows) — none is a marketing claim.
The public site says Wales, and the footer and Terms both state *Quooro Ltd,
registered in England and Wales*. The brief's "based in Wales" is accurate and
under-used: it appears in the footer and legal pages only, never as positioning.

## 3. Banned visual patterns — counts across `src/pages` + `src/components`

| Pattern | Count | Verdict |
| --- | ---: | --- |
| `bg-gradient-to-*` | 313 | Gradient is the default surface treatment |
| purple/indigo/violet gradient stops | 121 | The exact banned LLM palette |
| `backdrop-blur` (glassmorphism) | 220 | Default card treatment |
| `rounded-2xl` / `rounded-3xl` | 563 | Uniform softness everywhere |
| `bg-clip-text` (gradient headings) | 7 | Banned outright |
| Emoji in UI source | **0** | Clean — nothing to fix |

## 4. Homepage hero — the centred-hero cliché, exactly as described

Rendered at 1440px, the hero is the banned pattern almost line for line:

- Giant centred `h1` ("Digital Operations")
- **One blue→purple gradient pill CTA** ("Request a Private Preview") beside
  **one ghost pill** ("Tour the Platform")
- **Gradient text** on the serif italic second line ("Ambitious Brands")
- Dark navy field (`--background: 222 47% 4%`) — the slate-900 house style
- A wall of ~14 website screenshots tiled behind the hero as wallpaper, at low
  contrast. Visually noisy, and their provenance needs confirming (see
  PLACEHOLDERS)
- A four-item trust strip of generic claims: *enterprise-grade security /
  UK-based team / built for scale / full ownership*

`--primary: 217 91% 60%` is Tailwind `blue-500`. The accent is the default.

## 5. Typography — three of four faces are banned

| Face | Role | Status |
| --- | --- | --- |
| Inter | UI/body | **Banned** (§2B) |
| Work Sans | body | **Banned** (§2B) |
| Sora | display | Generic geometric; replace |
| Instrument Serif | accent display | **Keep** — on the brief's approved list |
| JetBrains Mono | micro-labels | Allowed as the third voice |

Instrument Serif is already loaded and already carries the hero's second line.
That is the one genuinely good typographic decision on the site and the natural
seed for a direction.

## 6. The globe

`src/components/Globe3D.tsx` (323 lines) — textured Earth `Sphere`, rotating at
`rotation.y += 0.0015`, with location markers and animated connection arcs, plus
**three atmosphere shells in `#4a9eff` / `#6db3f8` / `#87ceeb`**.

It renders in a *"Global Reach"* section (`Index.tsx:372`) inside a two-column
grid — **not** in the hero. Around it: a `bg-gradient-radial from-primary/20 …
blur-3xl` glow orb (banned) and a `bg-black/50 backdrop-blur-sm rounded-full`
caption pill (banned).

Two observations for Phase 1:

1. Those blue atmosphere shells **are** the LLM-blue tell, in 3D. Re-materialing
   the globe to the new accent is one of the highest-leverage moves available.
2. A rotating globe with arcs is itself a SaaS cliché *when used to imply global
   reach*. A Wales studio's globe is far more interesting as a single marker on
   Wales — provincial specificity as confidence, not fake scale.

## 7. Page rhythm

Sections are stacked at near-uniform vertical padding with repeating
heading → subheading → grid structure, producing the metronome rhythm the brief
calls out. No full-bleed moments, no asymmetry, no editorial variation.

---

## Scope reality (raised at Checkpoint 1)

**133 routes.** "Every route rebuilt to homepage-level rigor" is a
multi-week engagement, not a single pass. Phase 3 must be sequenced by tier —
see the checkpoint note. Flagging now rather than discovering it at page 40.
