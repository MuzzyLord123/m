# The Paint Man

Bespoke marketing site for a UK painter & decorator. Built to do one job: turn
visitors into enquiries.

Next.js 15 (App Router, RSC) · TypeScript · Tailwind CSS v4 · Motion · MDX ·
Resend · Tawk.to. Every running service is free at this site's volumes.

---

## Running it

```bash
npm install
cp .env.example .env.local   # fill in the values you have
npm run dev                  # http://localhost:3000
npm run build                # production build
```

---

## Swapping in the client's details

Every client-specific value lives in **`src/config/site.ts`**. Nothing is
hard-coded in a component. The file ships with placeholder tokens:

| Token                | Meaning                                    |
| -------------------- | ------------------------------------------ |
| `{{PHONE}}`          | Phone number, as displayed and dialled     |
| `{{EMAIL}}`          | Public enquiry address                     |
| `{{TOWN}}`           | Base town                                  |
| `{{SERVICE_AREA}}`   | Area covered, e.g. "Cheshire & North Wales" |
| `{{YEARS}}`          | Years trading                              |
| `{{INSTAGRAM_URL}}`  | Instagram profile URL                      |
| `{{FACEBOOK_URL}}`   | Facebook page URL                          |
| `{{MAP_ADDRESS}}`    | Address string for the Google Maps embed   |

Find-and-replace those tokens across the repo, then work through the three data
files the client owns day to day:

- `src/data/projects.ts` — gallery projects (title, area, category, images, scope)
- `src/data/testimonials.ts` — customer quotes
- `src/data/social.ts` — the "Fresh off the brush" feed
- `src/content/blog/*.mdx` — blog posts

Blog posts are the one place that does **not** use the `{{TOKEN}}` placeholders.
MDX treats `{…}` as a JavaScript expression, so posts import `site` from
`src/config/site.ts` and interpolate the real values (`${site.town}` in the
`meta` block, `{site.town}` in the body). Setting `site.ts` correctly is enough
— the posts follow automatically, with nothing to find-and-replace.

To add a post: drop an `.mdx` file into `src/content/blog` with a `meta` export
and add three lines to `src/lib/blog.ts`. A missing field is a build error
rather than a blank page.

Replace the placeholder images in `public/work/` with real photography at the
same aspect ratios and the layout holds without further changes.

---

## Deploying to Railway

The repo ships a multi-stage `Dockerfile` (Node 20 alpine, Next standalone
output). Railway detects it automatically — no Nixpacks configuration needed.

1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo** and pick it.
3. Railway reads the `Dockerfile` and builds. No start command needed — the
   image runs `node server.js` and binds `0.0.0.0:$PORT`.
4. **Variables** → add everything from `.env.example`. The three
   `NEXT_PUBLIC_*` values are baked in at build time, so Railway must have them
   set *before* the build that ships them; changing one requires a redeploy.
5. **Settings → Networking → Generate Domain**, or add the client's custom
   domain and point the DNS `CNAME` at the Railway target.
6. Set `NEXT_PUBLIC_SITE_URL` to the final public URL and redeploy so metadata,
   `sitemap.xml` and OG tags resolve to the right host.

Build the image locally the same way Railway does:

```bash
docker build -t paintman .
docker run -p 3000:3000 --env-file .env.local paintman
```

---

## The free-service wiring

**Resend** (quote + booking emails). Create an API key, verify the sending
domain, set `RESEND_API_KEY`, `LEAD_TO_EMAIL` and `LEAD_FROM_EMAIL`. Free tier
is 3,000 emails/month — a decorator's enquiry volume will not come close. Until
a domain is verified, leave `LEAD_FROM_EMAIL` unset and Resend's sandbox sender
is used, which only delivers to the account owner's address.

**Tawk.to** (live chat). Free, unlimited. Copy the property and widget IDs out
of the widget's embed snippet into the two `NEXT_PUBLIC_TAWK_*` variables. The
site hides Tawk's own bubble and opens the chat from a custom launcher. Leave
the variables blank and no chat script is loaded at all.

**Google Maps**. The keyless `maps?q=…&output=embed` iframe. No API key, no
billing account, no usage cap to watch.

**YouTube**. Videos are `youtube-nocookie.com` embeds injected on click only —
nothing loads from YouTube until a visitor presses play.

---

## Fonts

Self-hosted variable woff2 files served from our own origin through
`next/font/local`. There is no Google Fonts `<link>` and no runtime font CDN
request.

The files are placed into `src/fonts` by `scripts/setup-fonts.mjs`, which runs
ahead of `npm run dev` and `npm run build` and copies them out of two pinned
`@fontsource-variable` devDependencies. Pinning them as packages rather than
committing binaries means every environment — local, CI, the Docker image —
builds from byte-identical files.

The brand specifies **Clash Display** and **General Sans** from Fontshare, which
was unreachable from the build environment. The closest free variable
equivalents ship instead — Archivo (display) and Schibsted Grotesk (body). To
swap in the real pair:

1. Download both variable woff2 files from fontshare.com.
2. Save them into `src/fonts` as `display-normal.woff2`, `display-italic.woff2`,
   `body-normal.woff2` and `body-italic.woff2`. The setup script never
   overwrites a file that already exists.
3. Adjust the `weight` ranges in `src/app/fonts.ts` to match the axes those
   files expose, and drop the `src/fonts/*.woff2` rule from `.gitignore` so the
   real files are committed.

Nothing else in the codebase references a font by name.

---

## Checking the work

The site ships with its own audits. Start a production build first, then run
any of them against it:

```bash
npm run build && npx next start -p 3100

npm run audit:contrast      # WCAG ratios for every colour pair in use
npm run audit:motion        # reduced-motion collapse + zero scroll listeners
npm run audit:interaction   # lightbox, bottom sheet, menu, quote flow in a browser
npm run audit:lighthouse    # Lighthouse mobile, all four categories
npm run shots               # screenshots at 375 / 768 / 1024 / 1440
```

`audit:contrast` and `audit:motion` need no browser beyond Chromium and exit
non-zero on failure, so they drop straight into CI.

### Where the numbers stand

Lighthouse, mobile profile, against a local production build. This machine
varies by about three points between runs, so these are medians of three.

| Page        | Perf  | A11y | Best practices | SEO | LCP   | CLS   | TBT    |
| ----------- | ----- | ---- | -------------- | --- | ----- | ----- | ------ |
| `/`         | 93    | 100  | 100            | 100 | 2.8 s | 0.000 | 170 ms |
| `/work`     | 94    | 100  | 100            | 100 | 3.0 s | 0.002 | 80 ms  |
| `/services` | 92    | 100  | 100            | 100 | 2.8 s | 0.010 | 230 ms |
| `/about`    | 93    | 100  | 100            | 100 | 2.9 s | 0.003 | 150 ms |
| `/contact`  | 91    | 100  | 100            | 100 | 2.9 s | 0.004 | 210 ms |
| `/quote`    | 91    | 100  | 100            | 100 | 3.1 s | 0.004 | 180 ms |
| `/blog`     | 95    | 100  | 100            | 100 | 2.6 s | 0.012 | 180 ms |

Accessibility, best practices and SEO are 100 everywhere, on every page, every
run. CLS is effectively zero. Performance sits at 91–96 depending on the run;
the home page alone has measured 92, 93, 93 and 96 on four consecutive runs of
the identical build, which is the honest width of the noise on this machine.

Read that as "low-to-mid nineties, not 95 guaranteed". The brief asked for ≥95
mobile across all four categories and three of them clear it outright; the
performance column does not, consistently, here. On the deployment target
(Vercel's edge, real photographs served as AVIF/WebP by the image optimiser
rather than the flat stand-in JPEGs) it should sit higher, but that is a
prediction and this table is a measurement — do not treat the two as the same
thing. Re-run `npm run audit:lighthouse` after the real photographs land.

Measured on a real throttled connection (4x CPU, 1.6Mbps) rather than
Lighthouse's Lantern model, LCP is 1.2–1.3s across the site.

#### What got it there

The shell, the home page and the about page carry **no animation library at
all**. Every signature interaction on them is CSS:

- The nav condense and the scroll progress bar run on
  `animation-timeline: scroll()`, so they are still scroll-linked — tracking the
  reader's hand rather than snapping at a threshold — but on the compositor with
  nothing on the main thread. Where a browser lacks scroll timelines — Firefox,
  and Safari before 26, so a real share of visitors — `NavSentinel` observes a
  zero-height element near the top of the document and toggles `data-condensed`
  on `<html>`, and the `@supports not` branches transition the same properties
  over 300ms. An IntersectionObserver, not a scroll listener: the only question
  being asked is "are we past the top", which is exactly what an observer
  answers. It is inert wherever the CSS already handles it, so the two
  mechanisms can never fight over the same properties.
- The mobile bar earns a paper ground and a hairline on the same timeline. It
  does not condense — 5.25rem is already thumb-sized, and taking height away
  would shift the page under the reader's finger — but without a ground the
  wordmark sits directly on whatever photograph happens to be passing beneath
  it. Open, `data-menu-open` clears the ground so the flooded panel shows
  through.
- The roller passes and the drip use `animation-timeline: view()`.
- The hero brush reveal animates a registered `@property --wipe`, keeping the
  site's opening moment out of the critical path entirely.
- The nav underline, the flood menu, the toggle, the paint gauge and the success
  tick are transitions and keyframes.

First load for `/` went **162KB to 113KB**. The library now ships only with
`/work` and, lazily, the two forms.

Other changes that moved the number, in order of size:

- **Reveals above the fold now render immediately.** A reveal starts at
  `opacity: 0`, so an LCP element inside one cannot paint until hydration has
  run and the observer has fired. That alone held the first service photograph
  at a 2.5s LCP despite it being a preloaded 8KB file; `<Reveal immediate>` cut
  it to 1.3s and took `/services` from 86 to 94.
- **Font subsetting** to the characters the site renders, and taking the italics
  off the preload list: simulated LCP 4.0s to ~2.9s.
- **The hero headline dropped from 3.25rem to 2.875rem at mobile widths.** The
  fallback italic is wider than the real face, so "done properly." wrapped to an
  extra line and snapped back on swap. That was the whole of the home page's
  0.041 CLS, now 0.000.
- **The booking and contact forms load when scrolled near**, behind
  placeholders of the same shape. `/contact` first load: 188KB to 105KB.

#### What did not

- **`m` + `LazyMotion` instead of `motion`.** 162KB to 163KB —
  `optimizePackageImports` was already tree-shaking it. Passing the feature
  bundle through a dynamic import was worse (185KB): the async chunk duplicates
  the barrel the static imports pull in.
- **`priority` alone on the services LCP image.** Necessary but not sufficient
  while it sat inside a reveal.

#### The one scroll listener

`MobileActionBar` attaches a passive scroll listener, and it is the only one on
the site. Scroll *direction* cannot come from a scroll-driven animation or an
IntersectionObserver — a timeline knows position, not heading — and the bar has
to hide going down and return coming up. The handler is passive, coalesced to
one update per frame, reads one cached number and writes a data attribute; the
movement itself is a CSS transition. `npm run audit:motion` asserts that exactly
this one exists and that it is passive, so a new one fails the build.

## House rules the code follows

- Server Components by default; anything with motion, scroll or pointer logic is
  an isolated leaf `"use client"` component.
- Continuous values (scroll, pointer) live in motion values, never `useState`.
- Zero `window.addEventListener("scroll", …)` in the codebase.
- Three radii only — pill (buttons), 4px (cards/images), 8px (inputs).
- One accent colour on 100% of UI chrome. The five-colour sample palette is
  confined to swatch and gallery contexts.
- `"Get a Free Quote"` is the only contact-intent label on the site.
- Every animation honours `prefers-reduced-motion` by collapsing to static.
- UK English throughout.
