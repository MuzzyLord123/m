# What I still need from you

Everything on the site at the moment is either a fact you gave me — your name, your
number, Wrexham and Coedpoeth — or something I can say about painting and decorating
that is true of the trade. **Nothing has been invented about your business.** No years
trading, no insurance, no qualifications, no guarantees, no review scores, no opening
hours, no prices. If it is not on this page, it is not on the site.

That is deliberate. A made-up review score or a fake "20 years' experience" is the
fastest way to get a small trade site into trouble, and it is not needed to get the
phone ringing.

Below is everything outstanding. Most of it you can answer over the phone in ten
minutes. The photographs are the part that will make the biggest difference.

---

## 1. Photographs — the big one

The site has space reserved for eleven photographs. Until they arrive those spaces
show as flat colour blocks marked "Photograph to come". They look deliberate rather
than broken, but they are doing none of the selling that a real photo of your work
would do.

**How to take them:** phone camera is fine. Landscape unless it says otherwise. Turn
the light on, open the curtains, stand still. Don't crop them, don't filter them, and
send them at full size — I can always make a picture smaller, never bigger.

### The one that matters most

1. **Hero shot.** The best finished room you have. Taken wide and level from the
   doorway, in daylight. This one sits at the top of the page behind everything else,
   so pick the job you are proudest of.

### One per service

2. **Interior and exterior painting** — a finished room from the doorway with the light
   on, walls and ceiling both in shot.
3. **Surface preparation** — mid-job: a filled and sanded wall before painting, with the
   filler patches still showing. Close in. This one is worth more than it sounds; it is
   the shot that shows you actually prepare.
4. **Woodwork finishing** — freshly finished skirting and architrave, taken low and along
   the wall so the light runs down the gloss.
5. **Residential and commercial** — a shop, office, hallway or stairwell after painting.
   Wide.

### The preparation section

6. **A room mid-preparation** — dust sheets down, furniture covered, filler patches on the
   walls, sockets off. Portrait or landscape, either is fine.

### Recent work gallery

7. Your best finished room, wide, from the corner, curtains open.
8. A staircase or hallway, shot upright so the whole run of it is in frame.
9. Woodwork close up — skirting, architrave or a panelled door in satin or gloss.
10. An exterior: render, soffits and fascias, from across the road on a dry day.
11. A kitchen or bathroom, painted, wide enough to show the ceiling line.
12. A commercial job — shop, office, unit or communal stairwell.

### Before and after pairs

The site has a slider you can drag across to compare a wall before and after. It needs
**two shots of the same thing from the same spot**, which means taking the "before" the
moment you arrive on a job and remembering to stand in the same place at the end. Two
pairs are set up:

- An interior: the same room, same corner, same angle, same time of day.
- An exterior: the same elevation, same spot across the road.

If you have not got a matched pair yet, take one on your next job — it is the single
most convincing thing on a decorator's website.

### For every photo, tell me three things

So the caption is right and the site is findable in search:

- **What the job was** — "kitchen ceiling and walls repainted"
- **Where** — the town or village, e.g. "Coedpoeth"
- **What went on it** — e.g. "satin woodwork, matt emulsion walls"

---

## 2. Villages you actually cover

The site names Wrexham and Coedpoeth because you told me those. I have suggested the
places below, but **none of them are on the live site** and none will go on until you
say yes to each one. Read down the list and tell me which ones you would drive to:

Rhos · Brymbo · Minera · Gresford · Llay · Marford · Rossett · Ruabon · Chirk ·
Wrexham Industrial Estate

Also worth answering: **how far will you go?** If there is a mileage past which you'd
say no, tell me and I will word it that way instead of listing places.

---

## 3. Checkatrade

You mentioned you are listed. I need **the web address of your profile** — open the
profile, copy what is in the browser bar, and send it over.

Until then there is no mention of Checkatrade on the site at all. When the link goes
on it will be a plain line of text — "Also listed on Checkatrade" — and nothing more.
No badge, no logo, no stars, no review count. The badge artwork is licensed to members
and only Checkatrade can issue it, and putting a rating on your own site that you have
typed in yourself is worse than having none.

---

## 4. Where should enquiries go?

The contact form works, but at the moment a submitted enquiry is only written to the
server log — nobody gets told about it. **Where do you want them?**

- A text to your mobile?
- An email address? (If so, which one — I do not have an email address for you and I am
  not going to guess at one.)

Once you decide, that goes into an environment variable called `ENQUIRY_WEBHOOK_URL`
and enquiries start arriving. Until then, the phone number is the only route in — which
is fine, it is the route most people will use anyway.

---

## 5. The domain

What web address is this going live on? I need it before launch because it goes into
the sitemap, the canonical tags, the link preview and the structured data that Google
reads. It is set with an environment variable called `NEXT_PUBLIC_SITE_URL`.

---

## 6. Things I have deliberately NOT written — say the word and they go on

Each of these is standard on a trade website and each one is a straight lie until you
confirm it. Tell me which are true and I will add them:

- [ ] **How long have you been decorating?** — years in the trade, or the year you started
- [ ] **Are you insured?** — public liability, and the cover amount if you want it stated
- [ ] **Any trade qualifications?** — City & Guilds, NVQ, apprenticeship, anything formal
- [ ] **Do you guarantee your work?** — and for how long, on what
- [ ] **Do you give free quotes?** — most decorators do, but I am not going to assume it
- [ ] **When can people ring?** — the hours you are happy to take calls
- [ ] **Do you have public reviews anywhere?** — Checkatrade, Google, Facebook. Real ones,
      with a link. I will not write a testimonial for you and you should not let anybody
      else do it either.
- [ ] **Do you work with dulux/johnstone's/anything in particular?** — trade brands you use
- [ ] **Do you do wallpapering?** — it is not currently mentioned anywhere
- [ ] **Do you do spray finishing?** — same
- [ ] **A photo of you, or of your van** — optional, but people like knowing who is turning
      up. Only a real photo of you; there is nothing generic on this site and there is not
      going to be.

---

## In the code

For a developer: the outstanding items are registered in `content/todo.ts`, and every
photograph brief is the `brief` field on the photo slots in `content/hero.ts`,
`content/services.ts`, `content/preparation.ts` and `content/gallery.ts`. Searching the
repository for `{{TODO` finds the register. Nothing renders a raw placeholder token on
the page — where a fact is missing, the site is built to leave it out rather than show
a gap.
