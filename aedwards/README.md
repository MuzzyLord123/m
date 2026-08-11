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

### The five service pages

`/interior-painting` · `/exterior-painting` · `/wallpapering` ·
`/wood-finishes` · `/commercial-decorating`

One per line of work on his own Yell listing, built from `content/services.ts`
through a single `ServicePage` component. Same fields, same repaint — a service
page is not a different kind of page, it is the same page about a narrower
thing. Each starts at a different point in the palette, so five pages from one
component open on five different colours and never repeat one back to back.

The shape is proof-led, not pitch-led: what the job is, what it covers, the part
people underestimate, then **the reviews that are actually about that work**.
Reviews carry service tags derived from `job` — what they evidence — not from
their wording. Where a service has no review, the page says so and points at the
archive rather than borrowing one that was about a different job. Two pages are
in that position today and they say so.

Town pages would have been the obvious five and they are deliberately absent:
no town is confirmed, and a set of near-identical pages with the place name
swapped is a doorway page whatever it is called.

The copy is allowed to describe *the work* — what wallpapering involves, why
exterior jobs wait for weather — because that is true of the trade. It puts no
method claims, guarantees, turnaround times or prices in Andy's mouth. He should
still read the five pages and cross out anything he does not do; that is
`content/needed.json#service-page-copy`.

There is still no menu. The service list on field 2 of the home page is the
index, and each service page links to the other four.

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

The hero headline is the exception: it uses `RevealAtLoad`, which is the same
380ms reveal driven by CSS on load and carrying no JavaScript at all. Above the
fold there is nothing for an observer to wait for, and holding the biggest type
on the site at `opacity: 0` until hydration disqualifies it as a
largest-contentful-paint candidate — it cost 0.6s of mobile LCP and three
Lighthouse points.

`prefers-reduced-motion` collapses the crossfade to a hard switch at the section
boundary and turns the clip reveals into opacity fades — handled in CSS on
`[data-clip]`, so there is no second JavaScript path to keep in step. Without
JavaScript the page holds field one's colours and every word on it still clears
7:1, because there is only ever one foreground/background pair in play.

### Two traps worth not falling into twice

An element clipped with `inset(100%)` reports an `intersectionRatio` of **0** to
IntersectionObserver in Chrome, however much of it is on screen. So an in-view
hook with a threshold, attached to the element it is about to reveal, can never
fire: the type is hidden because it hasn't been revealed, and it is never
revealed because being hidden makes it measure as invisible. `Reveal.tsx` and
`Swatch.tsx` therefore observe an unclipped wrapper and animate a child. Don't
collapse them.

**Mandatory scroll snap strands content, in two different ways, and the obvious
fix for the first causes the second.**

A section taller than the viewport has no legal resting position in its middle,
so the browser snaps back to an edge and the middle becomes unreachable.
Measured on a 320×568 screen, fields one and two overrun by 14px and 62px —
a service list and a corner swatch nobody can get to. Mobile therefore gets
mandatory snap only above 700px of viewport height, and proximity below it.

The first attempt at the rest of it was `scroll-snap-align: none` on tall
fields, and that is worse: under mandatory snap a field with no snap point has
no resting position *at all*, so the browser rests on the previous field and you
never reach it. On a 390×844 phone that made the bottom of every service page —
the phone number at its largest, and the links to the other four pages —
unreachable, with scroll stopping at 3376 of 4220.

So every field keeps its snap point, and `Field` instead takes `tall`, which
steps the whole page down to proximity on mobile. There is a test for this:
scroll each page to the bottom with real wheel events on four viewports and
assert the last field is actually reachable.

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

## Production

**Everything is static.** Every route prerenders — including `/reviews` and one
page per review source. The source filter is a set of real pages
(`/reviews/yell`) rather than a query string, which keeps them prerendered,
gives each view its own address and means the filter works with JavaScript off.
Filtered views are `noindex` with a canonical pointing at `/reviews`, so the
site doesn't compete with itself.

**Measured**, on the production build, at the budget in `LAUNCH.md`:

| | mobile | desktop |
|---|---|---|
| Performance | 98 | 100 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| CLS | 0.000 | 0.000 |
| LCP | 2.2s | 0.6s |

Plus zero axe violations across WCAG A/AA/AAA on every page at 1440×900 and
390×844, and no horizontal overflow at any width from 320px up.

**Headers**, set in `next.config.mjs`: `Content-Security-Policy`,
`Strict-Transport-Security` (two years, subdomains, deliberately not preloaded
while the domain is still unregistered), `Permissions-Policy`,
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`. The CSP locks
everything to `self` — there is genuinely nothing third-party on this site — but
carries `'unsafe-inline'` for scripts and styles, and the comment above it is
honest about what that does and doesn't buy.

**Error boundaries.** `error.tsx` and `global-error.tsx` both put his phone
number on the screen in display type. If the site is broken, the number is the
only thing on it worth having. `global-error.tsx` styles itself inline because
it replaces the root layout and cannot assume the stylesheet loaded — but it
still imports the phone number from `content/site.ts`, because "the number
appears in exactly one place" is not a rule that gets suspended on the page most
likely to be somebody's only visit.

**Environment.** See `.env.example`. Everything is read at build time, so
setting a variable on a running host changes nothing until it is rebuilt.

**Two ways to deploy.** `npm run build` for a Node host or Vercel — keeps the
enquiry form and serves the headers itself. `npm run pack` for anywhere else: it
static-exports the site, generates `_headers` (Netlify, Cloudflare Pages) and
`.htaccess` (Apache, cPanel) from the same `hosting/headers.mjs` the Node build
uses, and zips the result at 0.46 MB. A static host cannot run a Server Action,
so that build swaps the enquiry action for a stub and the contact field shows
the phone number — which is what it does today anyway, since no email address is
configured. Measured on the exported bundle, served gzipped: mobile 97, desktop
100, accessibility 100, CLS 0.000.

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
src/app/          Routes, plus error.tsx and global-error.tsx
src/components/   Field, Reveal, RevealAtLoad, Swatch, Repaint, ReviewBlock,
                  ReviewsArchive, TopStrip, form
src/lib/          Formatting, enquiry delivery, spam traps, the server action
scripts/          The launch gate
.env.example      Every variable, and what happens without it
```

Stack: Next.js App Router (RSC by default), Tailwind v4 with the fields as
`@theme` tokens, Motion for the repaint and the two reveals, `next/font/google`
self-hosting both faces. No CMS, no review widget, no paid tier of anything —
34 reviews are edited by hand, and for 34 reviews that is the correct answer.
