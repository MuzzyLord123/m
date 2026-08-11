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

### 3. Annotate a photograph

The callouts are the signature device of this site: a small marker on a detail, a 1px
leader line, and a short technical label just outside the frame.

```ts
callouts: [
  { x: 26, y: 32, side: 'left',  label: 'Glass and gaskets masked' },
  { x: 68, y: 44, side: 'right', label: 'Adhesion primer, two topcoats' },
],
```

- `x` and `y` are **percentages of the image**, so a marker stays on the detail it points
  at from a phone up to a large monitor.
- **Keep them off the subject.** A label across the middle of a sprayed door is a worse
  photograph and a worse annotation.
- `side` is which side the label sits on — pick the side with more empty space. Reserving
  a gutter costs the photograph about 130px, so on a narrow figure put them all on one
  side.
- Two or three per photograph. Four is a diagram.
- Below a figure width of `34rem` the labels become a numbered list beneath the image,
  with matching numbers on the markers. That is automatic.

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
- **Motion is small and it is all feedback.** Grid rules draw down on section entry,
  callout leader lines draw out, the rail's current number turns gold, and hover or
  focus warms a colour. Nothing animates on load, nothing animates a layout
  property, and there is no parallax, no counter, no page transition and nothing
  with a spring. Under `prefers-reduced-motion` the transition goes but the end
  state stays — reduced motion must never mean reduced feedback.
- **No fixed bottom call bar, no burger menu.** The nav is always visible.

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

- **`Annotated.tsx`** — the annotated photograph. Read the comment at the top before
  changing it; the positioning is a container query for a reason that took a bug to find.
- **`SprayServiceBlock.tsx`** — renders one sprayable service. `/spraying` maps four
  through it, and a future `/upvc-spraying` landing page renders exactly one. See
  `ADS-MIGRATION.md` §7 for the six-line version of that page.
- **`ServicePageView.tsx`** — the three standard service pages all render through this
  from a `ServicePage` object, so a fourth is an object rather than a page.
- **`Drawn.tsx`** — the only JavaScript driving motion. Sets `data-drawn` when a block
  enters the viewport; the CSS does the rest.
- **`lib/conversions.ts`** — the Ads tag and the three conversion actions. Read
  `ADS-MIGRATION.md` before editing.

### Design tokens — "Signwriter's Fascia"

A matt near-black wall, raised satin panels, and gold used the way a signwriter
uses it: lettering, leaf-thin rules and registration marks. Never a flood fill.

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

Depth comes from three CSS techniques and no bitmaps: a 0.6KB inline SVG
turbulence tile at 5% that reads as atomised overspray, 1px inset highlights that
read as a lit surface, and masking-film hatching in every empty photograph frame.

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
