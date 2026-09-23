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
- **[`RUN-ON-YOUR-PC.md`](./RUN-ON-YOUR-PC.md)** — how to run it on your own
  computer to look at it and fill in the missing bits. No code knowledge needed.

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

Every photograph on the site is one of Kenny's, and they all live in one catalogue:
**`content/photos.ts`**. 51 came off the old site (`scripts/import-live-photos.mjs`, which
also strips the GPS position a phone photo can carry).

1. Put the file in `public/work/` (e.g. `public/work/upvc-hoole.jpg`). Upload the biggest
   version there is — Next.js makes the smaller sizes itself.
2. Add an entry to `photos` in `content/photos.ts`:

```ts
upvcHoole: photo(
  'upvc-hoole',            // the file name, without .jpg
  2400,                    // its REAL width in pixels
  1600,                    // its REAL height in pixels
  'exterior',              // exterior | interior | wallpaper — which gallery it hangs in
  'UPVC sprayed anthracite grey, Hoole',                 // the caption
  'UPVC window frames sprayed anthracite grey on a semi-detached house in Hoole', // alt
),
```

- `width` and `height` are the **real pixel dimensions of the file**. Wrong values are a
  layout-shift failure.
- `alt` describes what can be seen, for screen readers and Google Images.
- The caption says what can be seen, not what was done, unless Kenny has said what was
  done. "Timbers and render, two coats" sells harder than "mock-Tudor detached" — but only
  if it is true.

It appears in `/gallery` straight away, under its category, and on the matching service
page. To use it anywhere else — a hero, a service card, a spray slot — refer to it by
name, e.g. `photo: photos.upvcHoole` in `content/spraying.ts`.

### 3. Change what the home page shows

`homeGallery` at the bottom of `content/photos.ts` is the twelve on the home page, in
order. The hero is `home.hero.photo` in `content/home.ts`; the service cards take theirs
from `photo` on each row in `content/services.ts`. The two before-and-after pairs are
`pairs` in `content/photos.ts`.

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
| `photos.ts`            | Every photograph: file, size, alt, caption, gallery  |
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
- **Motion is quiet and it is tied to the reader.** On load the hero photograph settles
  from a slight overscale, the gilt frame comes in and the lines rise one after another.
  As the page scrolls, bands rise into place, photographs uncover upward, the keyline
  inside each photograph settles, and the light runs once across each gilded phrase. All
  of it is transform and opacity on CSS scroll timelines — no animation library, no
  scroll listener — and **nothing is hidden waiting for JavaScript**: where scroll
  timelines are unsupported, or motion is reduced, content is simply there. `npm run
  audit` checks both.
- **No burger menu, no fixed bottom call bar.** On a phone every page sits in one row
  under the logo that swipes sideways; from 1280px it is one line. The number is a gold
  button in the header at every width. A menu you have to open is a menu most paid
  visitors never open — and the bottom bar belongs to another site in this portfolio.
- **It must not look like the other sites in this portfolio.** The Paint Men is flat
  orange, a grotesque with a serif-italic word, pill buttons, a split hero, brush and
  roller and drip animations, a marquee and a flood menu. Neil Brookfield is blue-black,
  brass and all-serif. None of those signatures appears here — see "Design tokens".

---

## How it is put together

```
content/            every word on the site, typed
src/app/            routes — one directory per page
src/components/     the design system
src/lib/            conversions, schema, metadata, form validation, delivery
src/fonts/          the subset Archivo file (see src/app/fonts.ts)
public/work/        Kenny's photographs
public/brand/       his logo, lifted off its background, and the KH mark alone
scripts/            check-content.mjs (launch gate), audit.mjs (axe + motion),
                    contrast.mjs, import-live-photos.mjs, subset-font.py, shots.mjs
```

A few components carry more weight than the rest:

- **`Hero.tsx`** — the opening of every page: one of his photographs full-bleed in a gilt
  frame, the headline with one phrase in gold leaf, the two buttons, and a plaque saying
  what the photograph shows. `size="full"` on the home page.
- **`Band.tsx`** — one band of the page: eyebrow, heading (with `gild` for the phrase in
  gold leaf), standfirst, content. Every section on every page is one of these.
- **`kit.tsx`** — `WorkPhoto` (a photograph in its gilt mount), `ServiceCard`,
  `TrustCard`, `Step`, `TickList`, and `Diptych` for the before-and-after pairs.
- **`Gallery.tsx`** — a swipeable rail on a phone, a masonry wall from a tablet up, and
  a full-screen `<dialog>` lightbox. One set of markup, so nothing downloads twice.
- **`QuoteBand.tsx`** — the free-quote section at the foot of every service page.
- **`Spotlight.tsx`** — the soft light that follows the pointer across a card. One
  delegated listener, desktop only.
- **`icons.tsx`** — the trade icons, drawn for this trade. No icon library has a spray gun.
- **`SprayServiceBlock.tsx`** and **`ServicePageView.tsx`** — `/spraying`'s four services
  and the three standard service pages, each rendered from a content object, so a new
  one is an object rather than a page.
- **`lib/conversions.ts`** — the Ads tag and the three conversion actions. Read
  `ADS-MIGRATION.md` before editing.

### Design tokens — "Gilded Fascia"

The old painter-and-decorator's shopfront: black lacquer, gold-leaf lettering, gilt
keylines. Painters were the signwriters and gilders of every high street, black and gold
is the palette they lettered in, and Kenny's own logo is metallic gold on black.

```
Surfaces — lacquer
--matt        #0E0C0A   the page. Warm black, deliberately not #000
--satin       #191612   raised panel: cards, the header once scrolled
--satin-hot   #241E15   satin warmed with gold, for hover
--well        #080706   recess: inputs, the footer

Text — all AA on every surface they are used on
--paper       #F1ECE3   body and headings
--paper-dim   #ADA79D   secondary
--paper-faint #948D82   micro-labels

Gold — the flat UI gold, four steps
--gold        #C9A227   labels, icons, the button fill
--gold-lift   #E2C55F   hover, and the focus ring
--gold-press  #A07D18   :active fill
--gold-deep   #8C6D14   keylines and 24px+ text only

Gold leaf (--leaf) — a metallic gradient for display-size lettering only; its darkest
band still measures 4.0:1 on the page.
```

**Type is one variable face used at three widths.** Archivo's width axis runs 62–125:
headings are set wide (112–118%), labels wider still (125%) in tracked capitals, body copy
at the normal width, and the process numerals in the narrowest cut. See
`src/app/fonts.ts` for why it is one self-hosted, subset file.

**Signatures, all this site's own:** a keyline inside every photograph like a gilt slip in
a frame; the light that runs across gilded lettering; square-cornered buttons lettered in
wide capitals with a band of light crossing on hover; a double gilt moulding between
bands; outlined condensed numerals; a full-bleed photographic hero in a gilt frame.

**Gold is never body copy.** It is a heading, label, numeral, rule, icon and button-fill
colour.

### Routes

| Route                  | Notes                                            |
| ---------------------- | ------------------------------------------------ |
| `/`                    | `/home` 301s here                                |
| `/spraying`            | The commercial page. Question index above the fold |
| `/dustless-sanding`    | The method                                       |
| `/interior-decoration` | Slug unchanged from the old site — indexed        |
| `/exterior-decoration` | Slug unchanged                                   |
| `/wallpaper-hanging`   | Slug unchanged                                   |
| `/gallery`             | Every photograph, by kind of work                |
| `/reviews`             | Slug unchanged                                   |
| `/about`               | `/about-us` 301s here                            |
| `/contact`             | `/contact-us` 301s here                          |
| `/leave-a-review`      | Something Kenny can text from the van            |
| `/api/enquiry`         | The form's endpoint. POST only                   |

Every page is prerendered as static HTML except `/api/enquiry`.
