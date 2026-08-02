# The Workshop — what it does, and what it does not

The Workshop (`/lounge/website-designer`) is the part of Quooro where a
customer builds and publishes a website. This is the honest state of it.

## The publish path

A published site is a set of static files compiled by the `deploy-site`
edge function and uploaded to Cloudflare R2 (when the customer's Cloudflare
credentials are on file) or Supabase Storage. Every publish is a numbered
version with its own storage path, so nothing overwrites the last one.

```
pages (JSON)  ->  deploy-site  ->  index.html, <slug>.html, 404.html
                                   styles.css, script.js
                                   sitemap.xml, robots.txt
                                   -> R2 or Supabase Storage
                                   -> site_deployments row (status: live)
                                   -> designer_sites.published_at / published_url
```

The address a page is compiled against, in priority order:

1. a verified custom domain on `site_domains`
2. `<subdomain>.<the customer's Cloudflare domain>`
3. the raw R2 or Supabase Storage path

This is resolved *before* compiling, because the canonical tag, the social
cards and the sitemap all have to name the address the site will answer on.

## Form submissions

Forms used to be decorative — the builder let you choose a delivery method
and write a success message, but nothing was wired up. They now work
end to end.

```
visitor fills a form on the published site
  -> script.js POSTs to /functions/v1/site-form-submit
  -> the function checks: site exists, site is published, not flooded
  -> row in site_form_submissions
  -> (optional) relayed to settings.form_webhook_url
  -> read in the Workshop under "Form submissions"
```

Notes that matter:

- The endpoint is public (`verify_jwt = false`) because a visitor on the
  customer's own domain has no Quooro session. What stands in for auth is
  that the site must exist and be published, plus a per-site, per-address
  flood limit of 12 in 10 minutes.
- `site_form_submissions` has **no INSERT policy**. Writes come only from
  the edge function under the service role. The public key cannot write to
  it directly.
- Fields are keyed by the visible label, so the inbox reads the way the
  form looks.
- The honeypot field is positioned off-screen rather than `display: none`,
  which some bots skip. A filled honeypot gets a cheerful success response
  and is silently dropped.
- IP addresses are never stored. A per-site salted digest is kept instead —
  enough to spot a flood, useless for tracking somebody across two sites.

## What was broken and is now fixed

| | Before | Now |
|---|---|---|
| Forms | Nothing was wired up | Captured, stored, readable, exportable |
| `#pricing` links | Rewritten to `pricing.html`, breaking every in-page anchor | The page list decides: real slugs navigate, anything else stays an anchor |
| Smooth scrolling | Could never fire — its targets had been rewritten away | Works |
| `alt` / `src` / `placeholder` | Injected raw; a quote broke the tag | Escaped, including single quotes |
| `javascript:` URLs | Passed straight through | Stripped; `data:` allowed for images only |
| Social sharing | No Open Graph or Twitter tags | Full card, with the image made absolute |
| Google | No sitemap, no robots.txt, no canonical | All three, with `noindex` pages excluded |
| A bad URL | Whatever the host served | A designed 404 page |
| `designer_sites.published_at` | Never set by a publish | Stamped on every publish |

## What is still not done

Stated plainly so nobody assumes otherwise:

- **Rollback is a database flip, not a re-upload.** `useSitePublish.rollback`
  changes which `site_deployments` row is marked live. On a bare storage URL
  that changes the address the dashboard shows. On a custom domain pointed
  at a fixed path, it will not change what is actually served until the
  deployment is re-uploaded to that path.
- **Custom domain verification is manual.** `addCustomDomain` writes the DNS
  instructions and leaves the row `pending_dns`. Nothing polls DNS or flips
  it to verified — that is still a person's job.
- **No image optimisation.** Images are referenced at whatever URL they were
  given; nothing is resized, re-encoded or served responsively.
- **No CSS or JS minification** in the compiled output.
- **`select` and checkbox groups** have no tag mapping in the compiler, so
  they render as `div`. Text, email, textarea and the standard inputs work.
- **The email delivery method** in the forms builder is not wired. Submissions
  are stored and can be relayed to a webhook; they are not emailed.

## Verifying changes to the compiler

The compiler is pure and can be exercised without Deno. Two suites exist:

- **`test-compiler.mjs`** — strips the Deno bits, transpiles, and asserts on
  the generated HTML, sitemap, robots and 404 (40 assertions).
- **`test-published-site.mjs`** — compiles a site, serves it, and drives it
  in Chromium: submits a form, checks the honeypot, forces a rate-limit
  error, and confirms in-page anchors scroll (16 assertions).

Run both after any change to `deploy-site/index.ts`.
