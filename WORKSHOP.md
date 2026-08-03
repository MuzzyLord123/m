# The Workshop — what it does, and what it does not

The Workshop (`/lounge/website-designer`) is the part of Quooro where a
customer builds and publishes a website. This is the honest state of it.

## One compiler

The editor and the publish path run the **same** code, in
`supabase/functions/_shared/site/`. They used to run two different
compilers, and the weaker one ran on publish: 75 of the 102 element types -
accordions, tabs, carousels, pricing cards, timelines, social icons -
rendered correctly in your exported code and came out as empty `<div>`s on
the site that actually went live.

The editor reaches it through the `@site` alias; `deploy-site` imports it
relatively. There is no second implementation to drift.

## The publish path

A published site is a set of static files compiled by the `deploy-site`
edge function and uploaded to Cloudflare R2 (when the customer's Cloudflare
credentials are on file) or Supabase Storage. Every publish is a numbered
version with its own storage path, so nothing overwrites the last one.

```
pages (JSON)  ->  deploy-site  ->  index.html, <slug>.html, 404.html
                                   styles.css, script.js   (both minified)
                                   sitemap.xml, robots.txt
                                   -> sites/<id>/v<N>/    the archive
                                   -> sites/<id>/live/    what the address serves
                                   -> site_deployments row (status: live)
                                   -> designer_sites.published_at / published_url
```

Every publish writes twice: once to the version's own archive, once to the
live path. That is what makes rollback real — see below.

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
  -> emailed to the owner (or settings.form_notify_email)
  -> (optional) relayed to settings.form_webhook_url
  -> read in the Workshop under "Form submissions"
```

Text, email, textarea, dropdowns, tick-box groups and radio groups all work.
Multi-answer groups arrive as one labelled answer ("Extras: Bara brith,
Welsh cakes"). Both relays are best effort on purpose: the row is stored
first, so a broken webhook or a Resend outage cannot cost an enquiry or
show the visitor an error.

Email needs `RESEND_API_KEY` set on the project. Without it the relay is
skipped with a log line — submissions are still stored and readable.
Set `settings.form_notify_email` to an address to override the recipient,
or to `false` to turn the emails off.

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
| Dropdowns, tick boxes, radios | Rendered as empty `div`; answers lost | Real controls, answers captured under their labels |
| Rollback | Flipped a database row; could still serve the broken site | Re-uploads that version's files to the live path |
| Custom domains | Left `pending_dns` for ever; nothing ever checked | Resolved over DNS-over-HTTPS on demand |
| Submission emails | Not wired | Sent, with reply-to set to the enquirer |
| CSS / JS | Shipped unminified | Minified (quote- and selector-aware) |
| Images | No dimensions; the page jumped as they loaded | `width`/`height` emitted when known |
| Rich elements | 75 of 102 types published as an empty `div` | One shared compiler; the published site is the exported site |
| Charts | A styled empty box on the live page | Inline SVG, plus the figures as a table |
| Class names | `h1-h1`, `nav-nav1` — a machine stamp | The name you gave the element: `.site-header`, `.hero` |
| Submit buttons | `type="button"` — every exported form was dead on click | `type="submit"` inside a form |
| Product descriptions | Invented marketing copy published onto real shops | Blank until somebody writes one |
| HTML | Shipped unminified | Minified between block tags only — inline spacing is never welded |
| The hero image | Lazy-loaded, delaying the paint people wait for | First image eager and high priority; the rest lazy |
| A pending domain | Checked only if you thought to press the button | Re-checked every two minutes while the panel is open |

## Rollback

`rollback-site` copies the chosen version's files from `sites/<id>/v<N>/`
back over `sites/<id>/live/`, and only updates the database once the files
are actually in place. If a version predates versioned archives, it refuses
and says so rather than reporting a success that did not happen.

## Custom domains

`verify-site-domain` resolves the domain over DNS-over-HTTPS and marks it
verified only when a record genuinely matches. The TXT token is the gate,
because it proves control; the CNAME is reported but not required, since it
may legitimately be proxied or flattened to an A record. A failure names the
record that is wrong and what was found instead.

Verification is on demand — the customer presses "I've added these — check
now". Nothing polls in the background.

## What is still not done

Stated plainly so nobody assumes otherwise:

- **No image derivatives.** Images are served at whatever URL they were
  given. The first image on a page is fetched eagerly at high priority and
  the rest are lazy, and dimensions are emitted so the page does not jump —
  but nothing is resized or re-encoded, so there is no `srcset`. Doing that
  properly needs an image pipeline (a transform service or a build step),
  not a change to the compiler.
- **DNS re-checks only while the publish panel is open.** A pending domain
  is re-checked every two minutes while you are looking at it, and stops
  when the tab is hidden. There is no server-side cron, so a domain that
  propagates overnight verifies the next time you open the panel.
- **The deep panels** — Animation, Interactions, CMS — use the studio
  palette and have had their decorative tints removed, but their layout has
  not been re-composed the way the style panel was. They work; they are
  denser than they need to be.

## What exported code looks like

Class names come from what you named the element, so an element called
"Site header" becomes `.site-header` with no id fragment appended. Two
elements sharing a name deliberately share a class — that is what a class is
for. Only unnamed elements get a short stable suffix.

The zip carries a README that says what each file is, how class names work,
where forms post and how to repoint them. It is written for whoever opens
the zip in two years, not as a placeholder.
