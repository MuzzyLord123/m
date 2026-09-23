# The reviews

This is the most important file in the project. If you only read one, read this
one — and you don't need to be a developer to follow it.

Andy's 34 ratings averaging 4.9, built up over ten years, are the entire reason
this website works. The site isn't a brochure with some testimonials at the
bottom; the reviews **are** the structure. Three of the eleven sections on the
front page are a single review and nothing else, and there is a whole page at
`/reviews` that is nothing but reviews.

Which means: if a review on this site is wrong, invented, tidied up or
unattributed, the site is worse than useless. It's actively dishonest, and it's
dishonest about the one thing Andy has spent a decade earning.

So there are rules. They aren't bureaucracy. Here they are.

---

## The five rules

### 1. Excerpt. Don't republish.

Take the sharpest **thirty words or fewer** out of a review, word for word, and
link to the original. Do not copy all 34 reviews across onto this site.

Three reasons, all of them real:

- The words belong to the people who wrote them.
- Yell's terms restrict copying content off their site.
- Google's terms restrict storing review text.

And one that matters more than the other three: a short quote with a link is
**more** convincing than a long one without, because a reader can tap it and
check. A wall of unverifiable praise is what every bad tradesman's website has.
A handful of quotes that go straight to the real thing is what an honest one
has.

### 2. Never edit a review.

No fixing spelling. No fixing grammar. No joining the good bit at the start to
the good bit at the end. No changing "Andy" to "we". No cutting a "but".

If a review needs editing to work on the site, **use a different review.** There
are 34 of them.

### 3. Always attribute, in full.

Every excerpt shows:

- the reviewer's display name exactly as it is published — `PaulG-11167`, not
  "Paul G", not "a customer in Flint"
- the date it was left
- the word **Yell** or **Google** in plain text
- a link to the original

No Yell logo. No Google logo. No badges, no stars-and-brand-colour graphics.
Those are other companies' trademarks, and Yell's yellow on Andy's own site
would imply he's paying them for an endorsement. He isn't.

### 4. The 4.9 goes in visible text. It does **not** go in the structured data.

The rating is printed on the front page with its source and the date it was
recorded, and it links to the listing.

It is deliberately **not** included as `aggregateRating` in the site's
structured data (the invisible machine-readable block that can make star ratings
show up in Google's search results). It is against Google's structured-data
policy to mark up ratings you collected from a third-party site about yourself,
and the penalty is a manual action against the whole domain.

For a business whose entire pitch is "this man is verifiably good", getting
penalised for faking verification would be the single worst possible outcome. So
we don't. **Do not add it, however tempting the stars look.**

### 5. Invent nothing.

No extra reviews. No "over 100 happy customers". No "as featured in". No star
graphic that isn't backed by a real, countable review. If we don't know it, the
site doesn't say it.

---

## Why every excerpt is currently blank

Open `content/reviews.ts` and you'll see five reviews with real names, real
dates and real subject matter — and `excerpt: null` on every one.

That's not an oversight. Rule 1 says excerpts must be **verbatim**, and verbatim
means copied off the listing by someone looking at it. Yell blocks automated
access, so nothing could read the wording. Writing something that sounded about
right would have broken rules 2 and 5 in one go, in 72-point type, on the front
page.

So the site currently shows what is actually known: that a named person left a
review on a named date about a named job, and here is the link to it. It puts no
words in anybody's mouth.

**Filling these in is a fifteen-minute job for anyone with the listing open.**
It's the single highest-value thing left to do on this site.

---

## How to add an excerpt

1. Open the Yell listing: <https://www.yell.com/biz/a-edwards-decorating-flint-7648594/>
2. Find the review — they're listed by reviewer name and date, same as in the file.
3. Read it, and pick the sharpest run of **thirty words or fewer**. One
   continuous passage. Don't stitch two bits together.
4. Open `content/reviews.ts` and find that review's block.
5. Replace `excerpt: null` with the words, in quotes:

   ```ts
   {
     id: 'yell-darrenj-427',
     source: 'yell',
     reviewer: 'DarrenJ-427',
     date: '2025-08-26',
     rating: 5,                                   // ← if the listing shows it
     excerpt: 'the exact words, copied and pasted',   // ← here
     job: 'Full exterior repaint',
     sourceUrl: yellListingUrl,
   },
   ```

6. Save it, and run `npm run check:content` to see what's left.

The build checks your work. It will refuse to build if an excerpt is over thirty
words, if it contains `...` or `…` (which is how stitched-together quotes give
themselves away), or if a review has no link to its source.

### What if the words won't fit in thirty?

Pick a different thirty. Don't trim theirs and don't paraphrase. If no thirty
words in that review work, skip it — there are 33 others.

---

## Adding a whole new review

When Andy gets his next five-star, add a block to the `reviews` array in
`content/reviews.ts`. Copy the shape of an existing one and change:

- `id` — anything unique. `yell-` or `google-` plus the reviewer name works.
- `source` — `'yell'`, `'google'`, or `'website'`.
- `reviewer` — their display name, exactly as published.
- `date` — as `YYYY-MM-DD`.
- `rating` — 1 to 5, or `null` if the listing doesn't show a per-review score.
- `excerpt` — thirty words or fewer, verbatim, or `null` for now.
- `job` — what it evidences. "Three bedrooms", "exterior render and woodwork".
- `sourceUrl` — a link to it. Required, always.

Nothing else needs changing. `/reviews` picks it up, the counter on the front
page picks it up, and the filter picks it up.

### Reviews left on this site

If Andy later gathers reviews through his own website rather than Yell or
Google, they use `source: 'website'` and they must also carry
`permission: true` — meaning that customer actually said it was fine to publish
their words. The build refuses to compile a website review without it.

---

## Updating the rating figure

`yellRating` at the top of `content/reviews.ts` holds the 4.9, the count of 34,
and the split of 32 five-star and 2 four-star. When those change:

1. Update the numbers.
2. Update `recorded` to today's date — it's printed on the site next to the
   figure, so people know how fresh it is.
3. Leave `seenOnListing: true` alone if a person has actually just looked at the
   listing. If they haven't, set it back to `false`.

---

## The one-line version

**Short, exact, attributed, linked. If in doubt, leave it out.**
