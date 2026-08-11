# F.A.S Painter and Decorator

Website for a painter and decorator working in Wrexham and Coedpoeth. One page, one
job: make the phone ring.

Next.js (App Router) · Tailwind v4 · TypeScript. No CMS, no database, no logins. All
the words live in `/content` as TypeScript files, so copy can be changed without going
anywhere near a component.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm start
npm run lint       # typecheck
npm run audit      # accessibility + pre-flight checks (see below)
```

---

## The three things you will actually want to do

### 1. Swap in a photograph

Every photo on the site is a **slot**. While a slot is empty it renders as a flat block
in the section's colour with a "Photograph to come" label — never a stock photo. Fill
the slot and the real photograph takes over automatically.

1. Drop the image file into `public/work/` (e.g. `public/work/kitchen-coedpoeth.jpg`).
2. Find the slot in the matching content file and fill in the four fields:

| Where the photo appears | File |
|---|---|
| Hero, at the top of the page | `content/hero.ts` |
| The four service bands | `content/services.ts` |
| The preparation section | `content/preparation.ts` |
| The recent work gallery | `content/gallery.ts` |

Change this:

```ts
photo: emptyPhoto('A finished room, taken from the doorway with the light on…'),
```

to this:

```ts
photo: {
  src: '/work/kitchen-coedpoeth.jpg',
  alt: 'Kitchen ceiling and walls repainted, Coedpoeth',
  width: 2400,
  height: 1600,
  brief: 'A finished room, taken from the doorway with the light on…',
},
```

- `width` and `height` are the **real pixel dimensions of the file**. They stop the page
  jumping about while the image loads — get them wrong and the layout shifts.
- `alt` describes the work in the photo, for people using a screen reader and for
  Google Images. "Kitchen ceiling and walls repainted, Coedpoeth", not "painting".
- `brief` can stay as it is. It is the note about what the shot should show, and it is
  only ever displayed in review mode (below).

Next.js resizes and re-encodes to AVIF/WebP on the fly. Upload the biggest version you
have; do not shrink it first.

### 2. Add a job to the gallery

Open `content/gallery.ts` and add an entry to the `jobs` array:

```ts
{
  id: 'llay-hallway',
  caption: 'Hallway, stairs and landing repainted',
  place: 'Llay',
  finish: 'Satin woodwork, matt emulsion walls',
  span: 'std',
  swatch: 'sage',                       // 'blue' | 'clay' | 'sage' | 'black'
  photo: { src: '/work/llay-hall.jpg', alt: '…', width: 2000, height: 1500, brief: '' },
  beforeAfter: null,                    // or { before: {...}, after: {...} }
},
```

- **Order in the array is the order on the page.** The desktop grid cycles through six
  cell shapes, so the layout stays irregular however many jobs there are.
- `beforeAfter` turns on the draggable comparison slider. Both shots need to be taken
  from the same spot or it looks wrong. The first job in the list that has a pair gets
  the full-width slider at the top of the section.
- `caption`, `place` and `finish` may be `null` while you are waiting on the details —
  the slot just shows without a caption rather than showing an empty one.

There is no `/gallery` page and no per-job pages yet, on purpose: they only earn their
place once there are three or more real jobs with before-and-after photographs. Until
then the on-page gallery is the whole of it.

### 3. Change a service description

`content/services.ts`. Each service is one object:

```ts
{
  id: 'woodwork',                 // also the anchor link, e.g. /#woodwork
  swatchLabel: 'Woodwork',        // small label above the heading
  title: 'Woodwork finishing',
  body: 'Doors, skirting, architrave…',   // aim for 40–60 words
  detail: [                                // three concrete specifics
    'Knotting solution on every knot, or it bleeds through the topcoat',
    …
  ],
  swatch: 'sage',
  photo: …,
}
```

Nothing in the components needs touching.

**One thing to know before reordering them.** The four bands are four different
compositions, not one layout mirrored down the page — that zigzag is the thing that
makes a site look like it came out of a builder. Position in the array decides which
composition a service gets:

| Position | Composition |
|---|---|
| 1st | Split band, photo running off the right edge of the screen |
| 2nd | Inset band, photo sitting under its own heading rather than beside it |
| 3rd | Split band, portrait photo running off the left edge |
| 4th | Stacked band, text over a letterbox the full width of the page |

So move a service and it changes shape. The layouts cycle, so a fifth service picks up
the first composition again — but four is a deliberate number and five will read as a
list. Each band's `swatch` colour drives its number, its top rule and its photo block;
the order blue → off-black → sage → clay is chosen so the dark band lands mid-page and
does not run into the off-black preparation section underneath.

**The other content files:** `content/preparation.ts` (the preparation section),
`content/finishes.ts` (the eggshell/satin/gloss table), `content/process.ts` (the four
steps), `content/areas.ts` (where he works), `content/site.ts` (name, phone, meta title
and description, nav order), `content/hero.ts` (hero copy and all the contact copy).

---

## Rules this site keeps to

These are not style preferences, they are the things that keep the site honest and out
of trouble. Please keep to them when editing.

- **Nothing about the business is invented.** No years trading, no insurance, no
  qualifications, no guarantees, no ratings, no opening hours, no prices, no email
  address. If a fact is not confirmed, the site leaves it out — see `CONTENT-NEEDED.md`
  and the register in `content/todo.ts`.
- **No stock photography, ever**, and no AI-generated interiors presented as his work.
  An empty labelled block is more honest and, oddly, looks better.
- **No fake reviews or testimonials.** Real ones with a link, or nothing.
- **Checkatrade** is a plain text link and only appears once a real profile URL is set in
  `content/todo.ts`. Never the badge, the logo, a star rating or a review count — the
  badge assets are licensed to members and a self-typed rating is a liability.
- **The phone number is `07951 320566` everywhere**, and `tel:+447951320566` in links. It
  comes from `content/site.ts`; do not type it out by hand anywhere else.
- **British English.** Colour, skirting, render, plasterboard, architrave, tidy up.
- **No per-village pages** with the town name swapped. If location pages are wanted, they
  get separately written content or they do not get built.

---

## Review mode

While the client still owes us photographs and a list of villages, the site can show
him exactly what is missing.

```bash
NEXT_PUBLIC_SHOW_PHOTO_BRIEFS=1 npm run build && npm start
```

With it on, every empty photo slot prints the brief for the shot needed, and the "Where
I work" section shows the unconfirmed villages in a marked-off box. It is on
automatically in `npm run dev`, and **off in production unless you set that variable** —
so a staging deployment can carry it and the live site never will.

---

## Deploying

This repo holds **two** separate Next projects: the F.A.S site at the root, and
`neilbrookfield/` in its own directory. Whatever you deploy to, the **root directory**
setting decides which one you get.

On Vercel — import `MuzzyLord123/m` at [vercel.com/new](https://vercel.com/new) and set:

| Setting | Value |
|---|---|
| Framework | Next.js (auto-detected) |
| Root Directory | `./` — the repo root. This is the F.A.S site. |
| Build / install commands | Leave alone; `vercel.json` sets them. |

Then add the environment variables below under Settings → Environment Variables and
redeploy. `NEXT_PUBLIC_SITE_URL` is the one that matters — without it, canonical tags,
the sitemap and the JSON-LD all point at `localhost`.

Once it is connected, every push to `main` deploys automatically.

`vercel.json` exists for one reason: `playwright` is a devDependency (the audit script
uses it) and Vercel installs devDependencies, so its postinstall would pull ~150MB of
browsers on every build. `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` stops that. Nothing at
runtime touches Playwright.

## Environment variables

| Variable | What it does |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | The live origin, e.g. `https://example.co.uk`. Drives canonical tags, the sitemap, Open Graph and the JSON-LD `url`. **Set this before launch.** Falls back to `http://localhost:3000`. |
| `ENQUIRY_WEBHOOK_URL` | Where a submitted contact form is POSTed as JSON. Unset, enquiries are only written to the server log. See `CONTENT-NEEDED.md` §4. |
| `NEXT_PUBLIC_SHOW_PHOTO_BRIEFS` | `1` turns review mode on. Leave unset in production. |

---

## How it is put together

```
app/
  layout.tsx            fonts, metadata, the grain overlay, the no-JS fallback
  page.tsx              the single page, in conversion order
  globals.css           design tokens (@theme) and every hand-written rule
  api/enquiry/route.ts  the contact form handler
  enquiry/sent|problem  where the form lands with JavaScript switched off
  opengraph-image.tsx   link preview, built from the brand block
  sitemap.ts robots.ts icon.tsx
components/             everything on the page; sections/ holds the eight bands
content/                all the words
lib/                    swatch colours, review-mode flag
scripts/audit.mjs       the pre-flight check
```

**Colour.** Tokens are in the `@theme` block at the top of `app/globals.css`. Paper base,
ink type, flat colour blocks, no gradients anywhere. The orange comes in three steps —
`orange` for blocks and display-size type, `orange-deep` for anything interactive
carrying normal-size text, `orange-ink` for orange text on the paper background. They
exist because plain `#D24E1B` only reaches 3.9:1 against the paper and everything on
this site has to clear 4.5:1.

**Type.** Archivo, loaded with its width axis so headings can be set Expanded, plus
Instrument Sans for body copy. Both self-hosted by `next/font` — there is no request to
Google from the browser.

**Motion.** Deliberately little of it, and almost none of it JavaScript:

| Effect | How |
|---|---|
| Roller wipe on section reveals | IntersectionObserver + a CSS transition (`components/RollerReveal.tsx`) |
| Paint bleed on buttons | CSS `transform: scaleX()` on a pseudo-element (`.bleed`) |
| The "how a job runs" line drawing itself | CSS scroll-driven animation, `stroke-dashoffset` |
| Hero parallax | CSS scroll-driven animation, no scroll handler |
| Before/after divider | The one place the animation library is used — a `MotionValue` so dragging never re-renders. Loaded after hydration, below the fold. |

Nothing loops. Everything has a `prefers-reduced-motion` path, and with JavaScript
switched off the roller covers are removed entirely rather than left sitting over the
content.

---

## Pre-flight

```bash
npm run build && npm start          # in one terminal
npm run audit                       # in another
```

`scripts/audit.mjs` runs axe on desktop and mobile and then checks the things this site
is not allowed to get wrong: exactly one `h1`, no skipped heading levels, the phone
number formatted identically in all six places it appears, structured data that omits
the fields we cannot confirm, no banned marketing phrases, at most four masking-tape
labels, the before/after handle working from the keyboard, both form paths (with and
without JavaScript), and the page still being readable with JavaScript off.

Point it somewhere else with `AUDIT_URL=https://… npm run audit`.

**Last measured**, production build, Lighthouse mobile: performance 95, accessibility
100, best practices 100, SEO 100, CLS 0, LCP 1.9s under real 4G throttling. (Lighthouse's
*simulated* throttling reports LCP 2.9s; that figure does not move even with the web
fonts removed entirely, so it is the simulation's model of a local server rather than
anything on the page. Measure against the real deployment.)
