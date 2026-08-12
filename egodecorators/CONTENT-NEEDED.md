<!--
  GENERATED FILE — do not edit by hand.
  Written by scripts/check-content.mjs from content/needed.json.
  Run: npm run check:content
-->

# What we need from Ted

Everything on this list is something the rebuild deliberately did not invent.
Where an answer is missing the site shows a labelled frame saying what is
missing, rather than a guess — and `npm run check:launch` fails while anything
marked *blocks launch* is still open.

That is the whole difference between this site and the one it replaces. The old
one has had Latin placeholder text, five of its theme's dummy client logos and a
stranger's stock photography sitting on its home page since 2022, because
somebody needed to fill a space and filled it.

**The photographs come first.** Everything else on this list is a phone call.
The photographs are the design:

1. **Four matched before-and-after pairs.** Same view, same spot, same framing.
   Currently 0 of 4. Without these the home page, every
   project and the repairs page all render an empty frame where the comparison
   should be.
2. **Close-ups of the woodwork repair** — rot opened up, timber cut out, a
   splice going in, filled, primed, finished. `/repairs` is the page meant to
   win the work nobody else bids for, and it is the one thing a competitor on
   the same bought theme cannot copy.
3. **The four reviews, verbatim.** We know roughly what they say. Roughly is not
   good enough to put inside quotation marks over somebody's name.

## Ask first

### Four jobs, and for each one a photograph of the same view before you started and after you finished. Same spot, same framing, same rough distance — if the two pictures are of different walls the comparison reads as a con and we will not publish it.

The whole site is built on before-and-after. Every page has at least one comparison and the home page leads with one. Until these exist the design has nothing in it — the frames render as labelled empty slots saying which photograph is missing.

*Answer goes in:* `public/photographs/<job-slug>/, then before/after in content/projects/<slug>.mdx`  
*Blocks launch:* **yes**

### Close-ups of the repair work itself: rot opened up, the soft timber cut out, a splice going in, filler back and sanded, primed, and the finished paint. Six or eight photographs would carry the whole repairs page.

/repairs is the page meant to win the work nobody else bids for, and it is the one thing a competitor on the same bought theme cannot copy. Words alone will not do it — the reader needs to see that you have opened these up before.

*Answer goes in:* `public/photographs/repairs/, then content/copy/repairs.ts`  
*Blocks launch:* **yes**

### The four reviews, copied and pasted from Yell exactly as the customer typed them — including the odd spelling. And tell us which of them is the commercial job, the one about working around a business that could not move its things out of the way, because that one belongs on the commercial page.

Reviews are quoted verbatim and attributed exactly as published. A paraphrase presented as a quotation is a fabricated review, so the quotes stay empty and the site shows a labelled frame until the real text is pasted in. The summaries currently in the file came from a search index, not from the reviews, which is why none of them is on the page.

*Answer goes in:* `content/reviews.ts`  
*Blocks launch:* **yes**

### Who is in the team, and what is everyone's actual role? Reviews name Edward (Ted), Mario and a Lauren. Is 'family run' right, and if so who is related to whom?

/about is written about the people, because the reviews are about the people — customers name Ted and Mario, not the company. We will not describe a team we have not had confirmed.

*Answer goes in:* `content/copy/about.ts`  
*Blocks launch:* **yes**

### What year did the business start trading?

The old site says '15 Years Extensive Experience'. That was written in 2022 and has been wrong every year since. The rebuild stores the year once and computes from it, so it can never go stale — but it needs the year.

*Answer goes in:* `content/site.ts (FOUNDED)`  
*Blocks launch:* **yes**

### Which inbox should the enquiry form deliver to, and does anyone check it daily?

A contact form that goes nowhere is worse than no form at all — the customer thinks they have been in touch and never hears back. Until this is wired the form is not shown and the page gives the phone and the email instead.

*Answer goes in:* `src/lib/enquiry.ts`  
*Blocks launch:* **yes**

### Admin login for the WordPress site, so the media library can be exported at full resolution before the site is switched off.

The photographs are the only asset on the old site worth keeping. They must come out of the media library at original resolution, not be saved off the live pages, which serve cropped and re-encoded copies. Once the hosting lapses they are gone.

*Answer goes in:* `public/photographs/ — see MIGRATION.md`  
*Blocks launch:* **yes**


## Ask next

### For each job we write up: where was it (town is enough) and roughly what year?

A job with a place and a date is evidence. A job without them is a photograph. Location also does the local search work that Neston, Wirral and Flintshire pages depend on.

*Answer goes in:* `location and year in content/projects/<slug>.mdx`  
*Blocks launch:* no

### Did ReAgent agree to being named on the website, and is anyone there happy to be quoted?

The ReAgent job is the strongest commercial proof on the site. Naming a client is fine when they have agreed; it is not when they have not. If they would rather not be named the write-up runs as 'a chemical manufacturer in Runcorn' instead.

*Answer goes in:* `content/projects/reagent-offices-and-warehouse.mdx`  
*Blocks launch:* **yes**

### Is there a Google Business Profile for Ego Decorators, and who has the login?

The old site's social icon labelled 'google' actually pointed at Yell. Either there is a real profile and we link it, or there is not and one should be created — Neston plus a service area, no full address. Either way the link stops lying.

*Answer goes in:* `content/site.ts (profiles.google) and content/reviews.ts`  
*Blocks launch:* **yes**

### Read the Yell listing and note the exact rating and review count, and the date you read it.

The rating is shown as plain text with its source and the date it was read — never as a star graphic and never as aggregateRating in the structured data, which is against Google's policy for third-party ratings. A search index reported 4.9 from 29 reviews in August 2026, but that was not read off the listing itself so it is not published.

*Answer goes in:* `content/reviews.ts (yellRating)`  
*Blocks launch:* no

### What public liability cover is held, for how much, and with whom? Any trade qualifications or memberships worth naming?

Commercial clients ask before they ask the price. Offices, warehouses, churches and care homes all want it in writing, so it belongs on /commercial rather than buried.

*Answer goes in:* `content/copy/commercial.ts`  
*Blocks launch:* no

### Is the business based in Neston or West Kirby? The old site and the Yell listing say Neston; the Checkatrade profile says West Kirby.

Local search needs one consistent town across the website, Google, Yell and Checkatrade. Two different towns across profiles splits the signal and makes both weaker.

*Answer goes in:* `content/site.ts (site.base)`  
*Blocks launch:* **yes**


## Worth asking while you have him

### Are the Checkatrade profile (checkatrade.com/trades/egodecorators) and the Facebook page both yours and both current?

They turned up in search and neither is linked from the old site. If they are yours they are worth linking and keeping consistent; if they are stale they are worth closing. Nothing gets linked until you confirm it.

*Answer goes in:* `content/site.ts (profiles)`  
*Blocks launch:* no

### What hours do you work, and how quickly do you normally come out to price a job?

Both questions every enquiry asks. Answering them on /contact saves a phone call each way, and 'we will come out within a week' is worth more than any adjective.

*Answer goes in:* `content/copy/contact.ts`  
*Blocks launch:* no


## Jobs written up so far

- `external-masonry-and-windows` — still needs: location, year, 2 photograph(s), status `from-old-site`
- `hall-stairs-and-landing` — still needs: location, year, 2 photograph(s), status `from-old-site`
- `reagent-offices-and-warehouse` — still needs: location, year, 2 photograph(s), status `from-old-site`

Copy `content/projects/_TEMPLATE.mdx` for each new one. Jobs carried over from
the old site are marked `from-old-site`: the words came off the WordPress
write-ups and have not been re-confirmed, so they render with a visible note
until they are.

## Photographs

Export from the **WordPress media library at original resolution** before the
old site is switched off — see `MIGRATION.md`. Not by saving images off the
live pages, which serve cropped, resized and re-encoded copies.

Discard everything under `wp-content/themes/decorator-pro/images/`. That is the
theme's stock photography and its five dummy client logos, and none of it is
theirs.

Every photograph needs one line of alt text describing the work shown. The build
refuses any image whose alt text is missing or reads like `image1`, and refuses
a comparison slot that has neither a photograph nor a line saying what belongs
there.
