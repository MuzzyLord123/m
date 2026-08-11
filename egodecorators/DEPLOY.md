# Deploying egodecorators.com

Two bundles are provided. They are the same site, built two ways.

| | `source/` | `static/` |
|---|---|---|
| What it is | The project. Build it on the host. | Plain files, already built. |
| Where it runs | Vercel, Netlify, Cloudflare, any Node host | Any web host at all, including cPanel |
| Redirects | Native, from `next.config.mjs` | `.htaccess` / `_redirects`, generated |
| Images | Resized and served as AVIF automatically | Served as uploaded |
| Enquiry form | Works, once switched on | **Never** — no server to receive it |

**Take `source/` unless you have a reason not to.** It is the real thing: image
optimisation, and a route to a working contact form later. `static/` exists so
the site can go live on whatever hosting the WordPress site is on today, without
waiting for anyone to set up an account anywhere.

Either way, read `source/MIGRATION.md` before pointing DNS. It has the cutover
order and the checks, and there is one job in it — exporting the WordPress media
library at full resolution — that cannot be done after the old hosting lapses.

---

## Option A — `source/` (recommended)

### Vercel, from the Git repository — easiest thing on this page

The project already lives in a repository, so there is nothing to upload:

1. Vercel → **Add New… → Project → Import Git Repository** → `MuzzyLord123/m`.
2. **Root Directory: `egodecorators`.** This is the one setting that matters —
   the repository holds several sites and Vercel needs pointing at this one.
   It will detect Next.js by itself.
3. Deploy. Then add the domain and follow `MIGRATION.md §5`.

Redirects, headers and image optimisation all come from `next.config.mjs`.
Nothing else to configure.

### Vercel or Netlify, from the folder

Push `source/` to a repository, or drag **the `source/` folder itself** in.
Framework preset **Next.js**, build command `npm run build`, no output directory.

> Do not drag the whole unzipped folder in. Vercel looks for a site at the top
> level of whatever it is given, and the top level of that folder is this file
> plus two directories — so it reports "No root page" and nothing loads.

### Any Node host

```bash
npm install
npm run build
npm start          # listens on 3000; put nginx or the host's proxy in front
```

Node 20 or newer.

---

## Option B — `static/` (shared hosting, cPanel, or a bucket)

Upload the **contents** of `static/` to the web root — usually `public_html`.
Not the `static` folder itself: `index.html` has to end up at the top level, or
the host has no page to serve at `/`.

Include the dotfiles. `.htaccess` is what makes the redirects work and most file
managers hide it by default.

- **Apache / cPanel** — `.htaccess` is read automatically. It needs
  `mod_rewrite`, which is on almost everywhere. It also sets the security
  headers, the cache lifetimes, and the content type for the sharing image.
- **Netlify / Cloudflare Pages** — `_redirects` and `_headers` are read
  automatically. Drag the folder in; there is no build step.
- **Vercel, as static files** — reads `vercel.json`, and neither of the other
  two. It carries the same redirects, plus `cleanUrls` so `/repairs` serves
  `repairs.html`. Without that file Vercel would serve the pages and silently
  drop every redirect: the site would look perfectly fine and the whole
  migration would be gone.
- **nginx, S3, or anything else** — none of those files are read. Translate the
  rules yourself: every line in `_redirects` is `from  to  301`, and the list is
  short.

### What you give up

- **The enquiry form can never work.** There is no server to receive it. The
  form is switched off in this build anyway, so the page shows the phone number
  and the email address — but on static hosting that is permanent.
- **No image optimisation.** Photographs are served exactly as uploaded, at the
  size they were uploaded. Resize the originals to about 2400px on the long edge
  and save them as JPEG at around 80% before they go in, or the comparisons will
  be several megabytes each on a phone.

### If the redirects change

They are generated, never hand-written — one source of truth in
`next.config.mjs`, so the site and the host config cannot drift apart:

```bash
cd source
npm install
npm run build:static      # writes out/, then .htaccess, _redirects and _headers
```

Then upload `out/` again.

---

## Before you point DNS at either one

Full list in `source/MIGRATION.md`. The three that bite:

1. **Export the WordPress media library at original resolution.** Those
   photographs are the only thing on the old site worth keeping and they are
   gone when the hosting lapses. This is the top item in `CONTENT-NEEDED.md`.
2. **Copy the Google Search Console verification token** out of the old site's
   `<head>` first, or you lose Search Console access and the history with it.
3. **Leave the WordPress hosting running for 30 days** after cutover. It costs a
   few pounds and it is the only way back.

## The site is not finished being filled in

`npm run check:launch` currently fails, on purpose. Ten things are outstanding
and every one of them needs Ted, not a developer — the before-and-after
photographs above all, then the four review quotes, the founding year and who is
on the team. Where a fact is missing the page says so in a labelled frame rather
than inventing something to fill the space.

The site is perfectly safe to put live in this state: nothing is broken and
nothing is a lie. It is just quieter than it will be once the photographs are in.
