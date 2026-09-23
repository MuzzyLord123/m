# What's needed from Kenny

**This is one phone call, about twenty minutes.** Everything on this list is a fact only he
has. Nothing here has been guessed at, because the alternative to a gap is not a
placeholder — it is a wrong answer given to a customer and to Google.

Anywhere a fact is missing the site shows a small ruled **"To confirm"** box rather than
inventing something. `npm run check:launch` fails while the blocking ones are outstanding,
so it is not possible to put this live with `{{TOWN}}` sitting in nine page titles by
accident.

Work down the list in order — it is written to be read out on the phone.

**Already settled:** the trading name is **KH Painting and Decorating**. That was one of
the five blocking items and it is now set throughout the site. It still needs matching on
the Google Business Profile, in the Google Ads account and on Yell, or the three-competing-
names problem simply moves off the website and stays everywhere else — see `LAUNCH.md` §5.

---

## Part 1 — The three that block launch

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

### 3. The reviews — DONE

All seventeen are in, copied word for word off the old site's reviews page: seven Yell
reviews with their usernames and dates, the two Google reviews from named reviewers, and
the eight credited by first name and initial, which sit in their own group with no date
and no link. Each was checked by script against the page it came from. See the top of
`content/reviews.ts`.

Two things would make them stronger, and both are quick:

- **The Yell listing and Google profile addresses** (item 13). With them, every Yell and
  Google review links to where it can be checked.
- **Ask the first-name-only customers for a Google review**, and they become real ones.

---

### 4. Access to the Google Ads account

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

### 5. Photographs — three shots still wanted

**56 of his photographs are already on the site**, taken off the old one at the largest
size Google would give (see `content/photos.ts`) — exteriors, wallpaper, interiors, and
two before-and-after pairs of render work that are the best proof on the site. What the old
site did not have, and what would help most:

> "Have you got photos of UPVC or kitchen doors you've sprayed, and the sander with the
> extractor on it? Off your phone."

1. **UPVC windows or doors mid-job** — masked up, gun in shot, ideally one frame done and
   one not. `/spraying` is the page the paid traffic lands on, and its UPVC section is
   using a conservatory photograph until then.
2. **Kitchen doors laid out and sprayed.** That slot on `/spraying` still shows a marked
   "photograph to come".
3. **The dustless sanding setup** — sander and extractor connected, in a room that is
   obviously still lived in. `/dustless-sanding` is using a sheeted hallway until then.

**Send the originals from the phone.** Google Sites stored the old ones at 2048px at most,
which is fine for the site but no bigger. Drop files into `public/work/` and add an entry
to `content/photos.ts` — `README.md` has the two-minute version.

### 6. "Time served" — what does it mean for you?

> "Which apprenticeship, where, and when did you finish?"

It is a real trade term and worth keeping. On its own it is vague; "four-year
apprenticeship, finished 2006" is a fact a customer can weigh. Also: **how long have you
been working for yourself?**

### 7. Insurance

> "Public liability — who's it with and what's the cover?"

Commercial and industrial customers check before they enquire. Stating it removes a phone
call and wins the jobs that require it.

### 8. Qualifications

NVQ, City & Guilds, any spray training, PASMA or IPAF tickets for towers. Spray training
and access tickets are worth naming on a page selling spray work.

### 9. Working hours

> "What hours do you want people ringing you on? Weekends?"

Stops the Ads budget generating calls he cannot answer, and stops customers assuming they
are being ignored.

### 10. Guarantee on sprayed work

> "Do you guarantee sprayed UPVC, and for how long?"

"Will it peel?" is the commonest objection to sprayed UPVC. A stated guarantee answers it
in four words on the page that sells it.

### 11. How long things take

Rough durations, for the specification tables. "How long will you be here?" is one of the
first three questions any customer has, and answering it on the page removes friction
before the enquiry:

- A house of UPVC windows
- A single garage door
- A kitchen of 15–20 doors
- A three-bed interior, whole house
- A semi, outside, all elevations
- A feature wall, and a papered room

### 12. Which sander and extractor?

Make and model. Naming the kit is the difference between a claim and a fact on the dustless
sanding page, and commercial customers recognise the brands.

### 13. Google Business Profile and Yell

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
| Reviews                    | `content/reviews.ts` → `reviews`              | Done     |
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
