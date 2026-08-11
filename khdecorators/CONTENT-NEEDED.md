# What's needed from Kenny

**This is one phone call, about twenty minutes.** Everything on this list is a fact only he
has. Nothing here has been guessed at, because the alternative to a gap is not a
placeholder — it is a wrong answer given to a customer and to Google.

Anywhere a fact is missing the site shows a small ruled **"To confirm"** box rather than
inventing something. `npm run check:launch` fails while the blocking ones are outstanding,
so it is not possible to put this live with `{{TOWN}}` sitting in nine page titles by
accident.

Work down the list in order — it is written to be read out on the phone.

---

## Part 1 — The five that block launch

### 1. Which town are you based in?

> "If someone searched for a decorator, which town do you want to come up for?"

**Why it matters more than anything else on this list.** The current site says "the north
west of England" and names no place at all across six pages. That single omission is doing
two kinds of damage at once: Google has no local search to match him against, and his Ads
budget is being spent on clicks from anywhere in the region.

This one word goes into all nine page titles, the first sentence of the home page, and the
structured data. His old Yell listing points at the Chester area, but a listing is a hint,
not a fact, and this is not a field to guess.

**Where it goes:** `town` in `content/site.ts`. Change it once, it updates everywhere.

---

### 2. Which towns would you actually drive to?

> "Not everywhere you'd consider — the places you'd genuinely go on a Tuesday. Six or
> eight of them."

A short honest list beats a long aspirational one. Claiming Manchester and Carlisle in the
same breath reads like a franchise and pulls in enquiries he would turn down — which on
paid traffic he pays for twice, once for the click and once for the time.

Worth asking alongside it: **how far will you travel, and does spray work justify a longer
drive than a single room?** It usually does, and that answer sets the radius on the Ads
campaign.

**Where it goes:** `areas.towns` in `content/areas.ts`. Also drives `areaServed` in the
structured data and the Google Business Profile service area.

---

### 3. The reviews — transcribed, not written

> "Can you send me the reviews as they're written, or point me at the pages?"

He has a good collection already: Yell reviews from 2021–22 with usernames and dates, two
Google reviews from named reviewers, and a further set credited only by a first name and an
initial. One of them describes an office repaint quoted at five days, finished halfway
through day four, with the space left immaculate. **That review is worth more than every
adjective on this site put together.**

They are empty in the build because the wording was not reachable when it was made, and
they cannot be filled in on his behalf: writing something that sounds like a happy customer
is fabricating a testimonial for a trading business.

**Instructions for transcribing them are at the top of `content/reviews.ts`** — verbatim,
30 words or fewer, name exactly as published, date only where one is shown, source named,
linked where the original is still up.

The first-name-only ones have nothing to verify them, so they go in a separate group,
labelled, with no date and no link. **Better still: ask those customers for a Google
review**, and they become real ones.

---

### 4. What is the business actually called?

> "KH Decorators, KH Painting and Decorating, or K.H Decorating? All three are on your site."

All three appear across the current six pages, and the reviews add more variants. Google
cannot tell they are one business, so the local signal is split three ways.

Pick one, then it goes everywhere and stays: this site, the structured data, the Ads
account, the Google Business Profile, Yell, the van.

**Where it goes:** `business.name` in `content/site.ts`.

---

### 5. Access to the Google Ads account

> "Who's got the login for your Google Ads? I need to look at it before we switch over."

**If nobody has it, this is the first phone call rather than the last.** The tag on the
current site (`AW-11172797357`) has conversion history behind it, and that history is what
his automated bidding runs on. The new form and tap-to-call have to be pointed at the
*existing* conversion actions. Create new ones instead and the bidding starts learning from
zero — measurably worse for weeks, for no reason.

The three values needed are in the account and nowhere else. `ADS-MIGRATION.md` §2 says
exactly where to click.

Also worth asking: **is anybody else still making changes to the campaigns?** If an agency
runs them, they need warning that the landing page URLs are moving.

---

## Part 2 — Chase these straight after launch

The site is honest and launchable without them. Each one makes it better.

### 6. Photographs — spray work above all

> "Have you got photos of the UPVC and garage doors you've sprayed? Off your phone, not off
> the website."

**The most valuable non-blocking item on the list.** The annotated photograph is the
signature device of this design and `/spraying` is the page the paid traffic is meant to
land on. Until there are spray photographs, those frames show a marked "photograph to
come" box with a description of the shot needed.

What is wanted, in priority order:

1. **UPVC windows or doors** mid-job — masked up, gun in shot, ideally with one frame done
   and one not. That single photograph does more than the whole page of copy.
2. **A garage door**, square on from the drive, finished. And the masking in progress if he
   has it.
3. **The dustless sanding setup** — sander and extractor connected, in a room that is
   obviously still lived in. The contrast is the whole argument.
4. Rendered elevations, finished interiors, kitchen doors laid out and sprayed.

**Send the originals from the phone or camera.** Do not save them off the current site:
`lh3.googleusercontent.com` serves cropped, re-encoded copies and they will look soft at
the size this design runs them.

Drop files into `public/work/` and fill in the four fields in the matching content file —
`README.md` has the two-minute version.

### 7. "Time served" — what does it mean for you?

> "Which apprenticeship, where, and when did you finish?"

It is a real trade term and worth keeping. On its own it is vague; "four-year
apprenticeship, finished 2006" is a fact a customer can weigh. Also: **how long have you
been working for yourself?**

### 8. Insurance

> "Public liability — who's it with and what's the cover?"

Commercial and industrial customers check before they enquire. Stating it removes a phone
call and wins the jobs that require it.

### 9. Qualifications

NVQ, City & Guilds, any spray training, PASMA or IPAF tickets for towers. Spray training
and access tickets are worth naming on a page selling spray work.

### 10. Working hours

> "What hours do you want people ringing you on? Weekends?"

Stops the Ads budget generating calls he cannot answer, and stops customers assuming they
are being ignored.

### 11. Guarantee on sprayed work

> "Do you guarantee sprayed UPVC, and for how long?"

"Will it peel?" is the commonest objection to sprayed UPVC. A stated guarantee answers it
in four words on the page that sells it.

### 12. How long things take

Rough durations, for the specification tables. "How long will you be here?" is one of the
first three questions any customer has, and answering it on the page removes friction
before the enquiry:

- A house of UPVC windows
- A single garage door
- A kitchen of 15–20 doors
- A three-bed interior, whole house
- A semi, outside, all elevations
- A feature wall, and a papered room

### 13. Which sander and extractor?

Make and model. Naming the kit is the difference between a claim and a fact on the dustless
sanding page, and commercial customers recognise the brands.

### 14. Google Business Profile and Yell

> "Have you got a Google business listing, and can you log into it?"

A named Google review exists, so a profile almost certainly does. Needed as a **service-area
business, not a home address** — see `LAUNCH.md` §5. Its URL switches on the structured-data
link *and* makes the button on `/leave-a-review` work; until then that button is a marked
gap, because a review link that goes nowhere costs both the review and the goodwill of the
customer who tried.

Same for the Yell listing URL, where the older reviews live.

---

## Where each answer goes

| Answer                     | File                                          | Blocking |
| -------------------------- | --------------------------------------------- | -------- |
| Base town                  | `content/site.ts` → `town`                    | **Yes**  |
| Service area towns         | `content/areas.ts` → `areas.towns`            | **Yes**  |
| Reviews                    | `content/reviews.ts` → `reviews`              | **Yes**  |
| Trading name               | `content/site.ts` → `business.name`           | **Yes**  |
| Ads conversion labels      | host environment — see `.env.example`         | **Yes**  |
| SMTP app password          | host environment — see `LAUNCH.md` §4          | **Yes**  |
| Photographs                | `public/work/` + the matching content file     | No       |
| Time served, years, quals  | `content/about.ts` → `about.spec`              | No       |
| Insurance, hours           | `content/about.ts`, `content/home.ts`          | No       |
| Guarantees, durations      | `content/spraying.ts`, `content/services.ts`   | No       |
| Dustless kit               | `content/dustless.ts` → `dustless.spec`        | No       |
| Google / Yell URLs         | `content/site.ts` → `profiles`                 | No       |

Run `npm run check:content` at any point to see what is still outstanding. The register
behind it is `content/needed.ts`, which carries the reason each item matters.
