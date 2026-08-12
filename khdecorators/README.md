# khdecorators.uk

Website for **KH Painting and Decorating** — Kenny, a painter, decorator and spray finisher working
across the north west of England.

This replaces a live Google Sites site that is **receiving paid traffic**. Two documents
matter more than this one:

- **[`ADS-MIGRATION.md`](./ADS-MIGRATION.md)** — the Google Ads tag, the conversion
  mapping, and the order to do things in. Read it before touching DNS. It protects his
  ad spend.
- **[`LAUNCH.md`](./LAUNCH.md)** — redirects, DNS, Google Business Profile, Search
  Console, and the performance figures.
- **[`CONTENT-NEEDED.md`](./CONTENT-NEEDED.md)** — the one phone call that unblocks
  launch.

```bash
npm install
npm run dev              # http://localhost:3000
npm run build
npm start
npm run lint             # typecheck
npm run check:content    # what is still outstanding
npm run check:launch     # the same, but fails if anything blocking is outstanding
```

Next.js App Router · Tailwind v4 · TypeScript. No CMS, no database, no logins, no paid
services. Every word lives in `/content` as typed TypeScript, so copy can be changed
without going near a component.

---

## The four things you will actually want to do

### 1. Fill in the town

One word, and it is the biggest single improvement on the project. Open
`content/site.ts` and change:

```ts
export const town: string = '{{TOWN}}'
```

It updates all nine page titles, the first sentence of the home page, the structured
data, the footer and the contact page at once.

### 2. Add a photograph

Every image is a **slot**. While a slot is empty it renders as a ruled frame carrying a
description of the shot needed — never a stock photo, never an AI-generated interior.

1. Put the file in `public/work/` (e.g. `public/work/upvc-hoole.jpg`).
2. Find the slot in the matching content file and fill in four fields:

| Where it appears        | File                  |
| ----------------------- | --------------------- |
| Home hero               | `content/home.ts`     |
| Home, the two specialisms | `content/home.ts`   |
| `/spraying`             | `content/spraying.ts` |
| `/dustless-sanding`     | `content/dustless.ts` |
| The three service pages | `content/services.ts` |

Change this:

```ts
photo: emptyPhoto('A house of UPVC windows part-sprayed…'),
```

to this:

```ts
photo: {
  src: '/work/upvc-hoole.jpg',
  alt: 'UPVC window frames sprayed anthracite grey, Hoole',
  width: 2400,
  height: 1600,
  brief: 'A house of UPVC windows part-sprayed…',
},
```

- `width` and `height` are the **real pixel dimensions of the file**. They hold the
  layout still while it loads; wrong values are a layout-shift failure, and CLS is in
  the performance budget.
- `alt` describes the work, for screen readers and Google Images. "UPVC window frames
  sprayed anthracite grey, Hoole", not "painting".
- `brief` can stay as it is — it is only shown while the slot is empty.

Upload the biggest version available. Next.js re-encodes to AVIF/WebP and resizes on
demand; do not shrink it first.

### 3. Add a job to "Recent work"

Open `content/home.ts` and add an entry to `work.items`. Each one is a photo slot,
so the same two-minute job as above:

```ts
work: {
  items: [
    {
      src: '/work/garage-door-frodsham.jpg',
      alt: 'Steel up-and-over garage door sprayed graphite grey, Frodsham',
      width: 2400,
      height: 1800,
      brief: 'A steel up-and-over garage door, finished, from the drive.',
    },
    // …
  ],
},
```

The `callouts` still in the content files are the short technical points — "glass and
seals masked" — and they render as the **gold tick list** beside each specialism on
the home page. They used to be drawn onto the photograph itself with leader lines
running out to labels in the margin. That looked like an engineering drawing rather
than a decorator's photograph, so it was removed; the `x`/`y` positions are kept in
the content but are no longer used for anything.

### 4. Change some copy

It is all in `/content`, as ordinary TypeScript strings:

| File                   | What it holds                                        |
| ---------------------- | ---------------------------------------------------- |
| `site.ts`              | Phone, email, town, trading name, nav                |
| `home.ts`              | The home page, section by section                    |
| `spraying.ts`          | `/spraying` — the four sprayable services            |
| `dustless.ts`          | `/dustless-sanding`                                  |
| `services.ts`          | The service table, and the three standard pages      |
| `process.ts`           | How a job runs                                       |
| `about.ts`             | `/about`                                             |
| `contact.ts`           | `/contact` and the form's labels                     |
| `areas.ts`             | Where he works                                       |
| `reviews.ts`           | Reviews, and `/leave-a-review`                       |
| `needed.ts`            | The register of unanswered questions                 |

`{town}` in any string is substituted at render time. `{{ANYTHING_IN_CAPS}}` is an
unanswered question — it renders as a marked "to confirm" box and is listed by
`npm run check:content`.

---

## Rules this build keeps

Worth knowing before changing anything, because some are enforced and some are only
written down.

**Enforced by the tooling** — `npm run check:launch` fails, or the utility does not exist:

- No colour outside the palette, no `blur-*`, and only the two radii and three
  shadows the design actually defines. Tailwind's stock scales are reset to
  `initial` in `globals.css`, so those classes are never generated — you cannot
  type `rounded-lg` or `bg-red-500` by accident.
- No second typeface. `--font-*` is reset for the same reason; Archivo is the only
  family defined. See `src/app/fonts.ts` for why it is one family and not two.
- **Every text/background pair is contrast-checked by `npm run check:contrast`,**
  which computes the ratios rather than trusting them. Gold on near-black is the
  classic trap — it lands around 3–4:1, looks fine and fails — so the gold in this
  palette was picked at a luminance that clears 4.5:1 on every surface it is used
  on. Change a hex and run the check.
- No `aggregateRating` in the structured data. Third-party ratings marked up as
  first-party risks a manual action against the whole site.
- No hotlinks to `googleusercontent.com`, no embedded Google Form, no link to
  `rmdecorsolutions.co.uk` (which the old About page had — see below).
- The Ads tag `AW-11172797357` must be present in `src/lib/conversions.ts`.
- Reviews: no unsourced quote may carry a date or a link.

**Written down, and worth keeping:**

- **It is Kenny, not "we".** He works on his own and the copy says so. No corporate plural
  anywhere.
- **Every word is new.** The old About page linked to another decorator's website, which
  is what happens when copy is lifted from a template and the links are never changed.
  Nothing was carried over, including the parts that read fine.
- **Reviews are transcribed, never written.** See the top of `content/reviews.ts`.
- **Honest limits on every service page.** The "what it will not do" sections are the most
  persuasive thing on the site precisely because nobody else writes them.
- **Motion is small and it is all feedback.** A band fades and lifts 12px as it
  comes into view, hover or focus warms a colour, and a card's gold top edge
  brightens. Nothing animates a layout property, and there is no parallax, no
  counter, no page transition and nothing with a spring. Under
  `prefers-reduced-motion` the transition goes but the end state stays — reduced
  motion must never mean reduced feedback.
- **No fixed bottom call bar, no burger menu.** The nav is always visible, and the
  number is a gold button in the sticky header at every width — never behind a
  disclosure.
- **The layout is deliberately familiar.** An earlier version of this site arranged
  the same content as a numbered specification document with an exposed 12-column
  grid and technical callout diagrams over the photographs. It was more interesting
  to look at and it was the wrong thing: somebody looking for a decorator wants to
  recognise the page, not admire it. Hero, trust points, service cards, gallery,
  steps, testimonials, quote form — in that order, because that is the order a
  customer reads in.

---

## How it is put together

```
content/            every word on the site, typed
src/app/            routes — one directory per page
src/components/     the design system
src/lib/            conversions, schema, metadata, form validation, delivery
scripts/            check-content.mjs (launch gate), shots.mjs (screenshots)
```

A few components carry more weight than the rest:

- **`Band.tsx`** — one band of the page: gold eyebrow, heading, standfirst, content.
  Every section on every page is one of these.
- **`kit.tsx`** — the small pieces. `WorkPhoto`, `ServiceCard`, `TrustCard`, `Step`,
  `TickList`.
- **`icons.tsx`** — the trade icons, drawn for this trade. A spray gun, a roller, a
  dust extractor, a wallpaper roll. Not a library: no library has a spray gun in it,
  and a generic icon set is what makes a trade site look bought.
- **`SprayServiceBlock.tsx`** — renders one sprayable service. `/spraying` maps four
  through it, and a future `/upvc-spraying` landing page renders exactly one. See
  `ADS-MIGRATION.md` §7 for the six-line version of that page.
- **`ServicePageView.tsx`** — the three standard service pages all render through this
  from a `ServicePage` object, so a fourth is an object rather than a page.
- **`Drawn.tsx`** — the only JavaScript driving motion. Sets `data-drawn` when a band
  enters the viewport; the CSS does the rest.
- **`lib/conversions.ts`** — the Ads tag and the three conversion actions. Read
  `ADS-MIGRATION.md` before editing.

### Design tokens

Black and gold. A matt near-black page, raised satin cards, and gold used for
headings, ticks, numbers, icons and the call-to-action — never as a flood fill and
never for body copy.

```
Surfaces — the sheen ladder, which is the thing Kenny actually sells
--matt        #12100E   the page. Warm near-black, deliberately not #000
--satin       #1F1C18   raised panel: tables, quotes, the header
--satin-hot   #2B2519   satin warmed with gold, for hover
--well        #0A0908   recess: inputs, table heads, footer, chips

Text — three tiers, all AA on every surface they are used on
--paper       #EFEAE2   body and headings
--paper-dim   #ADA79D   secondary: nav, table labels, captions
--paper-faint #948D82   micro-labels

Gold — signwriter's brass, four steps
--gold        #C9A227   headings, numerals, rules, the CTA fill
--gold-lift   #E2C55F   hover, and the focus ring
--gold-press  #A07D18   :active fill
--gold-deep   #8C6D14   borders and 24px+ text ONLY. Never body copy.

Lines
--edge        #787166   MEANINGFUL borders: inputs, frames, tables
--rule        #2C2823   DECORATIVE hairlines: the setting-out grid, row rules
--alert       #F47962   the one status colour
```

**Gold is never body copy.** It is a heading, numeral, rule, icon and button-fill
colour. There is no exception — not for pull quotes, not for the phone number in
prose. Body text is `paper` or `paper-dim`, and that rule is what keeps a
black-and-gold site readable at length.

Depth comes from CSS and inline SVG, never a bitmap: a 0.6KB turbulence tile at
5% that reads as atomised overspray, 1px inset highlights that read as a lit
surface, hatching in the photograph frames that are still empty, and one
hand-drawn brush-stroke rule between the major bands of the page.

### Routes

| Route                  | Notes                                            |
| ---------------------- | ------------------------------------------------ |
| `/`                    | Eight numbered sections. `/home` 301s here       |
| `/spraying`            | The commercial page. Question index above the fold |
| `/dustless-sanding`    | The method                                       |
| `/interior-decoration` | Slug unchanged from the old site — indexed        |
| `/exterior-decoration` | Slug unchanged                                   |
| `/wallpaper-hanging`   | Slug unchanged                                   |
| `/reviews`             | Slug unchanged                                   |
| `/about`               | `/about-us` 301s here                            |
| `/contact`             | `/contact-us` 301s here                          |
| `/leave-a-review`      | Something Kenny can text from the van            |
| `/api/enquiry`         | The form's endpoint. POST only                   |

Every page is prerendered as static HTML except `/api/enquiry`.
