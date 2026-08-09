# Automatic website updates

The site is a Vite build. `vercel.json` pins the framework, build command
and output directory, and carries the SPA rewrite, cache headers and
security headers, so the host has nothing to guess.

## Recommended: let Vercel watch the repo (zero config)

1. [vercel.com](https://vercel.com) → **Add New… → Project** → import
   `muzzylord123/quooro`.
2. Leave every setting alone. `vercel.json` already declares framework
   `vite`, build `npm run build`, output `dist`, and `package.json` pins
   Node 20 — the same version the CI build has been green on.
3. **Deploy.**

Every `git push` to `main` now rebuilds and republishes on its own. Pull
requests get their own preview URL. Nothing else to wire up.

Netlify works the same way (`netlify.toml` is already correct).

## Environment variables

`.env` is committed and holds only the Supabase **project id, URL and
publishable (anon) key**. Those are public by design — they ship inside
the JavaScript bundle either way, and Row Level Security is what
actually protects the data. There is no service-role key in the repo,
and there must never be one: it bypasses RLS entirely.

Because they are committed, **a fresh Vercel import needs no environment
variables at all.** It will build and run as-is.

If you would rather not commit them, delete `.env`, run
`git rm --cached .env`, and set all **three** `VITE_…` variables in the
Vercel/Netlify dashboard instead. All three, not two: `PROJECT_ID` is
read independently by the booking API panel and the products panel, so
setting only the URL and key leaves those two screens pointed at
whichever project the old file named. Dashboard values override the
committed file, so keys can also be rotated there without touching git.

> **This page used to say the wrong thing here.** It claimed a build
> without those variables "fails loudly". It did not. Vite never
> evaluates app modules while bundling, so the missing values were
> inlined as the string `undefined`, the deploy went **green**, and the
> site then white-screened on every route — empty `#root`, one console
> error, and nothing whatsoever in the build log. `vite.config.ts` now
> asserts all three at the start of a production build, so that failure
> mode is gone: the build stops and names what is missing, the deploy
> goes red, and the previous version keeps serving.

## Security headers, and the two deliberate exceptions

The site-wide rule in `vercel.json` is strict: `frame-ancestors 'self'`,
`X-Frame-Options: SAMEORIGIN`, a locked-down CSP. Two paths are carved
out with a negative-lookahead source so no path ever receives two
conflicting rules:

- **`/book/*`** — the booking page is a product surface customers paste
  into *their own* sites. Being framed is the feature, so it serves
  `frame-ancestors https:` instead.
- **`/booking-embed.js`** — the embed loader is fetched cross-origin by
  those same customer sites, so it serves
  `Cross-Origin-Resource-Policy: cross-origin`.

`Cross-Origin-Embedder-Policy` was removed: nothing in the app uses
`SharedArrayBuffer` or any other cross-origin-isolated API, so it bought
nothing and risked blocking legitimate cross-origin frames. `COOP` is
`same-origin-allow-popups` so the Google sign-in popup can talk back.
`js.stripe.com` and `checkout.stripe.com` are allowed in `script-src`,
`frame-src` and `form-action` so storefront checkout can complete.

If you change the CSP, change it in **both** places: the header in
`vercel.json` and the `<meta http-equiv>` in `index.html`. The meta tag
is what applies to a local `vite preview`, where no host is adding
headers. (Browsers ignore `frame-ancestors` in a meta tag — that
directive only works as a real header.)

## What deploying does NOT touch

The agent mesh, Jarvis, the fleet router, the CRUD tool layer, the
storefront embed and every edge function live in Supabase and are
**already live**. Deploying the site only updates the screens. The two
move independently — you can redeploy the site with no risk to the
running office.

One thing to set on the Supabase side once the site has a real domain:
`SITE_URL` in **Edge Functions → Secrets**. The storefront's checkout
hand-off falls back to `https://quooro.com` when it is unset, so the
`/pay/:id` link a customer follows must point at the origin you actually
deployed.

## The workflows in `.github/workflows`

- **ci.yml** (`build`) — on every push and PR: `npm ci`, a typecheck,
  `npm run build`, and uploads `dist` as an artifact. No secrets; catches
  a broken or mistyped commit before it can reach the site.

  The typecheck step runs `npm run typecheck`, which is **`tsc -b`**, and
  the `-b` is doing real work. `tsconfig.json` is `"files": []` plus
  project references, so a plain `tsc --noEmit` walks nothing, exits 0 in
  under a second, and waves through a file containing a deliberate type
  error. This step was that no-op for exactly one commit. If you change
  it, keep the `-b`, and prove the gate still bites by pushing a
  deliberate error once and watching it go red.
- **deploy.yml** (`deploy`) — optional Actions-based deploy, and skipped
  unless you set the repo **variable** `DEPLOY_VIA_ACTIONS=true` (a
  Variable, not a Secret — the comparison is against `vars`) plus the
  secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
  **Not needed if you used the Vercel integration above**, and it is the
  weaker option: it only ever deploys straight to production, with no
  preview URLs and no one-click rollback.

## The site-builder checkout, and what was wrong with it

There are two checkout paths, and they are separate systems:

- **The merchant app / storefront embed** — `store-checkout` →
  `/pay/:id`, writing to `ecommerce_orders`. This is the one the
  E-commerce section of the Lounge uses.
- **The site builder** — `create-product-checkout`, used by the
  Designer's Products panel "Buy Now" snippet and by the storefront
  preview, writing to `site_orders`.

The second one had never taken a payment. Three faults, stacked:

1. It read products from a `products` table. The Designer writes them to
   `site_products`. So it threw `Products not found` and returned 500
   before it ever reached Stripe.
2. Its `site_orders` insert supplied no `user_id` — a `NOT NULL` column —
   and the insert's error was never read. Had it got that far, the buyer
   would have been handed a Stripe URL for an order that was never
   recorded.
3. Its `success_url` pointed at `/checkout-success`, which was not a
   route, on `req.headers.origin` — which for an embedded Buy Now button
   is *the customer's own website*, not ours.

All three are fixed. Products are read from `site_products` **scoped by
`site_id`** (without that scope a caller could name any product id in
the database and buy another merchant's stock at their price); the order
is recorded with the site owner's `user_id` and the request fails rather
than return a payment URL if that insert fails; and `success_url` is
`SITE_URL` + `/checkout-success?session_id=…`, which is now a real route
that confirms the charge against Stripe server-side before showing a
receipt. `site_orders.customer_email` was relaxed to nullable, because
the order row is written before Stripe has collected an email; it is
backfilled on verification.

Still worth knowing: `site_orders` and `ecommerce_orders` remain two
separate tables with two separate shapes, and the Lounge's Orders screen
reads the latter. Site-builder orders are therefore not visible in the
E-commerce app. Unifying them is a real piece of work and has not been
done.

Also unwired: `StorefrontProvider` in `src/contexts/StorefrontContext.tsx`
is defined but rendered by nothing, so its `checkout()` is currently dead
code. The live caller of `create-product-checkout` is the copy-paste Buy
Now snippet from the Designer's Products panel.

## Storefront customer accounts

`site-visitor-auth` backs sign-up and sign-in for shoppers on a
merchant's site. It had four faults at once and had never worked:
`site_visitor_sessions` did not exist and the insert's error was never
read (so a token was returned that referred to nothing, and the shopper
was silently signed out on the next page load); the sign-up insert named
`name` and `status` on `site_visitors`, which has `full_name` and no
`status` column at all; and `verify` called `req.json()` a second time,
which always throws because a request body cannot be read twice.

All fixed, and the password scheme was replaced while the table was still
empty. It had been one unsalted SHA-256 of `password + site_id` — fast by
design, when a password hash wants the opposite, and salted per *site*,
so two shoppers on one store who chose the same password stored identical
hashes. It is now PBKDF2-SHA256, per-user random salt, 210k iterations,
compared in constant time, with the cost stored in the hash string so it
can be raised later without invalidating existing rows.

`site_business_settings` was missing too. `site-booking` reads opening
hours from it behind `|| default`, so every store silently served
09:00–17:00 Mon–Fri in 60-minute slots regardless of configuration. The
table now carries exactly the four fields that function reads, defaulted
to the values it was already falling back to.

**The lesson worth keeping:** four of these six tables were lost in the
same migration, and every one of them failed *silently* because the
calling code either ignored the error or had a `|| default` behind it. If
you add a query, read its error. `supabase.from('x')` against a table
that is not there does not crash the app; it just quietly does nothing
forever.
