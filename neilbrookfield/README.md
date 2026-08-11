# neilbrookfield.co.uk

Rebuild of the website for Neil Brookfield, decorator, Chester.

Next.js (App Router) · Tailwind v4 · MDX for the jobs · no CMS, no database, no paid services.

```bash
npm install
npm run dev            # http://localhost:3000
npm run build
npm run check:content  # what is still missing, and rewrites CONTENT-NEEDED.md
npm run check:launch   # the same, but fails if anything blocking is still open
```

---

## The one rule

**Nothing on this site is invented.** Where a fact is not confirmed, the page shows a labelled frame
saying what belongs there and who to ask. That is why the site currently has empty frames on it —
they are not unfinished work, they are the questions in `CONTENT-NEEDED.md` shown in place.

If you are tempted to fill one in with something plausible, put the question in `content/needed.json`
instead.

---

## Everyday jobs

### Add a job to the portfolio

1. Copy `content/projects/_TEMPLATE.mdx` to `content/projects/<job-name>.mdx`. The filename becomes
   the address: `hand-painted-kitchen-christleton.mdx` → `/work/hand-painted-kitchen-christleton`.
2. Fill in the frontmatter. Delete any field you cannot answer — a missing field is handled, a
   guessed one is not.
3. Put the photographs in `public/photographs/<job-name>/`.
4. Set `featured: true` on three of them to put them on the home page.
5. `npm run check:content` to see what is still outstanding.

The build will stop and tell you if a photograph has no alt text, if a colour has no hex value, or if
an empty image slot does not say what belongs there.

### Swap or add a photograph

Drop the file in `public/photographs/<job-name>/` and point at it in that job's `images:` list:

```yaml
images:
  - src: '/photographs/hand-painted-kitchen-christleton/02.jpg'
    alt: 'Painted drawer fronts with the original brass handles refitted.'
    caption: 'Handles cleaned and put back rather than replaced.'
    width: 2400
    height: 1600
```

`alt` is required and is one line describing **the work shown** — not "kitchen", not "image2". It is
what a blind visitor and Google both read. `width` and `height` are the file's real pixel dimensions;
they stop the page jumping while the image loads.

To leave a gap deliberately, give the slot a `needs:` line instead of a `src:` and it renders as a
labelled empty frame:

```yaml
- needs: 'Close-up of the door edge showing the brushed finish.'
```

The first image in the list is the hero, and is also the social sharing image for that job.

### Change the workshop price

`content/pricing.ts`. Nothing else. The page reads the figures from there and sets them in tabular
figures.

```ts
export const workshop = {
  confirmed: true,   // false hides the price and shows a frame instead
  hourly: 55,
  block: { hours: 3, price: 150 },
  ...
};
```

While `confirmed` is `false` the page deliberately shows a frame rather than a price, because a stale
price is worse than no price.

### Change the phone number

`content/site.ts`, the constant `PHONE_E164`, in international form:

```ts
const PHONE_E164 = '+447944512946';
```

That is the **only** phone number in the codebase. The displayed `07944 512946` is derived from it, and
there is an assertion that fails the build if the label and the link ever disagree — which is exactly
what went wrong on the old site.

Never type a phone number into a component. Use `<PhoneLink />` or `<PhoneNumber />`.

### Change wording

All copy is in `content/copy/*.ts`, one file per page, in plain English. No copy lives in components.

### Add or answer an open question

`content/needed.json`. Adding an entry there makes it available to `<Needed id="…" />`, lists it in
`npm run check:content`, and puts it in `CONTENT-NEEDED.md`. Answering one means putting the fact in
the file named in `where`, then deleting the entry.

---

## How it is laid out

```
content/
  site.ts          identity, the single phone constant, FOUNDED = 1990
  needed.json      every open question — the source for CONTENT-NEEDED.md
  pricing.ts       workshop rates and the switch that publishes them
  reviews.ts       the three real Google reviews
  copy/            page copy, one file per page
  projects/        one MDX file per job, plus _TEMPLATE.mdx
src/
  app/             routes, plus icon.svg and opengraph-image.tsx
  components/      the design system — Section, Plate, ProjectSpread, icons, …
  lib/             project loader, structured data, page metadata, enquiry action
  assets/fonts/    Fraunces, for rendering the sharing card at build time only
public/photographs/<job-name>/
scripts/check-content.mjs
```

---

## Design notes, so nothing drifts

The design is a specimen board: dark by default, colour only inside the photographs, and a single
brass hairline as the only decoration.

- **Tokens** live in `@theme` in `src/app/globals.css`. `--radius-*` and `--shadow-*` are set to
  `initial`, which **deletes every rounded and shadow utility from the build**. If `rounded-lg` does
  not work, that is not a bug.
- **Tone.** A `<Section tone="night">` or `tone="linen"` sets the background, the text colour, the
  accent and the secondary colour together. Eyebrows and hairlines pick the right shade on their own —
  the linen sections use darker brass and grey because the dark-section values fail contrast on paper.
- **Never** a three-up card row, a gradient, a shadow, an all-caps headline, or a coloured button.
  Links are text with a hairline under them.
- **Nothing here comes from an icon set or a component library.** The two icons are drawn in
  `src/components/icons.tsx` at the same 1px weight as the hairlines, the favicon is
  `src/app/icon.svg`, and the sharing card is composed in `src/app/opengraph-image.tsx`. The one
  vendored asset is a Fraunces font file used to render that card at build time — see
  `src/assets/fonts/README.md`.
- **Native controls are restyled, not replaced.** The `<select>` keeps its own behaviour with our
  chevron drawn over it, and the file input is moved off-screen behind a label styled like every
  other link — so both still work on a phone and without JavaScript.
- **Motion** is fades, one slow hero parallax, and hairlines drawing in — nothing else moves.
  - Entrances are CSS, marked with `data-reveal` and switched on by one shared observer
    (`RevealObserver`). The hidden state sits inside `@media (scripting: enabled)`, so a visitor
    with JavaScript off sees the page rather than a screen of invisible text.
  - The hero parallax is the only place the motion library is used, because it needs scroll-linked
    values. It checks `useReducedMotion()`, and `globals.css` has a blanket reduced-motion backstop
    on top of that.

## Enquiries

The form works without JavaScript. It posts to a server action, is protected by a honeypot and a
timing check, and has no CAPTCHA.

**It does not deliver anywhere yet.** `src/lib/enquiry.ts` logs the enquiry and warns loudly. Neil has
not said whether he wants enquiries as email or text, and there is no address to send them to. Wire up
`deliverEnquiry()` and set `DELIVERY_CONFIGURED = true`; that one function is the only thing that
needs to change.

## Before going live

Read `MIGRATION.md` and run `npm run check:launch`.
