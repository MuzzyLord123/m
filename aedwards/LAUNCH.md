# Launch checklist

Andy is starting from nothing: no website, no domain, no email, one Yell
listing. So this list isn't a formality after the build — for the first few
items, **this list is the job**. A decent site nobody can find is worth less
than a Google Business Profile.

Work down it in order. Item 2 is the one that will earn him the most money.

---

## 1. Register a domain

He hasn't got one.

Checked on 11 August 2026 — **all of these were available**:

| Domain | Status |
|---|---|
| `aedwardsdecorating.co.uk` | available — **recommended** |
| `aedwardsdecorating.com` | available |
| `aedwardsdecorating.uk` | available |
| `aedwardsdecorators.co.uk` | available |
| `andyedwardsdecorating.co.uk` | available |

Take `aedwardsdecorating.co.uk`. It is his trading name exactly, it is a `.co.uk`
which is what a north-Wales customer expects, and it costs about a tenner a
year. Grab the `.com` too if he wants, and point it at the same place.

Re-check availability before promising anything — this list is a snapshot.

Then:

- Set `NEXT_PUBLIC_SITE_URL` in the host's environment to the real address.
- Set `DOMAIN_REGISTERED = true` in `content/site.ts`.

## 2. Google Business Profile — the big one

Free, takes half an hour, and for a decorator in Flint it will out-earn this
website on its own. Most people looking for a decorator never leave the map.

- Find out whether he already has one, and whether he can actually get into it.
  Plenty of tradesmen have a profile somebody else created years ago.
- If he hasn't got one, create it.
- **Set it up as a service-area business, not a shop.** He works from home. A
  service-area profile shows the towns he covers and hides his home address; a
  standard profile publishes his front door on the internet.
- Add the twelve photographs (see item 7).
- Put the website address on it.
- Put the profile URL into `content/site.ts` → `googleProfileUrl`, and the
  "write a review" link into `googleReviewUrl`. That switches on the second link
  on `/leave-a-review`.

## 3. Claim the Yell listing, and add the website to it

The listing currently shows a public "is this your business?" prompt, which
means it is unclaimed — anyone can suggest edits to it and Andy gets no say.

- Claim it. It's free.
- Add the website address. Also free, and it's the cheapest link the site will
  ever get, from the one page that is already sending him work.
- While in there: check the phone number and the trading name are right, and
  **turn off "Open 24 Hours"** if the claim process lets you set real hours.

## 4. Clean up the citations

Directory aggregators are carrying inconsistent information about him — at least
one shows different opening hours from Yell, and at least one shows a second
decorating business sharing his address. That kind of mess (inconsistent name,
address and phone across directories) actively suppresses local search ranking.

It's worth an hour of somebody's time to find the main ones and make them agree
with each other. Same trading name, same phone, same town, every time.

## 5. Get the real opening hours

Yell says "Open 24 Hours", seven days a week. That's a directory default, not a
fact about Andy, and a second aggregator shows different hours again.

The site currently ships **no hours section at all**, which is the right answer
until somebody asks him. When he gives real ones, put them in
`content/site.ts` → `openingHours`.

Never ship "Open 24 Hours". It reads as either a lie or a robot.

## 6. Fill in the review excerpts

See `REVIEWS.md`. Fifteen minutes with the listing open, and it is the
difference between a site that argues its case and a site that promises to.

`npm run check:launch` will fail until this is done.

## 7. Get the photographs

Twelve room shots, **originals off his phone** — not the compressed copies on
the Yell listing, which are Yell's files and look like it.

Ask him to say which room and which village each one is. Drop them in
`public/photographs/`, list them in `content/photos.ts`, and the photo strip
appears on the front page by itself. If nothing arrives, the section stays cut
and the site is fine — it was designed to stand up with no photography at all.

## 8. Set up an email address and switch the form on

There's no email address on file, so the enquiry form doesn't render; the
contact section shows his phone number instead.

Once he has one (`andy@aedwardsdecorating.co.uk` off the new domain is the
obvious move), set **either**:

- `ENQUIRY_WEBHOOK_URL` — posts each enquiry as JSON to whatever he uses, or
- `RESEND_API_KEY` plus `ENQUIRY_TO` — emails it to him.

The form appears on its own once one of them is set — but **the site has to be
rebuilt after you set it.** The home page is prerendered, so the variable is
read at build time, not per request. Set it in the host's environment, then
trigger a fresh deploy.

Send a test enquiry and make sure it actually arrives before telling him it
works.

## 9. Check the things that are printed as fact

- **Phone.** Dial `07928 784903`. Then set `PHONE_CONFIRMED = true` in
  `content/site.ts`. It is on every screen of the site and it is the only way
  anyone contacts him.
- **The Yell listing URL.** Click it, confirm it's his, set
  `yellListingConfirmed = true`.
- **The 4.9 from 34.** Look at the listing with your own eyes, then set
  `seenOnListing: true` in `content/reviews.ts`.
- **Insurance and CSCS.** Both are on his listing; neither is printed on the
  site until somebody confirms they are *current*. Get renewal dates. A lapsed
  insurance claim on a website is worse than no claim at all.
- **The towns.** Ask him which ones he actually goes to. Nothing is named until
  he says it.

## 10. Structured data and SEO

Already built, but worth understanding:

- The site emits a `HousePainter` entity with his name, phone in E.164 form,
  service area, URL, and `sameAs` links to the Yell listing and (once it
  exists) the Google profile, plus `Service` entities for each line of work.
- **There is no `aggregateRating`, on purpose.** See `REVIEWS.md`, rule 4. Don't
  add it.
- There is no street address in the markup, on purpose.
- Home page title: `Painter & decorator in Flint | A Edwards Decorating`.
- Target Flint, Deeside, Connah's Quay, Holywell, Mold, Buckley and Chester
  **only for the towns he confirms**, and only in real sentences on real pages.
  No doorway pages, one per town. They don't work any more and they look like
  what they are.

## 11. Performance and accessibility budget

Run Lighthouse on mobile after deploying:

- Performance **≥ 95**. This site is type and colour with no images; there is no
  excuse.
- Accessibility **100**.
- CLS **≤ 0.01**.

Contrast is enforced in the code: `content/fields.ts` fails the build if any
field's text drops below 7:1. Every page has been checked with axe across
WCAG A, AA and AAA with zero violations at both desktop and mobile sizes.

## 12. Before you point the domain at it

```
npm run lint          # typecheck
npm run build         # includes the contrast and review-rule checks
npm run check:launch  # fails while anything blocking is still open
```

`check:launch` is the gate. It fails while the phone is unconfirmed, the rating
unseen, the listing unverified, the towns unnamed, the excerpts blank or the
domain unregistered. That's deliberate. Those are the six ways this site could
tell somebody something untrue.

## 13. After it's live

- `sitemap.xml` and `robots.txt` generate themselves.
- The share image (`opengraph-image`) is generated from field one in the site's
  own type — check it renders by pasting the URL into a message to yourself.
- Text `/leave-a-review` to the next customer whose job goes well. Thirty-four
  reviews took ten years of word of mouth. Sixty will take a link he can send
  from a ladder.
