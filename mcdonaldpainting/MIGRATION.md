# Migration — WordPress to this build

The site being replaced has been up for years, ranks for local decorating searches, and has a
verified Google Search Console property. Everything below exists so none of that is thrown away
on cutover day.

Read the whole thing before touching DNS. There are three mistakes that cannot be quietly undone:
**changing the canonical host**, **losing Search Console**, and **switching the old site off before
the media library is out of it**. All three are avoidable and all three are on the checklist.

---

## 1. Before you start

- [ ] **Get read access to the live site.** An admin login, or just permission to crawl it.
      This is blocking, and it is the first item in `CONTENT-NEEDED.md`.

      > **Say this plainly: the crawl has not been run.** The environment this site was built in
      > has no route out to the public internet, so `mcdonaldpaintingcontractors.co.uk` could not
      > be fetched. The redirect map in §2 is built from the live navigation, the body copy and
      > the brief. It covers every URL anybody has told us about, plus the WordPress furniture
      > that exists on every install of that age. It is not a substitute for a crawl. An old
      > WordPress site always has more URLs than its menu shows.

- [ ] **Crawl it and export the full URL list.** Screaming Frog's free tier does 500 URLs, which
      is more than enough. Diff that list against §2 and add anything missing to
      `KNOWN_PAGES` in `next.config.mjs`.
- [ ] **Export Search Console data** — Performance report, last 16 months, as CSV. You want a
      before-and-after baseline, and the export is gone once the property changes.
- [ ] **Export the WordPress media library at full resolution.** Tools → Export will not do it;
      take the `wp-content/uploads` directory, or use a media export plugin. Do not save images
      off the live site — WordPress serves resized, re-encoded copies and this design runs
      photographs full width.
- [ ] **Note the current `title` and `meta description` of every page**, so you can see what
      changed if rankings move.
- [ ] **Check which host the live site canonicalises to** — `www.` or the bare domain — and which
      one is verified in Search Console. See §3.
- [ ] **Confirm the email address** (`CONTENT-NEEDED.md`). If mail is moving domain, that is a DNS
      change of its own and it does not want to happen on the same afternoon as the website.
- [ ] `npm run check:launch` passes. It will not today — that is the point of it.

---

## 2. Redirect map

Implemented in `next.config.mjs`. All permanent (**301**, not 308 — Google treats them the same,
but 301 is what fifteen years of tooling on the other end of those links expects).

### Pages that exist today

| Old URL                                    | New URL              | Why |
| ------------------------------------------ | -------------------- | --- |
| `/about-mcdonald-painting-contractors/`     | `/about`             | Same page, shorter address |
| `/projects-gallery/`                        | `/projects`          | Gallery becomes site records |
| `/health-safety/`                           | `/compliance`        | Same subject, properly written |
| `/testimonials/`                            | `/about#testimonials`| Folded into About |
| `/faq/`                                     | `/capabilities`      | Answers written where the question arises |
| `/contact-us/`                              | `/contact`           | Same page |
| `/home-m-r-painting-contractors/`           | `/about`             | Stranded page from the previous trading name |

### The blog

Retired (§4). Every post goes to `/sectors/residential`, because the archive is domestic
decorating content — the most recent post is about Dulux's 2020 colour of the year and hallways.
The index goes to `/capabilities`.

If the crawl turns up a post that is genuinely about commercial work, add it to `BLOG_POSTS` in
`next.config.mjs` with a better destination. A per-post redirect always beats the catch-all.

### WordPress furniture

`/category/*`, `/tag/*`, `/author/*`, date archives (`/2020/01/15/...`), `/feed`, `/comments/feed`.
These exist on every WordPress install whether or not anybody linked them, and they are indexed
more often than people expect.

### Two rules the map follows

1. **Nothing is blanket-redirected to `/`.** Google treats a mass redirect to the home page as a
   soft 404 and the link equity evaporates. Every old URL goes to the page that answers the same
   question.
2. **One hop, not two.** The old URLs all end in a trailing slash. Next.js would normally answer
   `/health-safety/` with a 308 to `/health-safety` and only then run the 301 — two redirects for
   every inbound link the site has. `skipTrailingSlashRedirect` is on and the map carries both
   forms of every source, so every legacy URL resolves in a single 301. There is a catch-all at
   the end of the map that strips a trailing slash from anything not otherwise listed, so nothing
   404s because of a slash.

### Verifying the map

With the new site running (`npm run build && npm start`):

```bash
for p in /about-mcdonald-painting-contractors/ /projects-gallery/ /health-safety/ \
         /testimonials/ /faq/ /contact-us/ /home-m-r-painting-contractors/ \
         /blog/ /category/decorating/ /2020/01/15/a-post/ /feed/; do
  printf '%-46s' "$p"
  curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}\n' "http://localhost:3000$p"
done
```

Every line should read `301` and land on a real page. Anything that reads `308`, `404` or points
at `/` is a bug in the map.

---

## 3. The canonical host, and Search Console

### The host

`content/site.ts` sets `site.url`. **It must match whatever the live site canonicalises to today.**

Read it before you change anything:

```bash
curl -sI https://mcdonaldpaintingcontractors.co.uk/ | grep -i location
curl -s  https://mcdonaldpaintingcontractors.co.uk/ | grep -i 'rel="canonical"'
```

Then set `site.url` to match — or set `NEXT_PUBLIC_SITE_URL` in the host's dashboard, which
overrides it without a code change.

Do not switch apex ↔ www because one looks tidier. On a site with existing rankings that is a
re-index, not a preference, and the recovery takes months.

### Search Console

The verification token from the current site's `<head>` is already carried across — it is in
`content/site.ts` as `googleSiteVerification` and rendered by `src/app/layout.tsx`:

```
VOUd_RzPODzRYTEbDIRNHrRsHL3YzQ_60S4styu_3f4
```

**Leave it there.** Removing it before the property is re-verified by another method loses access
to the site's entire search history.

After cutover:

1. Confirm the property still verifies in Search Console.
2. Submit the new sitemap: `https://<canonical host>/sitemap.xml`.
3. Use **Removals → Outdated content** only for URLs that genuinely no longer exist. Everything in
   §2 redirects, so it should not be needed.
4. Watch **Pages → Not indexed** for the first fortnight. Anything appearing as "Not found (404)"
   is a URL missing from the redirect map — add it and redeploy.

---

## 4. Content that does not come across

- **The blog.** All of it. See §2.
- **The `mandr` social links.** The body copy links to the old M & R Painting Contractors
  Instagram and Facebook while the header links to the correct accounts. Only the correct ones are
  on the new site and only they are in the structured data.
  **Before anything is deleted at the other end**, check whether those accounts hold photographs
  that are not saved anywhere else. See `CONTENT-NEEDED.md`.
- **"With a smile", "high quality", and the keyword-stuffed copy.** Deliberately not carried
  across. `npm run check:content` fails the build if any of it is reintroduced.
- **The MasterSlider plugin.** Gone with WordPress.

---

## 5. Photographs

The single highest-value thing to recover before switch-off.

1. Export `wp-content/uploads` at original resolution.
2. Pull the best job photography off the Instagram account — but treat it as a **reference list,
   not a source**. Instagram crops and re-encodes; get the originals from Sean's phone.
3. Watch the permission trail. At least one Instagram post credits a client account
   (`@whitefeather.home`). If an image was supplied by a client, it needs their permission to be
   republished, and the credit goes in the record's `image.credit` field so it is printed under
   the photograph.
4. Drop files into `public/photographs/<job-name>/` and fill in `src`, `alt`, `width` and `height`
   in the matching `content/projects/*.mdx`. `width` and `height` are the file's real pixel
   dimensions — get them wrong and the page moves while it loads.

Until a photograph arrives, its slot renders as a labelled frame stating what belongs there. That
is intentional and it is better than a stock photograph, which this site does not use anywhere.

---

## 6. Cutover, in order

Do this on a weekday morning, not on a Friday afternoon.

1. **Deploy to the host and test on its preview URL.** Every page, the enquiry form, and the
   capability statement download.
2. **Set the environment variables** (`.env.example` lists them). `NEXT_PUBLIC_SITE_URL` is the
   one that matters — without it, canonical tags, the sitemap and the structured data all point
   at localhost.
3. **Lower the DNS TTL on the current records to 300 seconds**, at least an hour before you
   intend to switch. This is what lets you go back quickly.
4. **Check the MX records and write them down.** If mail is on the same domain, it must not move
   when the website does. This is the step people forget.
5. **Point the A/CNAME record at the new host.** Leave the MX records alone.
6. **Immediately after propagation**, walk the redirect list in §2 against the live domain.
7. **Submit the sitemap** in Search Console.
8. **Leave the WordPress install running but unlinked for 30 days.** It costs nothing and it is
   the only way back if something was missed.
9. **Put the DNS TTL back up** after a week of no surprises.

### Rolling back

Point the A/CNAME record back at the old host. With a 300-second TTL that is a five-minute
operation. This is the entire reason for steps 3 and 8.

---

## 7. After cutover

- [ ] **Google Business Profile.** Confirm it exists and who controls it. If an agency set it up,
      get it transferred rather than creating a second one — duplicates split the reviews and are
      a nuisance to merge. Add **commercial painting** and **industrial painting** to the
      categories; at the moment it will be pointed at painter-and-decorator searches only.
- [ ] **GA4.** Set `NEXT_PUBLIC_GA_ID` and confirm the two events that matter are arriving:
      `capability_statement_download` and `enquiry_type_selected`. Those two tell Sean whether the
      site is doing its job; pageviews do not.
- [ ] **Enquiry delivery.** Set `ENQUIRY_WEBHOOK_URL`. Until it is set, enquiries are written to
      the server log only — they are not lost, but nobody is being told about them.
- [ ] **Re-run Lighthouse on the live domain** and keep the numbers next to the ones in `PITCH.md`.
- [ ] **Check the 404 report weekly for a month.** Every 404 is a URL missing from §2.
