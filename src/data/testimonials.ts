export type Testimonial = {
  /** The review, VERBATIM. See the note on wording below. */
  quote: string;
  name: string;
  /** As shown on the review itself, e.g. "February 2017". */
  date: string;
};

/**
 * REAL customer reviews, taken from the recommendations on the client's own
 * Facebook page: facebook.com/thepaintmen
 *
 * WHY THAT PROVENANCE MATTERS. This file used to ship empty with a set of
 * written examples parked in `sampleTestimonials`, because publishing invented
 * reviews is not a grey area in the UK — the Digital Markets, Competition and
 * Consumers Act 2024 makes fake consumer reviews a banned practice, enforceable
 * by the CMA without going to court. Everything below is a real review left by
 * a real customer on a public page. The examples are gone; there is no longer
 * anything here that could be published by accident.
 *
 * QUOTED VERBATIM, INCLUDING THE TYPOS. Nothing is reworded, recapitalised or
 * tidied. These are attributed to named people, and editing someone's words
 * while keeping their name on them misrepresents what they said — which is the
 * same objection as inventing one, at a smaller scale. Several have spelling
 * slips, stray spaces before commas, a comma where a full stop belongs, ".."
 * for an ellipsis and a sign-off in emoji; they stay as written. If James would
 * rather one did not appear at all, delete the entry — that is a fair choice,
 * and a different one from rewriting it.
 *
 * SHORTENED IS NOT THE SAME AS EDITED, and five of these are shortened. Every
 * one is a CONTIGUOUS run from the start of the review, ending at a full stop.
 * Nothing is spliced from two places, nothing is reworded, and no missing text
 * is guessed at. There are two different reasons for it, and they are worth
 * keeping apart:
 *
 *   - FACEBOOK CUT IT, for Debbie Sindall's, Daniel Hewitt's, Paul Hughes's and
 *     Gina Kirkham's. A long recommendation hides its tail behind a "See more"
 *     link, so the screenshots did not show the whole thing — Debbie's stopped
 *     mid-word at "genuine, happy pers…" and Gina's at "very little disrupt…".
 *     The rest was never available to paste. If the full versions are wanted,
 *     open the review on Facebook, press See more and paste the rest in.
 *
 *   - WE CUT IT, for Frankie Williams's, and only that one. Her screenshot was
 *     expanded, so the full text was there: about 770 characters, roughly double
 *     the longest review here. Every slide shares one grid cell sized to the
 *     longest, so carrying it whole would have added around 260px of height to a
 *     section that sits on the home page — against a brief that says it must not
 *     bloat the home page. The alternative was a fifth, smaller type step, and
 *     18px is already the floor (see sizeFor in Testimonials.tsx). So the quote
 *     is the opening of hers rather than all of it.
 *
 * Both cuts drop praise and nothing else, so every excerpt here understates its
 * review rather than flattering it. That is the direction an excerpt is allowed
 * to err in; the reverse would not be.
 *
 * ONE QUOTE DROPS A LEADING LINE. Carla May's begins with "5 Star" on a line of
 * its own, above the prose. It is a rating label rather than something she
 * wrote as a sentence, and the rail sets each review as one flowing paragraph,
 * so running it in would produce "5 Star James painted our house exterior…" — a
 * sentence she did not write. It is dropped rather than inlined. Note which way
 * that cuts: it removes a five-star rating, so the entry understates her review
 * rather than flattering it, and the site claims no star ratings anywhere.
 *
 * TWO NOTES ON NAMES, and no other name is touched.
 *   - Facebook shows Helen Munroe as Helen 'phillip-boag' Munroe, because it
 *     renders the optional nickname field inside the display name. That quoted
 *     fragment is a Facebook artefact rather than part of her name, and very
 *     likely a former surname, so the byline reads "Helen Munroe". This is
 *     dropping a platform's UI furniture, not anonymising a reviewer.
 *   - Lindz J Vern signs off "Lindsey and Harry V." inside the review, which is
 *     not the name above it. The byline stays as the account name, because that
 *     is what is actually on the page and is what someone checking would find;
 *     the sign-off stays in the quote, because she wrote it. Both are true and
 *     they are allowed to differ.
 *
 * THIS IS A SELECTION, NOT EVERY REVIEW JAMES HAS. One of the screenshots sent
 * over was a two-star "doesn't recommend" from March 2018, and it is not in
 * this file. Choosing which of your own testimonials to display is ordinary and
 * legal — the DMCCA is about fabricating and suppressing-by-faking, not about a
 * business picking its own quotes. But it is a decision, so it is recorded
 * here rather than left as a silent omission: it was left out because a
 * testimonial rail exists to show what happy customers said, and its author
 * plainly is not one. The link in the section header goes to the Facebook page
 * itself, where anyone can read all of them, which is the honest way to publish
 * a selection.
 *
 * That link is also why the header does NOT claim a number. Printing the array's
 * length as "N recommendations on Facebook" would assert a total nobody here has
 * counted, while excluding one — a claim that is both unverifiable and
 * unflattering the moment someone does count. The switcher's own position-over-
 * total counter is a different thing and is fine: it describes THIS rail, which
 * anyone can verify by pressing next, and says nothing about what is on
 * Facebook.
 *
 * NO TOWN OR JOB FIELD any more. The old shape asked for both, and a Facebook
 * recommendation gives neither. Inventing "Chester" or "Hall, stairs and
 * landing" to fill a layout would be making up part of a review, so the type
 * lost the fields rather than the data gaining guesses.
 *
 * ADDING MORE. Append to the array. The switcher reads its length, so the
 * counter, the progress bar and the rotation all follow automatically — there is
 * no second place to update.
 *
 * THE ORDER IS NOT CHRONOLOGICAL, AND THAT IS DELIBERATE. These run long, short,
 * long so that consecutive slides are visibly different sizes — the switcher
 * sets each review at a size chosen from its length, so three long ones in a row
 * means three near-identical screens and the rail stops looking like it is
 * moving. After appending, drag the new entry to sit beside a review of a
 * different length. Nothing breaks if you do not; it just reads flatter.
 */
export const testimonials: Testimonial[] = [
  {
    quote: "You couldn't get a more reliable, friendly, trustworthy guy like James.",
    name: "Helen Preston",
    date: "May 2017",
  },
  {
    quote:
      "We would highly recommend James to you. He takes much pride in his work and the result is always impeccable. Friendly, approachable, reliable and trustworthy. Book him in today !",
    name: "Louise Michelle",
    date: "May 2017",
  },
  {
    /* Shortened: the review continues past "whilst we were out." behind
       Facebook's "See more", and the visible text ended mid-word at "very little
       disrupt". */
    quote:
      "James has just completed our hall, stairs, landing, kitchen and breakfast room. We're absolutely delighted with the standard of his work, his attention to detail and his friendliness. Completely trustworthy, we had no qualms whatsoever to leave him in our home whilst we were out.",
    name: "Gina Kirkham",
    date: "September 2018",
  },
  {
    quote:
      "James is a professional, honest tradesman who has done a fantastic job. We will definitely have him back for future projects",
    name: "Cathy Lockett",
    date: "September 2018",
  },
  {
    /* The only reviewer who shares the decorator's first name. "Thanks again,
       James!" is addressed to James Young; the byline is James Churchill. Both
       are as written. */
    quote:
      "Just had James in to paint our hall and stairs, and would definitely use him again. Really easy to deal with; came out straight away to quote, agreed a timeframe and price, and showed up on time (which is so rare these days!). Finished the job on time and we're delighted with the results. He also worked away quietly with his earphones in, so I was able to work from home without being disturbed. Thanks again, James!",
    name: "James Churchill",
    date: "July 2019",
  },
  {
    quote:
      "I'm very pleased with all the work James has done. He is tidy, always on time, reliable and his preparation and painting is outstanding. Would recommend and definitely use him again.",
    name: "Suzanne",
    date: "February 2017",
  },
  {
    quote:
      "Thank you so much James for the fab job you've done with our hall, stairs, landing and living room. It looks amazing. Totally transformed. The time and effort you put into your work here has really paid off. Thanks again xx",
    name: "Leanne Styles",
    date: "February 2018",
  },
  {
    /* Shortened: the review continues past "impressive." behind Facebook's
       "See more", and the visible text ended mid-word at "genuine, happy pers". */
    quote:
      "I had been looking for a good / reliable painter, James was recommended to me and I'm delighted with the job he did for us, our house looks amazing, his attention to detail is impressive.",
    name: "Debbie Sindall",
    date: "April 2018",
  },
  {
    /* ".." twice, and three exclamation marks, are Sharon's own punctuation. */
    quote:
      "Highly recommend James to be the 1 stop man for very professional job .. he is a great guy who really takes your home into his project to ensure your home is as important as it is to you and your family .. we are so happy with our newly painted rooms and recommend you take a look at his page for the evidence of a job well done!!!",
    name: "Sharon Brewer",
    date: "October 2019",
  },
  {
    quote:
      "Thank you James for the fabulous job you did painting the exterior of my house. I really can't fault James' service at all; great paint work and he couldn't have been more helpful. 100% recommend",
    name: "Jane Harrison",
    date: "August 2017",
  },
  {
    /* "Helen 'phillip-boag' Munroe" on Facebook — see the note on names above. */
    quote:
      "Absolutely delighted at the work done in my house. Can't fault anything. Would recommend James without a second thought. All work completed to the highest standard including some extra little jobs that weren't even on the list!",
    name: "Helen Munroe",
    date: "July 2018",
  },
  {
    /* Written as four short lines; run together here as one paragraph, which is
       how every other multi-line review in this file is handled. The trailing
       emoji are his and are kept — they fall back to the system emoji font,
       which is why they survive the display face being a subset. */
    quote:
      "James recently painted our house exterior in not so great weather... We're very happy with the huge difference/look of the house in its new colour. James is reliable and dependable. Thanks very much 😊🏡",
    name: "Paul John",
    date: "October 2019",
  },
  {
    /* Shortened: the review continues past "professional approach." behind
       Facebook's "See more", and the visible text ended mid-sentence at "your
       pricing is more than reasonable and certainly challenging".

       "just as you stated as you stated it would be" is how Paul wrote it. It is
       not a transcription slip and it is not to be tidied — see the note on
       verbatim quoting above. */
    quote:
      "Thank you so much James for the job that you have completed in our living room, the finished result is absolute perfection, exactly how we wanted it to be and also just as you stated as you stated it would be when you first came round to give us a quote. You are a really nice guy who is easy to speak to and throughout our project always maintained a professional approach.",
    name: "Paul Hughes",
    date: "August 2018",
  },
  {
    quote:
      "James did a wonderful job painting our house, and we would have no hesitation in recommending him. He was very professional, always cheerful, having to cope with the vagaries of our weather.",
    name: "Lynn Littler",
    date: "October 2017",
  },
  {
    quote:
      "I highly recommend James. He's hardworking, very professional and friendly. Can't believe the work he did in one day! And managed to squeeze us in last minute aswell. Thank you so much. We will definitely be getting James to do more work for us.",
    name: "Nicki Lawlor",
    date: "February 2017",
  },
  {
    /* Opened with "5 Star" on its own line, which is dropped — see the note on
       that above. "Thoroughly nice guy, Would definitely" is hers. */
    quote:
      "James painted our house exterior and did a great job at a very reasonable price. Thoroughly nice guy, Would definitely use James again and can't recommend him highly enough. Thanks James!",
    name: "Carla May",
    date: "April 2020",
  },
  {
    quote:
      "Would highly recommend James, trustworthy, reliable and hard working cannot believe how much he has done in such a short space of time, loving my house it looks like new, lovely fella! Will definitely have him back for further work nice to find someone who does the job properly and you can trust! Thanks James",
    name: "Ruth Rossiter",
    date: "February 2017",
  },
  {
    /* "A fantastic job , fantastic price" — the space before the comma is his. */
    quote:
      "Fantastic service, from the initial quote to the completion, painted the outside of our house and he was brilliant. A fantastic job , fantastic price and very professional, Thank you James for an amazing job",
    name: "John Carroll",
    date: "June 2020",
  },
  {
    /* Signed "Lindsey and Harry V." under a "Lindz J Vern" account — see the
       note on names above. */
    quote:
      "James painted the front of our house. Great job, excellent price and, despite some bad weather, completed in good time. James is a really nice guy, friendly but professional. Will certainly contact him again for our next job. Thanks James. Lindsey and Harry V.",
    name: "Lindz J Vern",
    date: "August 2020",
  },
  {
    quote:
      "james did a great job on painting the outside of my house. i would highley reccomend. thanks again james. deffinatley a 5* service.",
    name: "Natalie Chittick",
    date: "January 2017",
  },
  {
    /* Shortened: the review continues past "second to none." behind Facebook's
       "See more". */
    quote:
      "James has just completed a full re-paint of a large 3 bedroom semi-detached house that had just been plastered throughout in just over three weeks. Literally cannot fault the job he has done, attention to detail is second to none.",
    name: "Daniel Hewitt",
    date: "January 2018",
  },
  {
    quote:
      "Just had our conservatory painted by James and we couldn't be happier, really excellent job done without any fuss or mess. He's a busy man so we had to wait a couple of weeks but it's worth the wait!",
    name: "Ed Naylor",
    date: "October 2020",
  },
  {
    /* "James done my hall" and "He also done my bathroom" are hers, as are the
       two hearts. */
    quote:
      "James done my hall, stairs and landing. He also done my bathroom and kitchen, I would highly recommend him. James is an excellent professional, trustworthy, reliable and honest. I had no worries about him being in my home alone while I was in work. James's work is second to none and I would hire him again, very happy customer ❤️❤️",
    name: "Jeanette Tillett",
    date: "October 2020",
  },
  {
    /* SHORTENED BY US, not by Facebook — the only one, and see the note on that
       above. The screenshot showed this one EXPANDED ("See less"), so the full
       review is known: it runs about 770 characters, roughly double the longest
       here, and every slide shares one cell sized to the longest. Carrying it
       whole would have added around 260px to a section that appears on the home
       page, against a brief that it must not bloat the home page.

       This is the opening, contiguous, ending at a full stop. What is cut is
       four more sentences of praise and a sign-off, so the excerpt understates
       the review rather than flattering it. "on the exterior our house" is hers. */
    quote:
      "James has just completed a fabulous job on the exterior our house. He has also decorated two bedrooms and a lounge for us. His work is exemplary and he is a true perfectionist in every sense of the word. He is friendly, approachable, extremely honest and trustworthy and hardworking.",
    name: "Frankie Williams",
    date: "July 2024",
  },
];
