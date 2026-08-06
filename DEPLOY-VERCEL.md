# Deploying to Vercel

This folder is a complete Next.js 15 project. Vercel detects it automatically —
there is no `vercel.json` to write and no build command to configure.

## Quickest route (drag and drop)

1. `npm install` once locally, then `npm run build` to confirm it compiles.
   Then `npx next start -p 3100 &` and `npm run audit:content` — it fails while
   any client detail is still a placeholder, which is the one check worth
   running before every deploy.
2. Go to **vercel.com/new** and drag this folder onto the page, or run
   `npx vercel` from inside it and follow the prompts.
3. Add the environment variables below in **Project → Settings → Environment
   Variables**, then redeploy so the build picks them up.

## Via GitHub (better, gives you preview deployments)

```bash
git init && git add -A && git commit -m "The Paint Men"
git remote add origin https://github.com/<you>/<repo>
git push -u origin main
```

Then **vercel.com/new → Import Git Repository**. Every push to `main` ships to
production; every branch gets its own preview URL.

## Environment variables

Copy from `.env.example`. Nothing here is required to get the site *rendering* —
the pages build and deploy without any of it — but the quote and booking forms
cannot deliver email until Resend is configured.

| Variable                        | Needed for                        | If unset                                             |
| ------------------------------- | --------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_PHONE` / `_EMAIL`  | Every call and mailto link        | The page shows `{{PHONE}}` — `audit:content` fails    |
| `NEXT_PUBLIC_TOWN` / `_SERVICE_AREA` | Titles, headings, structured data | Shows the raw token — `audit:content` fails      |
| `NEXT_PUBLIC_YEARS`             | "N years on the tools" copy       | Shows the raw token — `audit:content` fails           |
| `NEXT_PUBLIC_MAP_ADDRESS`       | The Google Maps panel             | Panel lists the towns covered instead. Safe           |
| `NEXT_PUBLIC_INSTAGRAM_URL` / `_FACEBOOK_URL` | Social links       | Those links do not render at all. Safe                |
| `NEXT_PUBLIC_SITE_URL`          | Metadata, OG tags, `sitemap.xml`  | Falls back to `https://thepaintmen.com`               |
| `RESEND_API_KEY`                | Sending quote + booking emails    | Forms fail visibly and show the phone number instead   |
| `LEAD_TO_EMAIL`                 | Where enquiries land              | Falls back to `site.email`                            |
| `LEAD_FROM_EMAIL`               | Verified Resend sender            | Uses Resend's sandbox sender (owner's address only)    |
| `NEXT_PUBLIC_TAWK_PROPERTY_ID`  | Live chat                         | No chat launcher renders, no script loads             |
| `NEXT_PUBLIC_TAWK_WIDGET_ID`    | Live chat                         | As above                                              |

The three `NEXT_PUBLIC_*` values are inlined into the client bundle **at build
time**, so set them before the build that ships them. Changing one later needs a
redeploy, not just a save.

Set `NEXT_PUBLIC_SITE_URL` to the final public URL once the domain is attached,
then redeploy, so canonical tags and the sitemap resolve to the right host.

## Two things worth knowing

**Server actions.** The quote and booking forms are Next.js server actions, not
API routes. They run as serverless functions on Vercel with no configuration —
but they do mean this cannot be exported as a static site. Deploy it as a normal
Next.js project, not with `output: "export"`.

**Fonts are generated, not committed.** `scripts/setup-fonts.mjs` runs ahead of
`next build` and copies four woff2 files out of two pinned devDependencies into
`src/fonts`. Vercel installs devDependencies by default, so this just works. If
you ever set `NPM_CONFIG_PRODUCTION=true` or prune devDependencies, the build
will fail with a clear message from that script. The generated files are also
included in this folder, so a build works even offline.

## Railway is still supported

The `Dockerfile` and standalone output are untouched. `next.config.mjs` asks for
`output: "standalone"` only when `VERCEL` is not set, so the same source deploys
to either platform without a branch. See `README.md` for the Railway steps.

## After deploying

Point a custom domain at the project in **Settings → Domains**, then work
through `README.md` → *Swapping in the client's details*: `src/config/site.ts`
holds every placeholder token, and the three data files plus the blog posts are
what the client edits day to day.
