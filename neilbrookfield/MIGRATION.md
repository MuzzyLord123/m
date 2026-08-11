# Migration — Wix to this build

This is a rebuild of a live site that has been up for years and ranks for `decorator Chester`.
Everything below exists to make sure none of that is thrown away on cutover day.

Read the whole thing before you touch DNS. The two irreversible mistakes are **flipping the canonical
host** and **losing Search Console**, and both are avoidable.

---

## 1. Before you start

- [ ] `npm run check:launch` passes. It will not, today — see `CONTENT-NEEDED.md`.
- [ ] Neil has confirmed his mobile number **out loud**, and someone has dialled the link on a real
      phone. The old site displayed `07944512946` and linked `tel:0794451946` — two digits short.
      Every mobile visitor who tapped it failed to get through.
- [ ] The photographs have been exported from the **Wix media manager at original resolution**. Do
      not save them off the live site: `wixstatic.com` serves cropped, resized, re-encoded copies,
      and this design runs them full width.
- [ ] Crawl the live Wix site and export the full URL list (Screaming Frog free tier does 500 URLs,
      which is more than enough). The redirect map below covers the four known pages; the crawl is
      how you find anything else that ever existed.
- [ ] Export the current Search Console data — Performance report, last 16 months, as CSV. You want a
      before-and-after baseline, and the export is gone once the property changes.
- [ ] Note the current live `title` and `meta description` for each page, so you can see what changed
      if rankings move.

---

## 2. Redirect map

Implemented in `next.config.mjs`. All permanent (301).

| Old (Wix)                     | New          |
| ----------------------------- | ------------ |
| `/about-neil`                 | `/about`     |
| `/portfolio`                  | `/work`      |
| `/home-decor-workshop-lessons`| `/workshops` |
| `/contact-me`                 | `/contact`   |

Add any further URLs the crawl turns up to `WIX_REDIRECTS` at the top of `next.config.mjs`. If an old
page has no obvious equivalent, send it to the closest **relevant** page — never blanket-redirect
everything to the home page, which Google treats as a soft 404.

### Canonical host

`https://www.neilbrookfield.co.uk` — **www, with https**. This is what the current site canonicalises
to, and it is what the existing links and rankings point at.

Do not switch to the apex "because it looks cleaner". Changing the canonical host on a site with
fifteen years of history means every external link takes an extra hop and the whole site is
re-evaluated. There is no upside.

The apex is redirected to www in two places, deliberately:

1. At the host/CDN edge — configure this, it is the one that matters.
2. In `next.config.mjs`, as a fallback if apex traffic reaches the app.

---

## 3. Search Console — do this before DNS moves

The verification token from the Wix site is already in the `<head>` of every page of this build, set
in `content/site.ts`:

```
google-site-verification: IQTIQM2cKMZBMAqGucesXYcbBYO1Z6HquKUwQgMLfnI
```

Confirm it is actually rendering on the new site before cutover:

```bash
curl -s https://<staging-url>/ | grep google-site-verification
```

If that token is missing when DNS moves, verification breaks, and you lose access to the property at
exactly the moment you most need to watch it.

Also do:

- [ ] Add a **Domain property** in Search Console (DNS TXT record) as well as the URL prefix
      property. Domain properties survive protocol and subdomain changes; URL-prefix ones do not.
- [ ] Keep the Wix property in place. Do not delete it.

---

## 4. Cutover order

Do this on a weekday morning, not a Friday afternoon.

1. **Deploy to production hosting** with the real domain not yet pointed at it. Test on the
   platform-issued URL.
2. **Lower the DNS TTL** on the existing records to 300 seconds, at least 24 hours ahead. This is the
   step people skip and then wait eight hours to fix a typo.
3. **Verify on staging:**
   - [ ] `curl -sI https://<staging>/about-neil` returns `301` to `/about`
   - [ ] same for `/portfolio`, `/home-decor-workshop-lessons`, `/contact-me`
   - [ ] the verification meta tag is present
   - [ ] the phone link is `tel:+447944512946` and the visible number matches it
   - [ ] `/sitemap.xml` and `/robots.txt` resolve
   - [ ] no `format-detection: telephone=no` anywhere (Wix set this; it disabled tap-to-call)
4. **Point DNS at the new host.** A record / CNAME per the host's instructions, plus the apex
   redirect.
5. **Wait for TLS** to issue on both apex and www before announcing anything.
6. **Re-check the redirects on the real domain.** They behave differently once the CDN is in front.
7. **Submit `https://www.neilbrookfield.co.uk/sitemap.xml`** in Search Console.
8. **Request indexing** for `/`, `/hand-painted-kitchens` and `/work` by hand. The rest will follow.
9. **Restore the DNS TTL** to something sensible (3600+).

Leave the Wix subscription running for at least a month. It costs one month's fee and it is your only
way back if something is badly wrong.

---

## 5. After cutover — what to watch

**Days 1–3**

- [ ] Search Console → Pages: crawl errors, and that the four old URLs report as redirects rather
      than 404s.
- [ ] Ring the number from the site on an iPhone and an Android handset. This is the fix that matters
      most and it is the one nobody tests.
- [ ] Submit the form from a phone, with a photograph attached, and confirm it arrives wherever
      `deliverEnquiry()` sends it.

**Weeks 1–4**

- [ ] Search Console → Performance: `decorator Chester` and related queries. A dip in the first two
      weeks is normal; a dip still there at six weeks is not.
- [ ] Check the new hand-painted-kitchen pages start appearing for kitchen queries — that is the
      higher-value traffic this rebuild is aimed at, and it is new ground rather than something being
      protected.
- [ ] Confirm the Google Business Profile links to `https://www.neilbrookfield.co.uk` (with www).

**Do not**, in the first six weeks: change the canonical host, rename routes, or remove redirects.

---

## 6. What was deliberately not carried across

- **`format-detection: telephone=no`** — inherited from Wix. It stops phone numbers being tappable.
  Gone.
- **The Wix image pipeline.** Images are served by `next/image` as AVIF with `sizes` set.
- **Duplicate portfolio images.** Several files repeated on the old portfolio page. The rebuild has
  one record per job, so a photograph can only appear once.
- **The three testimonial credit links.** All three pointed at the same Google contributor, so two of
  them linked to the wrong person. There is now one link, to the business profile, or none.
- **"40 years of experience."** Written once in 2024 against a 1990 start date. Nothing in this build
  hardcodes a year count — see `FOUNDED` in `content/site.ts`.
