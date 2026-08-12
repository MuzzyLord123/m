# Migration — egodecorators.com

Moving from WordPress on a bought theme (`decorator-pro`) to this Next.js site.

The old site's URLs are the only asset it has that is worth keeping. Everything
else on it — the layout, the photographs, the client logos, the Latin — belongs
to a theme sold to decorators nationwide, and goes.

Work through this in order. Nothing in §5 happens until §3 is finished.

---

## 1. The redirect map

All redirects are **301** and live in `next.config.mjs`. They are code, not host
configuration, so they are version-controlled and travel with the site.

### Pages

| Old URL | New URL | Confidence |
|---|---|---|
| `/about-us/` | `/about` | Confirmed |
| `/contact-us/` | `/contact` | Confirmed |
| `/pages/` | `/` | Confirmed — theme page index, no equivalent |

### Jobs (`recent_work` custom post type)

The old slugs are mostly opaque. Titles below were read off the live site.

| Old URL | Old title | New URL | Confidence |
|---|---|---|---|
| `/recent_work/reagent-project/` | ReAgent Project | `/projects/reagent-offices-and-warehouse` | Confirmed |
| `/recent_work/project-1/` | Damaged Window | `/projects/external-masonry-and-windows` | **Inferred** |
| `/recent_work/project-2/` | *unread* | `/projects/hall-stairs-and-landing` | **Inferred** |
| `/recent_work/project-3/` | *unread* | `/projects/hall-stairs-and-landing` | **Inferred** |
| `/recent_work/project-4/` | Living Room | `/interior` | Confirmed title |
| `/recent_work/project-5/` | Coffee Shop | `/commercial` | Confirmed title |
| `/recent_work/project-6/` | Home Makeover | `/interior` | Confirmed title |

Only three jobs are written up in the rebuild, because only three had a write-up
worth carrying across. The rest point at the page covering the same kind of
work: somebody who followed a link about a living room should land on interior
decorating, not on an archive index that makes them start again.

### Blog

**Decision: the blog is retired, not rebuilt.** All three posts are job
write-ups rather than articles, the most recent is from 2022 and one is from
2017. An empty blog that has not been touched in four years is worse than no
blog, and a "News" tab with nothing behind it costs more trust than it earns.
The work those posts describe now lives on the service pages, and new jobs go
to `/projects` — that is the archive.

| Old URL | New URL |
|---|---|
| `/2022/02/08/home-makeover/` | `/interior` |
| `/2022/02/08/living-room/` | `/interior` |
| `/2017/02/08/coffee-shop/` | `/commercial` |

### Catch-alls

So that no old link can dead-end, whatever it was:

| Pattern | Goes to |
|---|---|
| `/recent_work/*` | `/projects` |
| `/category/*`, `/tag/*` | `/projects` |
| `/author/*` | `/about` |
| `/YYYY/MM/DD/*` | `/projects` |
| `/testimonials/*` | `/about` |

That last one matters. The old site stored real customers' words on the theme's
dummy testimonial slugs — `/testimonials/john-doe/`, `/sarah-brown/`,
`/julia-doe/`, `/jenifer-doe/` — so the URL and the person never matched. The
slugs die with the theme. The words move to `/about` and `/commercial`, attributed
to whoever actually wrote them.

### Trailing slashes

Every URL on the old site ends in `/`. Left alone, Next would normalise
`/about-us/` to `/about-us` with a 308 and only then apply the 301 — a two-hop
chain on one hundred per cent of the inbound links.

So `skipTrailingSlashRedirect` is on and the slash is handled here instead:
every named old URL is registered in both forms and answers in a **single 301**,
with a general cleanup at the bottom of the list catching everything else,
including new URLs that arrive with a stray slash. Verified:

```
/about-us/                     301 -> /about
/recent_work/reagent-project/  301 -> /projects/reagent-offices-and-warehouse
/2017/02/08/coffee-shop/       301 -> /commercial
/testimonials/john-doe/        301 -> /about
/recent_work/unlisted-job/     301 -> /projects
/about/                        301 -> /about
```

---

## 2. Check before cutover

Four mappings above are marked **Inferred**. Spend ten minutes on the live site
before it goes and settle them:

1. Open `/recent_work/project-1/` through `/recent_work/project-6/` and write
   down each title.
2. Confirm which one is the masonry-and-windows job and which is the hall,
   stairs and landing job in `content/projects/`.
3. Correct `RECENT_WORK` in `next.config.mjs`.
4. While you are in there, the two hall/stairs/landing jobs need separating —
   one is a jade white scheme, the other is a green lower half taken back to
   white. The write-up in the rebuild follows the second.

Also settle `base-town` in `CONTENT-NEEDED.md`: the old site and Yell say
Neston, the Checkatrade profile says West Kirby. Local search wants one town
across the website, Google, Yell and Checkatrade.

---

## 3. Export the media library

**Do this before anything else, and do not skip it.** The photographs are the
only thing on the old site that cannot be replaced. When the hosting lapses they
are gone.

1. Log into WordPress admin.
2. **Tools → Export → Media** — or take the whole `wp-content/uploads/`
   directory over SFTP, which is more reliable and gets the originals.
3. Keep **original resolution**. Do not right-click and save images off the live
   pages: WordPress serves cropped, resized, re-encoded copies, and the whole
   design here depends on being able to show a photograph at full width.
4. Sort into `public/photographs/<project-slug>/`.
5. **Throw away everything under `wp-content/themes/decorator-pro/images/`.**
   That is the theme's stock photography of other people's work, including the
   hero slider and all five "Our Clients" logos. None of it is theirs and none
   of it goes anywhere near the new site.

Then go through Instagram (`instagram.com/ego_decorators`) and pull the
before/after pairs — and get the originals off Ted's phone rather than
downloading them back off Instagram, which recompresses everything.

The rule for a pair: **same view, same spot, same framing.** Two photographs of
different walls presented as a before and after reads as a con, and it is the
one thing this whole design depends on being honest about.

---

## 4. Set up before DNS moves

- [ ] `content/site.ts` — `FOUNDED` set to the real year.
- [ ] `content/reviews.ts` — the four reviews pasted in verbatim.
- [ ] `src/lib/enquiry.ts` — enquiry delivery wired, and one test enquiry sent
      and confirmed received.
- [ ] Google Business Profile: confirm one exists and who holds the login. If
      not, create it — Neston plus a service area, not a full address — and put
      the URL in `content/site.ts`.
- [ ] Copy the Google Search Console verification token off the old site's
      `<head>` **before** it goes, or Search Console access is lost at cutover
      along with the historical data.
- [ ] `npm run check:launch` exits zero.

---

## 5. DNS cutover, in order

1. Deploy this site to the host and check it on its preview URL. Walk every page.
2. Add `egodecorators.com` and `www.egodecorators.com` to the host and let the
   certificate issue. **Do not point DNS yet.**
3. Drop the DNS TTL on the A/CNAME records to 300 seconds. Wait for the old TTL
   to expire — if it was 24 hours, wait a day.
4. Point the records at the new host.
5. Watch for the certificate to go valid on the live domain.
6. Work down the redirect table above and check every row resolves 301 → 200.
   `curl -sSI https://egodecorators.com/about-us/` and read the status.
7. Submit the new sitemap in Search Console: `https://egodecorators.com/sitemap.xml`.
8. Put the TTL back up.

**Leave the WordPress hosting running for at least 30 days after cutover.** It
costs a few pounds and it is the only way back if something was missed. Do not
cancel it until the media export in §3 is confirmed complete and backed up
somewhere that is not one laptop.

---

## 6. After cutover

- [ ] Every row of the redirect table returns 301 then 200.
- [ ] `https://egodecorators.com/sitemap.xml` and `/robots.txt` both load.
- [ ] The phone link dials the right number from an actual phone. Tap it, do not
      read it.
- [ ] The footer email opens a mail client with a complete address. The old site
      rendered `info@egodecorators` with no `.com` and every mailto on it failed
      silently, which is very likely the most expensive fault on the whole site.
- [ ] Search Console: no spike in 404s after a week.
- [ ] Google Business Profile website link updated.
- [ ] The Yell, Checkatrade and Instagram profiles all point at the new site and
      all say the same town.
- [ ] Structured data passes the Rich Results Test. It should report
      `HousePainter` and the `Service` entities, and **no** `aggregateRating` —
      that absence is deliberate, see `src/lib/schema.ts`.
