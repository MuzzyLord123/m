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
 * SHORTENED IS NOT THE SAME AS EDITED, and three of these are shortened. On
 * Facebook a long recommendation is cut off behind a "See more" link, so what
 * the screenshots showed of Daniel Hewitt's, Debbie Sindall's and Gary
 * Wakefield's reviews was not the whole thing — Debbie's stopped mid-word at
 * "genuine, happy pers…". Where that happened the quote here is a CONTIGUOUS
 * run from the start of the review, ending at a full stop. Nothing is spliced
 * from two places, nothing is reworded, and no missing text is guessed at. If
 * the full versions are wanted, open the review on Facebook, press See more and
 * paste the rest in.
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
 * That link is also why the header does NOT claim a number. "11 recommendations
 * on Facebook" would be asserting a total nobody here has counted, while
 * excluding one — a claim that is both unverifiable and unflattering the moment
 * someone does count.
 *
 * NO TOWN OR JOB FIELD any more. The old shape asked for both, and a Facebook
 * recommendation gives neither. Inventing "Chester" or "Hall, stairs and
 * landing" to fill a layout would be making up part of a review, so the type
 * lost the fields rather than the data gaining guesses.
 *
 * ADDING MORE. Append to the array. The switcher reads its length, so the
 * count in the eyebrow, the ticks and the rotation all follow automatically —
 * there is no second place to update.
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
