# Google Ads — moving the tracking across without losing anything

**This is the document that protects Kenny's ad spend. Read it before the domain is
pointed at the new site.**

It is written for whoever is doing the switchover, developer or not. Nothing here needs
code. Where something does, it says exactly what to type and where.

---

## Why this matters more than the rest of the rebuild

Kenny is paying for clicks. The tag `AW-11172797357` is on every page of the current
Google Sites site, and behind it sits a history of recorded conversions. Google's
automated bidding uses that history to decide which searches are worth bidding on and
how much.

Two mistakes are available on switchover day, and both cost real money:

1. **The tag goes missing.** Conversions stop being recorded. The ads keep running and
   keep spending, and nothing looks wrong for a fortnight because there is no alarm for
   "we have stopped counting". Bidding slowly degrades because it thinks nothing is
   working.

2. **New conversion actions get created instead of the existing ones being reused.**
   This is the likelier mistake, because it feels like the tidy thing to do — new site,
   new form, new conversion action. It is not. A new conversion action has no history,
   so smart bidding starts learning from zero and performance drops for weeks. The old
   action's history is left orphaned.

Everything below exists to prevent those two things.

---

## 1. First phone call: get access to the Ads account

Before anything else. **If nobody has the login to the Google Ads account, that is the
first phone call, not an afterthought** — the labels in §2 cannot be obtained any other
way, and without them the new site records nothing.

Ask Kenny for one of:

- The Google account that manages the ads, or
- To be added as a user: **Admin → Access and security → `+` → email address, "Standard"
  access**, or
- Whoever set the ads up for him, if it was not him.

Also worth asking on the same call: **is anyone else still making changes to the
campaigns?** If an agency is running them, they need telling the day the site changes,
because their landing-page URLs are about to move (§4).

---

## 2. Find the existing conversion actions and copy their labels

This is the step that stops mistake #2. You are not creating anything here — you are
copying three values out.

In Google Ads:

1. **Goals → Conversions → Summary.** You will see the conversion actions that already
   exist. On an account like this there is usually something like "Form submission" or
   "Contact us", possibly a "Phone calls" one.
2. Click into an action. Look for **Tag setup → Install the tag yourself** (Google moves
   this wording around; it may be under "Use Google Tag Manager" / "Add the tag
   yourself"). You want the **event snippet**, which looks like this:

   ```js
   gtag('event', 'conversion', { send_to: 'AW-11172797357/AbC-D_efGhIjKlMnOp' });
   ```

3. The bit you need is the whole `AW-11172797357/AbC-D_efGhIjKlMnOp` string.
4. Repeat for each action you are going to use.

Then put them into the hosting environment (Vercel: **Project → Settings → Environment
Variables**) under these names:

| Variable                          | Which existing action to point it at                        |
| --------------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_ADS_CONVERSION_FORM` | The existing form-submission / contact conversion action     |
| `NEXT_PUBLIC_ADS_CONVERSION_CALL` | The existing phone-click action, or the form one (see below) |
| `NEXT_PUBLIC_ADS_CONVERSION_EMAIL`| The existing form one is fine — it is the same kind of lead  |

**If an action genuinely does not exist yet** — for instance there has never been a
phone-click conversion, because the old site had no tap-to-call — then creating that one
new action is correct and unavoidable. Create only the missing one. Never replace an
action that already has history.

**Two different things both called "calls".** A *call from an ad* (the call button in the
search result, using a Google forwarding number) is tracked by Google automatically and
has nothing to do with this site. A *tap on the number on the website* is what
`NEXT_PUBLIC_ADS_CONVERSION_CALL` covers. Keep them as separate conversion actions if
they already are.

The site does not break without these set — the pages all work, the phone still dials,
the form still delivers. It simply records nothing, and `npm run check:launch` refuses to
pass. That is deliberate.

---

## 3. What the new site fires, and when

| Event                              | Fires when                                                  |
| ---------------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_ADS_CONVERSION_FORM`  | An enquiry is successfully delivered by email               |
| `NEXT_PUBLIC_ADS_CONVERSION_CALL`  | Someone taps or clicks the phone number anywhere on the site |
| `NEXT_PUBLIC_ADS_CONVERSION_EMAIL` | Someone clicks the email address                            |

Three things worth knowing:

- **The form conversion only fires on success.** If the email fails to send, the visitor
  is told to ring and **no conversion is recorded**. Recording a conversion for an
  enquiry that never reached Kenny would poison the bidding data with leads that do not
  exist.
- **It fires exactly once per enquiry.** With JavaScript the form submits in place and
  fires there. Without JavaScript the browser posts the form and lands on
  `/contact/sent`, which fires it on load. Never both.
- **The number is a real link.** If the tracking script fails to load or is blocked, the
  phone still dials. Nothing about contacting Kenny depends on the measurement working.

The tag loads with `afterInteractive`, meaning after the page is usable. That is on
purpose: a landing page that is slow because of its tracking script costs more in lost
enquiries than the tracking is worth.

---

## 4. Check the Ads account's final URLs — same day

The old site's pages were `/home`, `/about-us` and `/contact-us`. Two of those no longer
exist, and one of them may well be what the ads point at.

The new site 301-redirects all three, so **nothing breaks** if an ad points at an old
URL. But Google Ads dislikes redirects on final URLs, and a redirect adds a hop to every
paid click, which is a slower landing page you are paying for.

So, on switchover day:

1. **Ads → Campaigns → Ads.** Add the **Final URL** column if it is not showing.
2. Anything pointing at `khdecorators.uk/home` becomes `khdecorators.uk/`.
3. Anything pointing at a Google Form (`docs.google.com/forms/...`) becomes
   `khdecorators.uk/contact`. **This one matters most.** An ad sending paid traffic
   straight to a Google Form is the single most expensive thing in the old setup.
4. Check **sitelink and other extensions** too — they have their own URLs and they are
   easy to forget.
5. Check for a **tracking template** at account or campaign level (Settings → Account
   settings → Tracking). If one exists, make sure it still resolves properly.

### Point the spray ads at the spray page

While you are in there: if there are ad groups for "UPVC spraying" or "garage door
spraying" and they point at the home page, move them to `/spraying`. That page is built
to answer those exact questions above the fold, and matching the landing page to the
search term is the cheapest quality-score improvement available.

---

## 5. Test it on a staging URL, before DNS

Do not test conversion tracking for the first time on the live domain. Every test click
you make becomes a recorded conversion in the account.

1. Deploy to the host's preview URL (Vercel gives one per deployment).
2. Set the same environment variables on the preview environment.
3. Install **Google Tag Assistant** (`tagassistant.google.com`) and connect it to the
   preview URL. You should see the `AW-11172797357` tag load, and a `conversion` event
   when you submit the form and when you tap the number.
4. In Ads: **Goals → Conversions → Summary → the action → Diagnostics.** It reports
   whether the tag is firing and whether it is seeing the events. Recent conversions can
   take a few hours to appear, so do this a day before cutover rather than an hour.
5. Test all three: submit the form, click the phone number, click the email address.
6. **Then delete the test conversions if you can**, or at least make a note of how many
   you created and when, so a spike of four conversions on a Tuesday afternoon does not
   get mistaken for a good day.

Backstop, if the event-based conversion cannot be made to work in time: `/contact/sent`
is a real, dedicated URL that only ever loads after a successful enquiry. A URL-based
conversion action pointing at it will work. It is less precise — it misses the
JavaScript path, which is most visitors — so treat it as a fallback rather than the plan.

---

## 6. Switchover day, in order

Do not reorder these. Each one depends on the one above it.

1. `npm run check:launch` passes. It will not until §2 is done and the content in
   `CONTENT-NEEDED.md` has been filled in.
2. Conversions verified on the staging URL (§5).
3. Final URLs checked and corrected in the Ads account (§4).
4. **Pause the campaigns.** Ten minutes of paused ads costs a few pence. Ten minutes of
   paid clicks landing on a half-propagated DNS record costs the clicks.
5. Point DNS at the new site. See `LAUNCH.md`.
6. Load every page on the live domain. Check the phone number dials on a real phone.
7. Submit one real enquiry through the live form and **confirm it arrives in Kenny's
   inbox**. This is the single most important test on the list.
8. Unpause the campaigns.
9. Check Ads conversion diagnostics again the following morning.

---

## 7. Later: splitting the spray page into ad-group landing pages

`/spraying` is built so this can be done without a rebuild. Each service is a
`SprayService` object in `content/spraying.ts` carrying its own title, description and
h1, ready for exactly this.

To add `/upvc-spraying` as its own landing page, one new file:

```tsx
// src/app/upvc-spraying/page.tsx
import { SprayServiceBlock } from '@/components/SprayServiceBlock'
import { sprayServiceBySlug } from '@content/spraying'
import { pageMetadata } from '@/lib/metadata'

const service = sprayServiceBySlug('upvc')!

export const metadata = pageMetadata({
  title: service.landing.title,
  description: service.landing.description,
  path: '/upvc-spraying',
})

export default function Page() {
  return <SprayServiceBlock service={service} number="01" headingLevel="h1" />
}
```

No new components and no copy written into the page. Then point the "UPVC spraying" ad
group's final URL at it.

**Worth doing when** an ad group is spending enough to justify measuring on its own —
usually once it has a steady flow of clicks and you want its own conversion rate rather
than the whole site's. Until then, `/spraying` with the question index at the top does
the same job for a quarter of the effort.

---

## 8. Cookies and consent — a decision for Kenny

Both the Ads tag and GA4 set cookies. UK PECR expects consent for the analytics ones, and
Google's own EU user-consent policy expects consent signals for ad personalisation from
UK and EEA visitors.

**There is no consent banner on this site.** The brief did not ask for one, and a banner
across a paid landing page costs enquiries — visitors who came from an ad and are met
with a cookie dialog bounce. That is a real trade-off in Kenny's favour on conversion
rate and against him on strict compliance, and he should be told about it rather than
left to find out.

If he wants one, the route is **Google Consent Mode v2** with a banner that sets
`ad_storage` and `analytics_storage`. It is a contained piece of work — one script before
the tag in `src/components/Analytics.tsx` and one client component for the banner. It is
not in this build because it should be his call.

---

## 9. What to watch in the first fortnight

| When            | Check                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| Day 1, evening  | Conversions recorded today, and Kenny has had at least one real enquiry       |
| Day 2           | Ads conversion diagnostics show no tag errors                                |
| Day 3           | Search Console picking up the new pages; no crawl errors on the old URLs      |
| Week 1          | Cost per conversion against the fortnight before — expect noise, watch trend  |
| Week 2          | 404s in Search Console. Anything there is a redirect to add to next.config.mjs |
| Week 2          | Lighthouse on mobile, against the before figures in `LAUNCH.md`               |

**If conversions drop to zero at any point, stop and check the tag before changing
anything in the campaigns.** A tracking fault looks exactly like a performance collapse
in the reports, and "fixing" the bidding to compensate makes a five-minute problem into a
month-long one.
