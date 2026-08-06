export type Service = {
  id: string;
  title: string;
  /** Deck line for the home page overview. */
  summary: string;
  /** Longer lead for the service page mini-hero. */
  lead: string;
  scope: string[];
  faqs: { question: string; answer: string }[];
  image: string;
  tone: string;
};

/**
 * The six trades, written from what James actually does rather than from a
 * generic decorator's list.
 *
 * The previous set carried Wallpapering and Spray finishing, which nothing in
 * the photographs evidenced and which he does not name as specialisms — while
 * halls, stairs and landings, the single largest body of work he sent (18
 * photographs across five projects), had no section at all. Every service here
 * has photographs behind it.
 */
export const services: Service[] = [
  {
    id: "interior",
    title: "Interior decorating",
    summary:
      "Bedrooms, living rooms and everything in between. Sheets down first, hoovered at the end of every day.",
    lead: "The bulk of the work. Whole houses, single rooms, and the jobs somebody else started and left.",
    scope: [
      "Filling, sanding and making good before any tin is opened",
      "Two full coats as standard, never one heavy one",
      "Woodwork rubbed down and finished in water-based satin or eggshell",
      "Ceilings cut in by hand where coving or cornice makes tape a bad idea",
      "Feature walls in deep colours, rolled to a flat finish with no framing",
      "Furniture moved and covered, floors protected, the room put back each evening",
    ],
    faqs: [
      {
        question: "Do we need to move out?",
        answer:
          "Almost never. We work room by room so you keep the rest of the house. On a full repaint we agree the order with you, so the kitchen and one bedroom are always usable.",
      },
      {
        question: "How long does a typical room take?",
        answer:
          "A bedroom in sound condition is a day and a half. Add a day if the woodwork has been glossed before and needs taking back.",
      },
      {
        question: "Do you supply the paint?",
        answer:
          "Yes, at trade price, and the saving is passed on. If you would rather choose and buy your own, that is fine — we will tell you exactly how much you need.",
      },
    ],
    image: "/work/feature-01.jpg",
    tone: "#968970",
  },
  {
    id: "halls",
    title: "Halls, stairs & landings",
    summary:
      "The hardest room in the house to paint well, and the first thing anyone sees. Panelling, spindles and all.",
    lead:
      "More of our work than any other single job. Access, height and hand-cut edges — the part most decorators price high and rush.",
    scope: [
      "Balustrades, spindles and newel posts taken back and finished by hand",
      "Panelling and dado fitted, filled and painted, or painted if already there",
      "Stairwell ceilings and high walls reached properly, on boards rather than a stretched ladder",
      "Understairs cupboards and doors finished to match",
      "Carpet and treads fully protected, the stairs usable every evening",
    ],
    faqs: [
      {
        question: "Can we still use the stairs while you work?",
        answer:
          "Yes. It is the one room nobody can do without, so it is sheeted and left walkable every night, and we never leave wet paint across a whole flight.",
      },
      {
        question: "How long does a hall, stairs and landing take?",
        answer:
          "Three to four days for a standard three-bed. Panelling or a full spindle set takes it to a week — most of that is preparation, not painting.",
      },
      {
        question: "Do you fit the panelling as well?",
        answer:
          "Yes. Several of the halls in the gallery were bare walls first: battens set out, filled, caulked and painted so the joints disappear.",
      },
    ],
    image: "/work/panelled-hallway-01.jpg",
    tone: "#737070",
  },
  {
    id: "kitchens",
    title: "Kitchens, bathrooms & wet rooms",
    summary:
      "Rooms that live with steam and splashes. Different paint, different preparation, finishes that last.",
    lead:
      "Damp rooms punish an ordinary emulsion. These are specified and prepared differently from the start.",
    scope: [
      "Moisture-resistant and scrubbable finishes where steam and splashing live",
      "Existing units and cupboard doors rubbed down and refinished rather than replaced",
      "Tiling grout lines, splashbacks and reveals cut in by hand",
      "Extractor housings, boiler cupboards and pipe boxing painted to match",
      "Mould treated and sealed before anything goes over it, never painted straight over",
    ],
    faqs: [
      {
        question: "Can you repaint kitchen units instead of replacing them?",
        answer:
          "Usually, and it is a fraction of the cost of new units. They come off, get degreased, keyed and finished properly — not brushed in place.",
      },
      {
        question: "How long before we can use the shower again?",
        answer:
          "Overnight is enough for the paint to take the humidity. We will tell you on the day rather than guess in a quote.",
      },
      {
        question: "There is mould in the bathroom corner. Is that a problem?",
        answer:
          "Not for us, but it has to be treated and sealed first. Painting over it hides it for about four months and then it comes back through.",
      },
    ],
    image: "/work/open-plan-kitchen-01.jpg",
    tone: "#867a6b",
  },
  {
    id: "extensions",
    title: "Extensions & loft conversions",
    summary:
      "New plaster, first coats and full decoration. We come in after the builders and finish the room.",
    lead:
      "A new room is a different job from a repaint: fresh plaster, no existing finish to match to, and every edge cut for the first time.",
    scope: [
      "Fresh plaster given a proper mist coat, thinned and worked in, never neat emulsion",
      "New skirting, architrave and doors primed and finished",
      "Vaulted ceilings, roof-light reveals and angled returns cut in by hand",
      "Bifold and slider reveals finished square to the frame",
      "Snagging after the builders — filled, sanded and made good before decoration starts",
    ],
    faqs: [
      {
        question: "When should we get you in?",
        answer:
          "Once the plaster is dry and the second fix is done. Ring while the build is still going and we will book the slot rather than make you wait.",
      },
      {
        question: "The plasterer says it needs a mist coat. Is that included?",
        answer:
          "Yes, always, and it is not an extra. New plaster that is painted straight is the single most common reason a new room peels within a year.",
      },
      {
        question: "Do you work with our builder?",
        answer:
          "Happily. Most of the extensions in the gallery came through a builder we work with regularly.",
      },
    ],
    image: "/work/kitchen-extension-06.jpg",
    tone: "#8c8780",
  },
  {
    id: "exterior",
    title: "Exterior painting",
    summary:
      "Houses, buildings, shops, garages, sheds and fences. Weather-dependent work, honestly scheduled.",
    lead:
      "Render, masonry, timber and metal, prepared for the weather it actually has to stand rather than the weather on the day.",
    scope: [
      "Render and masonry washed down, stabilised and cut back to sound material",
      "Fascias, soffits, bargeboards and gutters finished in place",
      "Windows, doors, bays and sills cut in by hand",
      "Garages, sheds, outbuildings and fencing treated and finished",
      "Shopfronts and commercial frontages, out of trading hours where needed",
    ],
    faqs: [
      {
        question: "What happens if it rains?",
        answer:
          "We stop. Paint put on damp masonry fails within a season. You get a call the same morning and a new date, not a silent no-show.",
      },
      {
        question: "How long will an exterior last?",
        answer:
          "Eight to ten years on render that has been prepared properly, less on a coastal-facing elevation. Around the Wirral coast we specify accordingly.",
      },
      {
        question: "Do you do fences and sheds on their own?",
        answer:
          "Yes. Small jobs are still jobs, and they are usually done in a day.",
      },
    ],
    image: "/work/exterior-02.jpg",
    tone: "#6a7a85",
  },
  {
    id: "commercial",
    title: "Commercial",
    summary:
      "Shops, offices, units and lettings. Phased, out of hours, insured and inducted.",
    lead:
      "Commercial and domestic in the same week. Work that has to happen around a business that is still trading.",
    scope: [
      "Evening, weekend and phased working so trading is not interrupted",
      "Units and voids turned around between tenancies to a deadline",
      "Suspended ceilings, screed floors and service runs worked around",
      "£2m public liability cover, site inductions and method statements as required",
      "One point of contact and a written programme before anyone arrives",
    ],
    faqs: [
      {
        question: "Can you work outside our opening hours?",
        answer:
          "Yes, and it is usually the sensible way to do it. Most shop and surgery work is done evenings and weekends.",
      },
      {
        question: "Do you have the paperwork our managing agent will ask for?",
        answer:
          "Public liability certificate, method statement and risk assessment, sent before the start date rather than chased on the morning.",
      },
      {
        question: "How quickly can a void be turned around?",
        answer:
          "A one-bed flat between tenancies is two to three days. Tell us the check-in date and we will work back from it.",
      },
    ],
    image: "/work/commercial-01.jpg",
    tone: "#958e85",
  },
];

export const howItWorks = [
  {
    step: "01",
    title: "Quote",
    body: "James comes and looks at the job, measures up and talks through the finish. A written price lands in your inbox within 48 hours, itemised so you can see what the preparation costs.",
  },
  {
    step: "02",
    title: "Schedule",
    body: "Pick a start date that suits you. You get a written programme, a firm arrival time, and the number of the man who will actually be in your house.",
  },
  {
    step: "03",
    title: "Fresh coat",
    body: "Sheets down, edges cut by hand, the room put back and hoovered every evening. Nothing is called finished until you have walked it with us in daylight.",
  },
];
