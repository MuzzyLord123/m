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

Lighthouse, mobile profile, against a local production build. Scores on this
class of machine vary by a few points between runs, so these are medians of
three; the occasional 60-something outlier is contention, not the page.

| Page        | Perf | A11y | Best practices | SEO | LCP   | CLS   | TBT    |
| ----------- | ---- | ---- | -------------- | --- | ----- | ----- | ------ |
| `/`         | 92   | 100  | 100            | 100 | 2.9 s | 0.019 | 190 ms |
| `/work`     | 90   | 100  | 100            | 100 | 3.1 s | 0.000 | 220 ms |
| `/services` | 87   | 100  | 100            | 100 | 3.6 s | 0.010 | 200 ms |
| `/about`    | 94   | 100  | 100            | 100 | 2.7 s | 0.003 | 170 ms |
| `/contact`  | 93   | 100  | 100            | 100 | 2.7 s | 0.004 | 200 ms |
| `/quote`    | 89   | 100  | 100            | 100 | 2.8 s | 0.004 | 310 ms |
| `/blog`     | 94   | 100  | 100            | 100 | 2.8 s | 0.012 | 150 ms |

Accessibility, best practices and SEO are 100 across the site, and CLS is far
inside its budget. **Performance is 87–94 rather than the 95+ target**, and
Lighthouse's simulated LCP sits above 2.5s.

Measured on a real throttled connection (4x CPU, 1.6Mbps) rather than
Lighthouse's Lantern model, LCP on the home page is **1.2s** and the LCP
element is the hero photograph. The gap is the simulation modelling bandwidth
contention between the critical-path JavaScript and the image.

What moved the number, and what did not:

- **Subsetting the fonts** to the characters the site renders (171KB to 120KB)
  and **taking the italic faces off the preload list**: simulated LCP 4.0s to
  ~2.9s, performance +7. The largest single win.
- **Rewriting `Reveal` off the animation library** onto an IntersectionObserver
  and a CSS transition. It is used 40-odd times on the home page, and this is
  the change that keeps TBT under 300ms.
- **Marking the first service photograph `priority`.** Its LCP element was an
  unprioritised image at 2.9s on a real connection.
- **`m` + `LazyMotion` instead of `motion`.** Measured, and it made no
  difference: first load went 162KB to 163KB, because
  `optimizePackageImports` in `next.config.mjs` was already tree-shaking the
  library. The refactor is kept because it is the conventional shape and costs
  nothing, but it is not the lever an earlier draft of this README claimed.
  Loading the feature bundle through a dynamic import was tried too and was
  actively worse (185KB), since the async chunk duplicates the barrel the
  static imports already pull in.

What is left, honestly: the remaining weight is React plus the Next runtime
plus the animation core, and roughly 170KB of it sits ahead of the hero image.
Getting to 95 means cutting the animation library out of the shell entirely --
rebuilding the nav's scroll condense and the scroll progress bar on CSS
scroll-driven animations, and the action bar on an IntersectionObserver
sentinel. That is worth doing, but the nav condense is specified to be driven
by a motion value rather than a class swap, so it is a design decision as much
as a performance one and should be made deliberately rather than at the end of
a build.

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
