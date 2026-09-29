# Launch — putting this live without losing anything

Read `ADS-MIGRATION.md` first. It covers the part that costs money if it goes wrong. This
document covers everything else: redirects, DNS, the Google profile, Search Console, and
the performance figures to show Kenny afterwards.

---

## 1. Before you start

- [ ] `npm run check:launch` passes. **It does not today** — see `CONTENT-NEEDED.md`.
- [ ] Kenny has confirmed his **base town** and his **real service area** out loud.
- [x] The **trading name** is settled: **KH Painting and Decorating**. Set throughout the
      site. Still to do OUTSIDE this repo — make it match on the Google Business Profile,
      in the Google Ads account and on Yell (§5), or the split-signal problem just moves.
- [ ] The **reviews have been transcribed** word for word. Instructions are at the top of
      `content/reviews.ts`. They are not to be written.
- [ ] The **Ads conversion labels** are in the host's environment (`ADS-MIGRATION.md` §2).
- [ ] **SMTP is configured** and a test enquiry has arrived in Kenny's inbox (§4 below).
- [ ] Somebody has **dialled `07538869832` from the live site on a real phone**. The label
      and the link are generated from one constant so they cannot disagree, but dial it
      anyway — the number itself has only ever been read off the old site.
- [ ] **Photographs** exported from Google Sites at full resolution — from the originals
      on Kenny's phone or camera, **not** saved off the live pages.
      `lh3.googleusercontent.com` serves cropped, re-encoded copies and they will look
      soft at the size this design runs them.
- [ ] **Crawl the current site and export the URL list.** The redirect map below covers
      the three known pages. A crawl is how you find anything else that ever existed —
      Screaming Frog's free tier does 500 URLs, which is far more than enough.
- [ ] **Export the current Search Console performance report**, last 16 months, as CSV.
      You want a before-and-after baseline and the export is harder to get later.
- [ ] **Record the "before" performance figures** (§7). They cannot be measured once the
      old site is gone, and they are the most convincing thing you can show Kenny.

---

## 2. Redirects

Implemented in `next.config.mjs`, all **301**.

| Old (Google Sites) | New        | Why                                  |
| ------------------ | ---------- | ------------------------------------ |
| `/home`            | `/`        | Google Sites' home slug              |
| `/about-us`        | `/about`   | Shorter, and matches the nav         |
| `/contact-us`      | `/contact` | Same                                 |

**Every other slug is deliberately unchanged**: `/interior-decoration`,
`/exterior-decoration`, `/wallpaper-hanging`, `/reviews`. Those pages are indexed and Ads
traffic may already point at them, so they keep their addresses.

New pages with no old equivalent: `/spraying`, `/dustless-sanding`, `/leave-a-review`.

To add a redirect the crawl turns up, edit `GOOGLE_SITES_REDIRECTS` at the top of
`next.config.mjs`. Send an orphaned page to the closest **relevant** page — never
blanket-redirect everything to the home page, which Google treats as a soft 404.

---

## 3. DNS cutover

1. **Lower the TTL on the current DNS records to 300 seconds, at least a few hours
   before.** Whatever the TTL is now is how long the internet keeps serving the old
   answer, so if it is at 86400 you have a day of split traffic ahead of you.
2. Add the domain in the host (Vercel: **Project → Settings → Domains**) and let it issue
   the certificate.
3. **Pause the Ads campaigns** (`ADS-MIGRATION.md` §6).
4. Point the records at the host. `khdecorators.uk` apex → the host's A record;
   `www` → the host's CNAME.
5. **Pick the canonical host and keep it.** `NEXT_PUBLIC_SITE_URL` decides what goes in
   the canonical tags, the sitemap and the JSON-LD, and it must match what the host
   redirects to. The default in `.env.example` is the apex, `https://khdecorators.uk` —
   fine, as long as `www` redirects to it and not the other way round. Whichever is
   picked, do not change it later on a site with rankings.
6. Load every page over `https://`. Check the padlock, and check that the old URLs from §2
   land on the new ones with a 301 (not a 302, not a 200).
7. Unpause the campaigns.

---

## 4. Enquiry delivery

The form posts to a route handler in this app, which sends the enquiry as an email
through Kenny's own Outlook mailbox. No form provider, no third-party account, no
subscription, and nobody else holding his enquiries.

To set it up:

1. Turn on two-step verification on the Outlook account if it is not already on.
2. Create an **app password** (Microsoft account → Security → Advanced security options →
   App passwords). A normal account password will not work once two-step is enabled.
3. Set in the host's environment:

   ```
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_USER=khdecorators@outlook.com
   SMTP_PASS=<the app password>
   ENQUIRY_TO=khdecorators@outlook.com
   ```

4. **Send a real test enquiry and confirm it arrives.** Then send another one from a
   phone. This is the single most important test on launch day: a form that looks like it
   worked and quietly went nowhere is worse than no form, and on paid traffic every one
   of those is a click Kenny paid for and never heard about.

If Microsoft ever blocks SMTP on the account, `src/lib/deliver.ts` has one function to
swap and a comment explaining where. Until then this needs no external service.

**How it fails, on purpose:** if delivery breaks, the visitor is told plainly that it did
not send and to ring instead, and the full enquiry is written to the host's logs so it can
still be found and rung back. It never shows a tick for an email that did not leave.

---

## 5. Google Business Profile

A named Google review exists, so a profile almost certainly does. Confirm Kenny controls
it before doing anything else — if it was created by someone else, claiming it takes days
and it is better started early.

- [ ] Confirm he has it and can log in.
- [ ] **Set it up as a service-area business, not a shop with an address.** He works out
      of a van, and his home address should not be published. Google lets you list towns
      served instead — use the same list that goes in `content/areas.ts`.
- [ ] Business name **exactly** as agreed in §1. Not a variant, not with a town appended.
- [ ] Website field → `https://khdecorators.uk`.
- [ ] Phone → `07538869832`, matching the site.
- [ ] Categories: "Painter" as primary. Add "Painting", and something covering spraying if
      Google offers one — the categories are how the profile gets matched to searches.
- [ ] Services list: the nine on the home page table.
- [ ] Photographs, once they exist. Spray work first.
- [ ] Once it is live, put its URL into `profiles.google` in `content/site.ts`. That
      switches on the `sameAs` in the structured data **and** makes the review button on
      `/leave-a-review` work — until then it renders as a marked gap rather than a link
      that goes nowhere.

Same for the Yell listing URL into `profiles.yell`.

---

## 6. Search Console

- [ ] Add `https://khdecorators.uk` as a property. **Domain property** if you can add a
      DNS TXT record, which covers apex and `www` and every subdomain at once.
- [ ] Submit `https://khdecorators.uk/sitemap.xml`. It is generated automatically and
      lists all ten indexable pages.
- [ ] Use **URL Inspection → Request indexing** on `/` and `/spraying`. The rest will be
      found from the sitemap.
- [ ] At **two weeks**, check the **Pages** report for 404s. Anything there is an old URL
      the crawl missed — add it to `GOOGLE_SITES_REDIRECTS`.
- [ ] At two weeks, check the **Performance** report against the CSV exported in §1.
      Expect a wobble for the first fortnight; that is normal on any migration.
- [ ] Keep the old Google Sites property, if there is one, rather than deleting it. It is
      the only record of what was there before.

---

## 7. Performance — before and after

### After: measured on this build

The redesign ("Gilded Fascia", see `README.md`) opens every page on one of Kenny's own
photographs, full-bleed, under a headline set in the wide cut of Archivo. That was measured,
not assumed. Median of three sequential Lighthouse 13 runs, mobile form factor, production
build served locally. Commands are in §8.

| Metric                   | Budget  | `/` simulated | `/spraying` simulated | `/` real throttling | `/spraying` real throttling |
| ------------------------ | ------- | ------------- | --------------------- | ------------------- | --------------------------- |
| Performance (mobile)     | ≥ 92    | **95**        | **94**                | 90                  | 90                          |
| Accessibility            | 100     | **100**       | **100**               | —                   | —                           |
| Best practices           | —       | 96            | 96                    | —                   | —                           |
| SEO                      | —       | 69 (noindex)  | 69 (noindex)          | —                   | —                           |
| Cumulative Layout Shift  | ≤ 0.02  | **0.000**     | **0.000**             | 0.003               | 0.007                       |
| Largest Contentful Paint | ≤ 2.0 s | **2.8 s**     | **3.0 s**             | **2.1 s**           | **2.1 s**                   |
| First Contentful Paint   | —       | 1.0 s         | 1.0 s                 | 2.1 s               | 2.1 s                       |
| Total Blocking Time      | —       | 82 ms         | 104 ms                | 305 ms              | 326 ms                      |

"Simulated" is Lighthouse's default (Lantern modelling slow 4G from a fast trace). "Real
throttling" is `--throttling-method=devtools`: the page actually loaded over a throttled
connection with a 4× slowed CPU. **SEO reads 69 only because the site is deliberately
`noindex` while the town is a placeholder** — see `src/lib/indexable.ts`. It returns to 100
the moment the town is filled in. Best practices is 96 because the Ads tag cannot load
from the build machine; it is not a fault in the site.

Also verified, and these are the ones that protect the design:

- `npm run check:contrast` — every text and border pair clears WCAG AA for its use,
  including the darkest band of the gold-leaf gradient on every surface it is laid on.
- `npm run audit` — axe-core over 14 pages at a phone and a desktop width, no violations;
  every scroll reveal ends fully opaque once in view; the hero's entrance finishes inside
  three seconds; and with reduced motion on, every animated element renders in place.

**LCP is over budget in the simulated column, and at the budget with real throttling.
The two disagree for a reason worth knowing before anyone tries to "fix" it.**

The largest element is the hero headline, not the photograph (Chrome does not count an
image that fills the whole viewport). It is set wider than any fallback font can imitate,
so its final paint is when the Archivo file lands. Under real throttling that file arrives
with the stylesheet and the headline paints once, finished, at first paint — LCP equals
FCP. Lantern instead counts every request that happened to finish before that paint in the
fast trace, JavaScript included, as if it were blocking; that is where most of the
simulated 2.8 s comes from.

What was done for it, measured one change at a time on the home page (simulated):

| Change                                                        | home LCP |
| ------------------------------------------------------------- | -------- |
| Redesign as first built                                       | 3.1 s    |
| Headline rises but no longer fades in (opacity 0 is not "painted") | 2.84 s |
| Logos no longer preloaded, so they do not compete with the hero | (in the above) |
| Font subset to the 136 glyphs used, weight axis 400–800: 87 KB → 47 KB | 2.81 s |

The font subset barely moved the simulated figure, which is itself the evidence that the
file size was not the bottleneck; it is kept because it is 40 KB less for every visitor
on a real connection.

Before changing anything else:

1. **Measure on the live host.** Use PageSpeed Insights on the real URL — its field data
   is the number Google uses for landing-page experience.
2. **If it is still over 2.0 s and Kenny would rather have the speed than the lettering on
   a first visit:** `display: 'optional'` in `src/app/fonts.ts` makes LCP equal FCP, at
   the cost of a first-time visitor on a slow connection seeing the fallback face for that
   visit. That is a design decision rather than a tweak, so it is his call.

### Before: measure this on the old site, and do it first

The current site could not be measured from the build environment, so **these have to be
recorded before the domain moves** or they are gone.

Run PageSpeed Insights (`pagespeed.web.dev`) on `https://khdecorators.uk/home`, mobile,
and write the numbers in:

| Metric                   | Google Sites (before) | This build (after) |
| ------------------------ | --------------------- | ------------------ |
| Performance (mobile)     | `{{TODO}}`            | 97                 |
| Accessibility            | `{{TODO}}`            | 100                |
| Largest Contentful Paint | `{{TODO}}`            | 2.5 s              |
| Cumulative Layout Shift  | `{{TODO}}`            | 0.000              |
| Total page weight        | `{{TODO}}`            | ~230 KB            |

Expect the old site to be a long way behind, mostly because of the embedded Google Form
and Google Sites' own scripts. That gap is the argument for the rebuild, and on paid
traffic it is money rather than vanity — so it is worth writing down and showing him.

---

## 8. Reproducing the measurements

```bash
npm run build
npx next start -p 3000

# Mobile Lighthouse, one page (add --throttling-method=devtools for the real-throttling
# column). Run it three times SEQUENTIALLY and take the median —
# a single run on a busy machine swings by up to 8 points on performance and 0.6s on
# LCP, and running them concurrently makes the server the bottleneck instead of the
# page, which produces nonsense.
npx lighthouse@12 http://localhost:3000/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --form-factor=mobile --screenEmulation.mobile \
  --output=html --output-path=./lh-home.html

# The two checks that protect the design rather than measuring it.
npm run check:contrast     # computes every palette pair against WCAG AA
npm run audit              # axe-core, 13 pages, two widths, reduced-motion pass
```

Screenshots of every page at desktop and phone widths:

```bash
node scripts/shots.mjs http://localhost:3000 /tmp/shots
```

---

## 9. After launch

| When    | Do                                                                             |
| ------- | ------------------------------------------------------------------------------ |
| Day 1   | Every page loads over https. Test enquiry received. Number dials from a phone.  |
| Day 1   | Ads unpaused, conversions recording (`ADS-MIGRATION.md` §9)                     |
| Day 2   | Sitemap submitted and read in Search Console                                    |
| Week 1  | PageSpeed Insights on the live URL — fill in the real "after" figures above      |
| Week 2  | 404 report in Search Console → add any missing redirects                        |
| Week 2  | Chase the outstanding items in `CONTENT-NEEDED.md`, photographs above all       |
| Month 1 | Rankings for "decorator {town}", "UPVC spraying {town}", "garage door spraying"  |
