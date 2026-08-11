# A Edwards Decorating

The first website for Andy Edwards, painter and decorator, Flint, Flintshire.

- `REVIEWS.md` — how the reviews work and how to add one. **Read this first.**
- `LAUNCH.md` — everything between "the site is built" and "the site is earning".
- `CONTENT-NEEDED.md` — one phone call's worth of questions. Generated; don't
  edit it by hand.

```
npm install
npm run dev            # http://localhost:3000
npm run lint           # typecheck
npm run build          # also runs the contrast and review-rule checks
npm run check:content  # what's still outstanding; rewrites CONTENT-NEEDED.md
npm run check:launch   # the same, but fails if anything blocking is open
```

---

## What this site is

Andy has one enormous asset and almost nothing else: **34 ratings averaging 4.9,
thirty-two of them five stars, built up over a decade on Yell.** No photo
library worth building around, no brand, no logo, no domain, no email.

So this is not a portfolio and not a brochure. It is a proof machine. The
reviews are not a testimonial strip near the bottom — they are the content, the
structure and the design. Three of the eleven sections on the front page are a
single review and nothing else, and `/reviews` is an archive of them.

The test: **delete the reviews and nothing should be left standing.** If the
site still made sense without them, it would be the wrong site.

## How it looks, and why

He sells colour on walls and has no photography. So the site itself is the
demonstration: every section is a full-viewport field of one paint colour, and
the page repaints as you scroll. Type is enormous, flush left, and does all the
work.

- **Six colours**, in `content/fields.ts`. Each field carries either near-black
  or bone text, whichever clears 7:1.
- **Two typefaces.** Bricolage Grotesque 700–800 for display, DM Mono 13–15px
  for everything else — labels, dates, reviewer names, service lists, and the
  phone number. Numbers are always mono. That contrast *is* the brand: there is
  no logo, just the name set in Bricolage 800.
- **No cards, boxes, borders, shadows, gradients, rounded corners or icons.**
  Not one, anywhere. The colour fields are the whole visual system. Arrows are
  `→` in the mono face.
- **No navigation.** A mono strip fixed to the top: name left, phone right. The
  home page is a sequence you scroll, and the only thing anyone needs is the
  number, which is why it never leaves the screen.

### The eleven fields

| # | Colour | What's on it |
|---|---|---|
| 1 | deep green | Name, trade, the 4.9 with its source, the phone |
| 2 | stone | The argument in one sentence, then the service list |
| 3 | aubergine | Review — DarrenJ-427, exterior repaint |
| 4 | pale duck egg | Interior work |
| 5 | near black | Review — AndM-6, render and woodwork |
| 6 | stone | Exterior and commercial — and preparation |
| 7 | burnt red | Review — lightning. The human one, on the loudest field |
| 8 | deep green | What's on the record, and the link to the archive |
| 9 | pale duck egg | Where he works |
| 10 | stone | Photographs — **cut** until originals arrive |
| 11 | near black | Call Andy. The phone at the largest size on the site |

Field 10 renders itself the moment `content/photos.ts` has anything in it, and
is absent until then. The site is designed to stand up with no photography at
all.

## The motion

The repaint *is* the motion. Almost nothing else moves.

`src/components/Repaint.tsx` measures every `[data-field]` element, builds a
scroll ramp from their real positions, and writes `--bg` straight onto `:root`
from a motion-value subscription — no React state per frame, no re-render per
frame. Fields don't paint their own backgrounds; the page has one colour at a
time and it changes underneath you, so a section can never get out of step with
the page it's on.

Two decisions in there are worth knowing about, because both were found by
measuring rather than by reasoning:

**The foreground is derived from the background, not interpolated alongside
it.** Every transition in this palette goes from light-on-dark to dark-on-light.
Crossfading both sends the text and the page through the same mid-tone at the
same moment and the words disappear completely — measured at **1.01:1** halfway
through every single transition. Deriving the foreground from the live
background instead means the text flips at the crossover to whichever of the two
foregrounds is legible on the colour the page actually is. Worst instant across
the whole page is now **3.98:1**, which is the mathematical floor for any
continuous light-to-dark interpolation, it lasts a fraction of a second during
motion, and every resting state is ≥ 7:1.

**The background is eased through the middle of each transition, not
crossfaded linearly.** Mid-transition is where a light field and a dark field
average out to mud. The ramp hurries through it and lingers at the two ends,
where the page looks like a painted wall.

The other two movements: display type enters with a 380ms clip reveal from the
baseline up, and the corner swatch fills with the next colour over 300ms as its
field arrives. That's the lot. No parallax, no counters, no marquee, no
scroll-jacking, no page transitions.

`prefers-reduced-motion` collapses the crossfade to a hard switch at the section
boundary and turns the clip reveals into opacity fades — handled in CSS on
`[data-clip]`, so there is no second JavaScript path to keep in step. Without
JavaScript the page holds field one's colours and every word on it still clears
7:1, because there is only ever one foreground/background pair in play.

### One trap worth not falling into twice

An element clipped with `inset(100%)` reports an `intersectionRatio` of **0** to
IntersectionObserver in Chrome, however much of it is on screen. So an in-view
hook with a threshold, attached to the element it is about to reveal, can never
fire: the type is hidden because it hasn't been revealed, and it is never
revealed because being hidden makes it measure as invisible. `Reveal.tsx` and
`Swatch.tsx` therefore observe an unclipped wrapper and animate a child. Don't
collapse them.

## Rules the build enforces

Comments describing rules are worth nothing on their own, so these fail the
build:

- **7:1 on every field.** `content/fields.ts` computes each field's foreground
  and throws if the pairing falls short. It caught a real luminance bug during
  the build and it caught the palette problem below.
- **The review rules.** `content/reviews.ts` throws on an excerpt over 30 words,
  an excerpt containing an ellipsis (how stitched-together quotes give
  themselves away), a review with no source link, or a website review with no
  permission flag.
- **The phone number.** One constant in E.164 form; the display label is derived
  from it and the format is asserted. The label and the `tel:` link cannot drift
  apart, which is the most common way a tradesman's site quietly stops working.
- **The home page's reviews.** Composing a review id that isn't in the content
  file throws, rather than rendering an empty field.

And `npm run check:launch` fails while any fact the site prints is still
unverified.

## One deliberate departure from the brief

The brief specifies `#B4462C` for the burnt red field. It cannot carry 7:1 text
in either permitted foreground:

```
#B4462C on bone #F2EFE7  →  4.74:1   fails
#B4462C on ink  #14171A  →  3.30:1   fails
```

No foreground rescues it, so the field itself had to move. **`#872C14`** is the
same burnt-red hue taken down until bone clears with margin (**7.61:1**). It is
still the loudest field on the site, which is what field 7 is for. Every other
colour is used exactly as specified.

The brief also places "the prep line" on field 5 alongside AndM-6's review,
while also requiring that a review field carry the quote and nothing else. The
quote won: the prep line leads field 6, where the exterior work it describes
actually is.

## What isn't here, and why

Nothing on this site is invented. Where a fact isn't confirmed, the public site
says nothing at all — it does not print "CONFIRM:" at a customer — and the
question goes in `content/needed.json`, which feeds `CONTENT-NEEDED.md`, the
launch gate, and a development-only marker rendered exactly where the missing
fact would go.

Currently absent on purpose:

- **The review excerpts.** Verbatim means copied off the listing by a person.
  Yell blocks automated access, so nothing could read the wording, and a
  paraphrase in 72-point type is a fabricated review. Reviews render as dated,
  linked, named frames until somebody pastes the words in. See `REVIEWS.md`.
- **Opening hours.** Yell says "Open 24 hours" seven days a week. That's a
  directory default, not a fact.
- **His street address.** He works from home. Locality and service area only.
- **Insurance, CSCS, free quotations, competitive rates.** All four are
  self-reported on a listing of unknown vintage. Insurance and a CSCS card
  expire; a lapsed claim printed on a website is worse than no claim.
- **Specific towns.** "North Wales and the Chester area" is his own wording and
  is published. Named towns are not, until he names them.
- **The enquiry form.** No email address on file, so there is nowhere to deliver
  to. The contact field shows his phone number instead. Set
  `ENQUIRY_WEBHOOK_URL`, or `RESEND_API_KEY` and `ENQUIRY_TO`, and the form
  appears by itself.

## Layout

```
content/          Facts and copy. The single source of truth for all of it.
  fields.ts       The palette, and the 7:1 rule that governs it
  reviews.ts      The reviews, and the rules that govern them
  site.ts         Phone, business, URLs, credentials
  areas.ts        Confirmed towns (currently none)
  copy.ts         Every word that isn't a review or a fact
  photos.ts       Photographs (currently none)
  needed.json     Every open question
src/app/          Routes
src/components/   Field, Reveal, Swatch, Repaint, ReviewBlock, TopStrip, form
src/lib/          Formatting, enquiry delivery, spam traps, the server action
scripts/          The launch gate
```

Stack: Next.js App Router (RSC by default), Tailwind v4 with the fields as
`@theme` tokens, Motion for the repaint and the two reveals, `next/font/google`
self-hosting both faces. No CMS, no review widget, no paid tier of anything —
34 reviews are edited by hand, and for 34 reviews that is the correct answer.
