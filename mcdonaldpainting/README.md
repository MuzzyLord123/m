# mcdonaldpaintingcontractors.co.uk

Rebuild of the website for **McDonald Painting Contractors Ltd** — commercial and industrial
painting contractors, based in Cheshire, working across the UK.

Next.js (App Router) · Tailwind v4 · MDX for the sector pages and site records · a generated PDF
capability statement · no CMS, no database, no paid services.

```bash
npm install
npm run dev            # http://localhost:3000
npm run build
npm start
npm run lint           # typecheck
npm run check:content  # what is still missing; rewrites CONTENT-NEEDED.md
npm run check:launch   # the same, but fails while anything blocking is open
```

---

## The one rule

**Nothing on this site is invented.**

Where a fact has not been confirmed, the page shows a marked `CONFIRM` block saying what is
missing and who to ask. That is why the site currently has yellow-marked boxes on it — they are
not unfinished work, they are the questions in `CONTENT-NEEDED.md` shown in the place the answer
will go.

There is no accreditation on this site the company does not hold, no contract value, no invented
client name, and no figure anybody has estimated. If you are tempted to fill one in with something
plausible, put the question in `content/needed.json` instead.

`npm run check:content` enforces the smaller half of this: a list of banned phrases (`"high
quality"`, `"with a smile"`, `"we pride ourselves"` and the rest) that fails the build if any of
them is reintroduced.

---

## The four things you will actually want to do

### 1. Answer one of Sean's questions

Every outstanding question lives in **`content/needed.json`**. Each one renders on the site as a
`<Confirm id="…">` block wherever the missing fact belongs.

To answer one:

1. Put the fact in the file named in that question's `where` field — usually `content/site.ts`.
2. Delete the entry from `content/needed.json`.

Every marker for that question disappears from every page at once, and it drops out of
`CONTENT-NEEDED.md` on the next `npm run check:content`. Nothing else to do.

### 2. Add a site record

1. Copy `content/projects/_TEMPLATE.mdx` to `content/projects/<job-name>.mdx`. The filename becomes
   the address: `high-school-assembly-hall.mdx` → `/projects/high-school-assembly-hall`.
2. Fill in the frontmatter. **Leave anything you cannot answer as `null`** — a null renders as an
   outstanding item, a guess renders as a fact.
3. Put the photographs in `public/photographs/<job-name>/`.
4. Set `featured: true` on three of them to put them on the home page.
5. `npm run check:content`.

The build stops with the filename in the message if a photograph has no alt text, if an image has
no dimensions, or if a record claims `status: confirmed` while fields are still empty.

Records with `status: wanted` are not jobs — they are requests for a record that is missing. They
render as a labelled block saying what is wanted and why, which is what stops the projects page
implying six jobs when there are three. Delete the file once the real record replaces it.

### 3. Swap in a photograph

Drop the file into `public/photographs/<job-name>/` and point at it in that record's `image:`
block:

```yaml
image:
  src: '/photographs/high-school-assembly-hall/01.jpg'
  alt: 'Assembly hall walls and high-level joinery repainted, shot from the rear of the hall.'
  width: 2400
  height: 1350
  credit: '@whitefeather.home' # only where a client supplied the image
```

- `alt` describes **the work shown**, in one line. It is what a blind visitor and Google Images
  both read. "Assembly hall walls repainted", not "painting".
- `width` and `height` are the file's **real pixel dimensions**. They reserve the space and keep
  the page from moving while the image loads.
- To leave a gap deliberately, use `needs:` instead of `src:` and the slot renders as a labelled
  frame stating what photograph belongs there. There is no stock photography on this site and
  there is not going to be.

### 4. Edit the words

All copy is in `/content`. No component contains a sentence that is meant to be read.

| What                                    | Where |
| --------------------------------------- | ----- |
| Company facts, phone, coverage, socials  | `content/site.ts` |
| Home page                                | `content/copy/home.ts` |
| Capability schedule + steelwork/floors/roofs | `content/copy/capabilities.ts` |
| Programmed maintenance                   | `content/copy/programmed.ts` |
| Compliance                               | `content/copy/compliance.ts` |
| About                                    | `content/copy/about.ts` |
| Contact and the enquiry types            | `content/copy/contact.ts` |
| Testimonials                             | `content/copy/testimonials.ts` |
| The schedule of works table              | `content/services.ts` |
| The sector index (order, numbers, labels)| `content/sectors.ts` |
| Each sector page                         | `content/sectors/*.mdx` |
| Site records                             | `content/projects/*.mdx` |

---

## The capability statement

`GET /capability-statement.pdf` renders a six-page PDF **on request**, from the same content files
the website renders from. It cannot drift from the site, because there is nothing for it to drift
from — change a sentence in `content/copy/` and the next download has it.

- **Gated version:** `/contact?enquiry=tender` — captures a work email first. That is the lead.
- **Direct link:** `/capability-statement.pdf` — for Sean to paste into an email. No form.

Implementation is `src/lib/pdf/CapabilityStatement.tsx` (the document) and
`src/app/capability-statement.pdf/route.ts` (the handler). Fonts are the same two families as the
site, self-hosted as TTFs in `public/fonts/pdf/` and read from disk at request time —
`outputFileTracingIncludes` in `next.config.mjs` is what keeps them in the deployed bundle.

The cover is on the graphite ground and the interior pages are on bone. A six-page document
printed entirely on a dark ground is a document nobody prints twice, and this one is meant to be
handed across a desk.

**If you edit the copy, check the page count.** The document is designed to be six pages and each
section is written to fit its sheet; long copy reflows onto an extra page rather than being
clipped, so it fails quietly. `src/lib/pdf/CapabilityStatement.tsx` trims the long-form paragraphs
to their opening sentences via `opening()` for exactly this reason.

```bash
npm run build && npm start
curl -s -o /tmp/cs.pdf http://localhost:3000/capability-statement.pdf && file /tmp/cs.pdf
# → PDF document, version 1.3, 6 page(s)
```

---

## Design

The reference is a tender document and a plant hire yard, not a decorating brochure.

Two grounds — **graphite** `#14181B` and **concrete** `#CFC9BE` — alternating, and the change
between them is always a hard cut. Display type is **Schibsted Grotesk** in sentence case; text
and every figure on the site is **IBM Plex Sans**, which is here for its tabular numerals.
Hi-vis yellow `#E4FF32` behaves the way it does on a real site: a marking, applied to the thing
you are meant to act on, and nowhere else. There are no gradients, no shadows, no rounded corners
and no icons except one 12px arrow.

**Hi-vis on a concrete ground is 1.5:1 and effectively invisible.** It is never placed there.
Sections declare a ground with `data-ground` and everything inside resolves against it, so no
component has to remember which colour it is sitting on — and `npm run check:content` fails the
build if hi-vis type turns up inside a concrete ground anyway.

Grounds, type scale and the motion are all in `src/app/globals.css`, with the reasoning next to
each decision.

### The structural devices

| Component | What it is |
| --------- | ---------- |
| `SheetHeader` | The cover sheet of a tender submission. Every page opens with one. |
| `SectorIndexList` / `SectorIndexOverlay` | The numbered index that replaces an eight-tab nav. |
| `DataStrip` | Three or four checkable figures, set large, rules between. Never animated counters. |
| `SiteRecord` | A full-bleed photograph with the seven-field caption block. This is the one that turns a gallery into evidence. |
| `SpecTable` | The schedule of works. A table, because a buyer compares it against theirs. |
| `Confirm` | An outstanding fact, shown as a question rather than filled in. |

### Motion

Scroll-triggered reveals are CSS keyframes flipped by **one** shared `IntersectionObserver`
(`RevealObserver`), not a motion component per element. That keeps every page a server component
and keeps the JavaScript off the critical path.

`motion/react` is used in exactly one place — the sector index overlay — because that is the only
thing on the site with an interruptible open state and an exit animation. It is loaded with
`next/dynamic`, so the animation runtime is fetched on first open rather than shipped in front of
the first paint of every page.

Above-the-fold headings use `data-reveal="now"`, which animates from CSS on load with no
JavaScript involved. An element that starts at `opacity: 0` and waits for a script has not been
painted as far as the browser is concerned, and the page's biggest heading is the worst possible
thing to do that to.

`prefers-reduced-motion` renders everything in its final state and opens the overlay instantly.
With JavaScript off entirely, a `<noscript>` block strips the initial states and the whole site
reads normally.

### Fonts are `display: optional`, not `swap`

Deliberate, and the reasoning is in `src/app/layout.tsx`. In short: the metric-adjusted fallback
next/font generates cannot match per-glyph widths, and at 4.5rem that is enough to move a word
onto another line when the real font arrives. Measured, that swap cost **0.19 CLS** on
`/programmed-maintenance` — the heading re-wrapped and took the page down with it under the
reader's thumb. With `optional` the layout cannot move. Both files are preloaded, so on any normal
connection they arrive in time and are used.

---

## Measured

Lighthouse, simulated mobile on slow 4G, every page:

| | Range |
| --- | --- |
| Performance | 96–98 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| Cumulative Layout Shift | 0.000 |

axe-core (WCAG 2.1 AA) reports **0 violations** on every page, including the sector index overlay
while it is open. Largest Contentful Paint measured in a real browser under 4× CPU throttling and
slow 4G is **~750ms**.

---

## Environment

See `.env.example`. All of it is optional to get the site running; the first is required before
launch.

| Variable | What it does |
| -------- | ------------ |
| `NEXT_PUBLIC_SITE_URL` | The live origin, no trailing slash. Drives canonical tags, the sitemap, Open Graph and the structured data. Without it they point at localhost. |
| `ENQUIRY_WEBHOOK_URL` | Where a submitted enquiry is POSTed as JSON. Unset, enquiries are written to the server log only. The phone number is the primary route in either way. |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID. Nothing loads without it, so a preview build sends no data anywhere. |

---

## Structure

```
content/            every word on the site
  site.ts           the hard facts
  needed.json       every open question — drives the CONFIRM markers and CONTENT-NEEDED.md
  sectors.ts        the sector index: order, numbers, labels
  services.ts       the schedule of works
  copy/             page copy, one file per page
  sectors/          eight sector pages, MDX
  projects/         site records, MDX
src/
  app/              routes
  components/       the structural devices
  lib/              content loading, schema, enquiry handling
  lib/pdf/          the capability statement
public/fonts/pdf/   the two font families as TTFs, for the PDF (both SIL OFL, licences included)
scripts/            check-content.mjs
```

`MIGRATION.md` is the cutover plan. `PITCH.md` is the current site against this one, written for
Sean. `CONTENT-NEEDED.md` is generated — edit `content/needed.json` instead.
