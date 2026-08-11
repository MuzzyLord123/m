# egodecorators.com

The website for **Ego Decorators** — painters, decorators and exterior repair,
Neston, Cheshire.

Next.js App Router, React Server Components, Tailwind v4, MDX for the jobs. No
CMS and specifically not WordPress: the point of the rebuild was to get off a
theme shared with dozens of competitors.

```bash
npm install
npm run dev            # http://localhost:3000
npm run lint           # typecheck
npm run build
npm run check:content  # what is still outstanding
npm run check:launch   # the gate — fails while anything blocking is open
```

---

## The three things you will actually want to do

Everything below is editing content. None of it means opening a component.

### 1. Add a job

```bash
cp content/projects/_TEMPLATE.mdx content/projects/parkgate-sash-windows.mdx
```

The filename is the URL: that one is served at `/projects/parkgate-sash-windows`.
Fill in the frontmatter, write two or three paragraphs under it, done — the
index page, the sitemap and the structured data all pick it up on the next
build. Set `featured: true` for it to appear on the home page.

The build validates the frontmatter and fails **loudly, with the filename in the
message**, rather than shipping a gap. It will refuse:

- a slug like `project-1` — name the job or leave it out
- an image with a `src` but no `alt`, or alt text that reads like `image1`
- an image with a `src` but no `width`/`height` — the space has to be reserved
  or the page jumps as photographs load
- a comparison slot with neither a photograph nor a line saying what is missing
- an empty `work:` list

### 2. Replace a comparison pair

Every comparison is two entries in a job's frontmatter:

```yaml
before:
  needs: Looking up the stairs from the hall, green lower half still on.
after:
  needs: The same view, finished.
```

When the photographs exist, drop them in `public/photographs/<slug>/` and swap
`needs` for the real thing:

```yaml
before:
  src: /photographs/hall-stairs-and-landing/before.jpg
  alt: Stairwell with a dark green lower half and a dado line at waist height
  width: 2400
  height: 1600
after:
  src: /photographs/hall-stairs-and-landing/after.jpg
  alt: The same stairwell in one colour from the hall to the top landing
  width: 2400
  height: 1600
```

That is the whole change. The frame turns from a labelled placeholder into the
drag comparison by itself.

**The one rule: a before and an after must be the same view.** Same spot, same
framing, same rough distance. Two photographs of different walls presented as a
pair reads as a con, and the entire design depends on this being honest. Nothing
in the code can check it — that one is on whoever adds the files.

### 3. Edit a service page

The words for each page live in one file:

| Page | File |
|---|---|
| `/` | `content/copy/home.ts` |
| `/repairs` | `content/copy/repairs.ts` |
| `/commercial` | `content/copy/commercial.ts` |
| `/interior` | `content/copy/interior.ts` |
| `/exterior` | `content/copy/exterior.ts` |
| `/about` | `content/copy/about.ts` |
| `/contact` | `content/copy/contact.ts` |

Add an item to a list in one of those and it appears on the page, laid out
correctly, without touching a component. Phone, email, area and off-site
profiles all come from `content/site.ts`.

---

## The rules the code enforces

Most of these exist because the old site broke them.

**One phone number.** `content/site.ts` holds the E.164 form and *derives* the
display label from it. An assertion runs at module load, so a label and an href
that disagree fail the build rather than shipping a number that does not dial.

**One email, and it must be complete.** The old footer rendered
`info@egodecorators` with no `.com`, so every mailto on the site failed
silently. The constant is now checked against a pattern at build time.

**No hardcoded years.** The footer year is `new Date()`. "Years trading" is
computed from `FOUNDED`, which is `null` until confirmed — and while it is null
the page shows a labelled frame instead of a number. The old site said
"15 Years Extensive Experience", written in 2022, wrong every year since.

**No `href="#"`.** `<SeamLink>` throws on one. The old site had six.

**No invented content.** Where a fact is missing, `<Pending id="…">` renders a
labelled frame naming the question, and the id must exist in
`content/needed.json` or it throws. That registry drives the site, the check
script and `CONTENT-NEEDED.md` from one place.

**No `aggregateRating` in the structured data.** The Yell rating belongs to
Yell; marking up a third-party rating as your own review data is against
Google's policy. It is shown as plain text with its source and the date it was
read, or not at all.

**Reviews are verbatim.** `quote: null` means we know a review exists but not
its exact words, and the site says so rather than paraphrasing. A paraphrase
inside quotation marks over a customer's name is a fabricated review.

---

## The design, in one paragraph

Their work is a transition — rotten and flaking, then repaired and finished — so
the site is built on a split. A hard 2px seam runs down the centre of every
screen wider than `md` and content alternates across it: left column
right-aligned into the seam, right column left-aligned out of it. The site is
black and white, and **photographs are greyscale until the work is done**. That
is the entire palette logic: the colour you can see is the paint they put on.
There is no accent colour. If a screen looks like it needs one, what it needs is
a photograph of finished work.

- **Type** — Syne 700–800 for display, Familjen Grotesk 400–500 for everything
  else. Both variable, both self-hosted by `next/font`. The wordmark is "EGO"
  with the seam passing between the G and the O; that is the logo, there is no
  other mark.
- **Tokens** — in `@theme` in `src/app/globals.css`. Every radius, shadow and
  blur utility is deleted from the build, so no component can quietly acquire
  one.
- **Tone** — a `<Band>` declares `paper` or `ink` once and the type, metadata
  grey and hairlines inside it resolve. The metadata grey is different on the
  two, because `#6E6E6E` clears AA on white (5.1:1) and fails on black (3.9:1).

### Motion

`src/lib/reveal-script.ts` is the only inline script. It stamps `data-js` and
runs one IntersectionObserver for every reveal on the site.

It is written this way on purpose. **The default state of every reveal is the
finished state** — type in place, photographs in colour. The hidden state only
exists inside `html[data-js]`. So if the script never runs, nothing is
invisible; the page simply has no animation. A motion library left to its own
devices server-renders `opacity: 0` and hopes hydration arrives, and when it
does not, the visitor gets blank space with the words sitting in the markup
where only a crawler will ever see them.

Motion (`motion/react`) is used in exactly one place: `Seam.tsx`, the drag
comparison, where a `MotionValue` keeps pointer tracking off the React render
path. Nothing about a drag causes a re-render.

`prefers-reduced-motion` is honoured: colour is simply there, type is in place,
and the comparison still drags — it is a control, not an animation.

---

## Layout

```
content/
  site.ts            facts: phone, email, area, profiles. One source of truth.
  needed.json        every open question — drives the site, the gate and the docs
  reviews.ts         four reviews, verbatim only
  copy/              the words, one file per page
  projects/          one MDX file per job
src/
  app/               routes
  components/        Seam (the comparison), Split, Band, Wordmark, Pending…
  lib/               project parsing, schema, metadata, the reveal script
public/photographs/  one folder per job
```

See `MIGRATION.md` for the redirect map and the cutover order, and
`CONTENT-NEEDED.md` — which is generated, not hand-written — for what is still
outstanding.
