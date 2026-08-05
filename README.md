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
