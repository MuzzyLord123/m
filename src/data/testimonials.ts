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
 * same objection as inventing one, at a smaller scale. One review has several
 * spelling mistakes; it stays as written. If James would rather it did not
 * appear at all, delete the entry — that is a fair choice, and a different one
 * from rewriting it.
 *
 * SHORTENED IS NOT THE SAME AS EDITED, and four of these are shortened. On
 * Facebook a long recommendation is cut off behind a "See more" link, so what
 * the screenshots showed of Debbie Sindall's, Daniel Hewitt's, Paul Hughes's and
 * Gina Kirkham's reviews was not the whole thing — Debbie's stopped mid-word at
 * "genuine, happy pers…" and Gina's at "very little disrupt…". Where that
 * happened the quote here is a CONTIGUOUS run from the start of the review,
 * ending at a full stop. Nothing is spliced from two places, nothing is
 * reworded, and no missing text is guessed at. If the full versions are wanted,
 * open the review on Facebook, press See more and paste the rest in.
 *
 * ONE NAME IS TRIMMED, and only one. Facebook shows Helen Munroe as
 * Helen 'phillip-boag' Munroe, because it renders the optional nickname field
 * inside the display name. That quoted fragment is a Facebook artefact rather
 * than part of her name or her review, and it is very likely a former surname,
 * so the entry reads "Helen Munroe". Nothing else about any name is changed —
 * this is dropping a platform's UI furniture, not anonymising a reviewer.
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
 * unflattering the moment someone does count.
 *
 * NO TOWN OR JOB FIELD any more. The old shape asked for both, and a Facebook
 * recommendation gives neither. Inventing "Chester" or "Hall, stairs and
 * landing" to fill a layout would be making up part of a review, so the type
 * lost the fields rather than the data gaining guesses.
 *
 * ADDING MORE. Append to the array. The switcher reads its length, so the ticks
 * and the rotation follow automatically — there is no second place to update.
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
    quote:
      "James is a professional, honest tradesman who has done a fantastic job. We will definitely have him back for future projects",
    name: "Cathy Lockett",
    date: "September 2018",
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
      "I'm very pleased with all the work James has done. He is tidy, always on time, reliable and his preparation and painting is outstanding. Would recommend and definitely use him again.",
    name: "Suzanne",
    date: "February 2017",
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
      "Thank you so much James for the fab job you've done with our hall, stairs, landing and living room. It looks amazing. Totally transformed. The time and effort you put into your work here has really paid off. Thanks again xx",
    name: "Leanne Styles",
    date: "February 2018",
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
      "Would highly recommend James, trustworthy, reliable and hard working cannot believe how much he has done in such a short space of time, loving my house it looks like new, lovely fella! Will definitely have him back for further work nice to find someone who does the job properly and you can trust! Thanks James",
    name: "Ruth Rossiter",
    date: "February 2017",
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
      "james did a great job on painting the outside of my house. i would highley reccomend. thanks again james. deffinatley a 5* service.",
    name: "Natalie Chittick",
    date: "January 2017",
  },
];
