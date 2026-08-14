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
    quote:
      "james did a great job on painting the outside of my house. i would highley reccomend. thanks again james. deffinatley a 5* service.",
    name: "Natalie Chittick",
    date: "January 2017",
  },
];
