# Phase 1 — Strategy & three art directions

## Design Read

> Reading this as: **agency landing + portfolio for UK founders and marketing
> leads commissioning a premium build**, with a **confident editorial** language,
> leaning toward native Tailwind + one characterful display face + a single
> restrained accent and choreographed scroll motion.

## Dials

Brief specifies the Agency/creative preset: **VARIANCE 9 / MOTION 8 / DENSITY 3.**
Adopted, with one engineering caveat.

The existing site reads roughly VARIANCE 4 / MOTION 6 / DENSITY 5. Jumping to 9
is correct for the hero routes and wrong as a blanket rule across **133 routes** —
variance-9 layouts (masonry, fractional grids, 20vw empty zones) are bespoke per
page and do not survive contact with a long tail of package and preview pages.

Proposal: **VARIANCE 9 on the ~12 flagship routes** (home, packages, portfolio,
work entries, about, contact), **VARIANCE 6–7 on the long tail**, sharing one
token system. The tail then still reads as the same studio without needing 121
hand-composed layouts.

## Provisional personas — CORRECT THESE

No user research exists. These are inferred from the packages the site sells and
are labelled provisional. They shape messaging only.

**1. "Owner-operator"** — runs a trade or local service (electrician, dental
practice, café). Buys Starter or Business. Judges on: will this look better than
my competitor's, will I be able to change it, will someone answer the phone.
Currently under-served by the copy, which talks about "digital operations".

**2. "Growth lead"** — marketing manager at a 10–50 person firm. Buys Growth or
Professional plus a management plan. Judges on: can they show me real work, do
they understand SEO and conversion, what happens after launch.

**3. "Operations owner"** — the customer for the platform (CRM, invoicing,
Office, vault), not just a site. Buys Elite. Judges on: is my data safe, can I
get it out, is this a real product or a side project.

Persona 3 is the one the current site actually addresses, and it is the smallest
of the three. Worth a conversation.

---

## The serif conflict — a decision you should make knowingly

Brief §3A lists **Fraunces** and **Instrument Serif** among the approved display
faces. The `design-taste-frontend` skill bans both by name as *"the two
LLM-favourite display serifs"* — precisely the tell we are trying to remove.

Both are true. Instrument Serif is already on your site, carrying the hero's
second line, and it is the one genuinely good typographic decision there.

I have therefore built the three directions so that **you are not forced to
choose blind**: A avoids serif display entirely, B uses a grotesque, and C uses a
serif that is *not* on the LLM-default list. If you love the current Instrument
Serif italic, say so and I will use it in C — it is your brief and your call.

---

## Direction A — "Ordnance"

**Attitude.** Light, technical, precise. The studio as surveyor rather than
showman. Paper-white field, near-black ink, one signal colour used like a
surveyor's mark. Confidence expressed through restraint and accuracy: hairline
rules, oversized section numerals, exact alignment. This is the direction most
different from every other agency site in the UK, because almost all of them are
dark.

**Type.** Cabinet Grotesk (display, Fontshare) + Supreme (text, Fontshare) +
JetBrains Mono for micro-labels and figures. No serif.

**Palette.**
```
--paper  #F4F3EF   warm off-white
--ink    #14161A   cool near-black
--accent #C2410C   burnt orange, survey-mark
--muted  ink @ 62%
--line   ink @ 12%
```

**Layout.** 12-col with deliberate 20vw voids. Editorial rows that alternate
weight rather than sides. Oversized numerals (01–05) set in the margin. One
full-bleed moment per page.

**Motion.** Sparse and mechanical. Reveals translate 16px with no fade-scale.
Rules draw themselves left-to-right. Hover states invert rather than glow.

**The globe.** Radical reinterpretation: a **line-drawn wireframe globe in ink on
paper** — no texture map, no glow, no atmosphere shells. Latitude/longitude as
hairlines, continents as thin strokes, and a **single burnt-orange marker on
Wales**. It stops being a SaaS "global reach" trope and becomes a technical
drawing. Same geometry, same rotation, entirely new material.

---

## Direction B — "Night Shift"

**Attitude.** Dark, cinematic, quiet. The work glows; the interface does not.
Explicitly *not* navy — a true neutral near-black with a raised surface for
depth, and a warm ember accent that has nothing to do with the blue/purple LLM
palette. Reads expensive because it is restrained, not because it is shiny.

**Type.** Clash Display (display, Fontshare) + Satoshi (text, Fontshare) +
JetBrains Mono for metadata.

**Palette.**
```
--base     #0B0B0C   true near-black, no blue cast
--raised   #131316   elevated surface
--paper    #EDEDEA   text on dark
--accent   #E8613C   ember
--muted    paper @ 58%
--line     paper @ 10%
```

**Layout.** Asymmetric split hero with the globe as the living centrepiece.
Full-bleed work plates. Sticky section labels in the left margin. Content sits
well off-centre.

**Motion.** The highest-motion direction. Hero choreography under 700ms.
Scroll-linked globe rotation. Magnetic primary CTA. Work plates scale 1.03 inside
overflow-hidden on hover.

**The globe.** Promoted from a mid-page section into **the hero**. Dark globe,
land masses in near-black relief, a single **ember terminator line** where light
meets dark, and one marker on Wales. Draggable — it responds to the cursor and
resumes its idle spin. The atmosphere shells go from `#4a9eff` blue to a single
tight ember rim.

---

## Direction C — "Press"

**Attitude.** Editorial print brought to the screen. Enormous type doing the
heavy lifting, generous leading, real hairline rules, a strict two-column measure
for long copy. Feels like a well-set magazine feature rather than a landing page.
The most *content-forward* of the three, and the best fit if the portfolio is
going to carry real writing about the work.

**Type.** Zodiak (display, Fontshare — a contemporary serif that is **not** on
the LLM-default list) + General Sans (text, Fontshare) + JetBrains Mono.
If you want to keep Instrument Serif, this is the direction it slots into.

**Palette.**
```
--paper  #FBFAF7   bright press stock
--ink    #101010   true printing black
--accent #1D4ED8   ink blue, used only on rules and marks
--muted  ink @ 60%
--line   ink @ 14%
```

**Layout.** Strong baseline grid. Drop caps on long-form. Pull quotes set large
in the margin. Images sit as plates with captions below, never overlaid. Section
breaks are rules, not padding.

**Motion.** The most restrained: MOTION effectively 5–6. Type sets in with a
short mask-reveal; everything else is still. Motion here would fight the print
metaphor.

**The globe.** Treated as a **printed plate** — monochrome, halftone-dotted,
sitting in a column with a caption beneath it like a figure in an article.
Still spinning, but reading as ink on paper rather than as a screen object.

---

## Recommendation

**Direction B, "Night Shift"** — with one borrowed idea from A.

Reasoning, not preference: the site sells both a design service *and* a
platform, and the platform screenshots are the strongest real assets available.
Dark backgrounds make screenshots sing; light backgrounds make them look washed
out and require frames and shadows to sit properly. B also gives the globe a real
job as the hero centrepiece, which is the single biggest visual differentiator
available and currently wasted mid-page.

The idea worth stealing from A: **the single marker on Wales**. A rotating globe
implying "global reach" is a cliché for a Wales studio. One marker, on Wales,
inverts it into a statement of specificity — and specificity of place is exactly
what the brief identifies as the differentiator against faceless global teams.

Direction A is the braver choice and would stand out more. It is also harder to
make the platform screenshots work in.

---

## Questions blocking Phase 2

1. **Which direction** — A, B, or C?
2. **The fabricated social proof.** `SocialProofRotator` renders twice on
   `/packages` with invented purchase notifications; `SocialProofToast` holds a
   second invented list. Recommend deleting both. Confirm?
3. **Real work.** Are the ~14 site screenshots behind the hero real Quooro
   builds, and are the six `/portfolio/*` entries real clients? If not, they
   become `[PLACEHOLDER]` and the portfolio is reframed as a capability showcase.
4. **Icons.** The repo uses `lucide-react` throughout. Brief prefers Phosphor.
   Swapping across 133 routes is a very large diff for a modest gain — I suggest
   keeping Lucide with a standardised stroke width. Object if you disagree.
5. **Scope.** Confirm the flagship-first sequencing: ~12 routes to full rigor,
   then the tail on the shared system.
