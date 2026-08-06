export type Testimonial = {
  quote: string;
  name: string;
  town: string;
  job: string;
};

/**
 * REAL customer testimonials. This ships EMPTY on purpose.
 *
 * The five below are written examples — the names and the quotes are invented,
 * written to show the section's tone and to size the layout. Publishing them as
 * genuine reviews is not a grey area in the UK: the Digital Markets,
 * Competition and Consumers Act 2024 makes fake consumer reviews a banned
 * practice, enforceable by the CMA without going to court. So they sit in
 * `sampleTestimonials`, the section renders nothing while `testimonials` is
 * empty, and the site is safe to put live today.
 *
 * To turn the section on: move real quotes into `testimonials` below. Ask each
 * customer first — a text message saying "happy for me to put that on the
 * website?" is enough, and keep the reply. Three good ones beat ten bland ones,
 * and a town name plus the job does more work than a surname.
 */
export const testimonials: Testimonial[] = [];

/** Examples only. Never move these into `testimonials`. */
export const sampleTestimonials: Testimonial[] = [
  {
    quote:
      "He turned up when he said he would, every single day. The hallway had been half-finished by someone else for a year and it took him two days to put right.",
    name: "Rachel Whitmore",
    town: "Frodsham",
    job: "Hall, stairs and landing",
  },
  {
    quote:
      "We got three quotes. His was the middle one and the only one that explained what the preparation involved. That told us everything.",
    name: "Daniel Okafor",
    town: "Chester",
    job: "Full exterior repaint",
  },
  {
    quote:
      "The kitchen looks like a new one and cost a fifth of what we had been quoted for replacement units. Two years on and there is not a chip on it.",
    name: "Priya Chandrasekhar",
    town: "Wilmslow",
    job: "Sprayed kitchen",
  },
  {
    quote:
      "Worked around our patients for two weekends and left the place spotless both times. You would not have known anyone had been in.",
    name: "Mr S. Bhatt",
    town: "Northwich",
    job: "Dental practice",
  },
  {
    quote:
      "Twelve drops of mural with no repeat and the seams are invisible. The last decorator we used gave up on the same paper.",
    name: "Eleanor Hartley",
    town: "Knutsford",
    job: "Dining room mural",
  },
  {
    quote:
      "Dust sheets down before he opened a tin, and he hoovered up at the end of every day. Small things, but that is why we had him back for the bedrooms.",
    name: "Tom Ainsworth",
    town: "Tarporley",
    job: "New build redecoration",
  },
];
