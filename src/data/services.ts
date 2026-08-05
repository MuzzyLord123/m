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

export const services: Service[] = [
  {
    id: "interior",
    title: "Interior decorating",
    summary:
      "Walls, ceilings and woodwork in occupied homes. Sheets down first, hoovered at the end of every day.",
    lead: "Most of what we do. Whole houses, single rooms, and the jobs somebody else started and left.",
    scope: [
      "Filling, sanding and making good before any paint is opened",
      "Two full coats as standard, never one heavy one",
      "Woodwork rubbed down and finished in water-based satin or eggshell",
      "Ceilings cut in by hand where coving or cornice makes tape a bad idea",
      "Furniture moved and covered, floors protected, room put back each evening",
    ],
    faqs: [
      {
        question: "Do we need to move out?",
        answer:
          "Almost never. We work room by room so you keep the rest of the house. On a full repaint we agree the order with you so the kitchen and one bedroom are always usable.",
      },
      {
        question: "How long does a typical room take?",
        answer:
          "A bedroom in sound condition is a day and a half. A hall, stairs and landing is usually three to four days because of the access and the cutting in.",
      },
      {
        question: "Do you supply the paint?",
        answer:
          "Yes, at trade price, and the saving is passed on. If you would rather choose and buy your own, that is fine — we will tell you how much you need.",
      },
    ],
    image: "/work/project-1-01.png",
    tone: "#cfd3d8",
  },
  {
    id: "exterior",
    title: "Exterior painting",
    summary:
      "Render, masonry, fascias, windows and doors. Weather-dependent work, honestly scheduled.",
    lead: "Exterior work lives or dies on preparation and on picking the right week. We do both properly.",
    scope: [
      "Render repairs, crack stitching and stabilising solution where it is needed",
      "Two coats of breathable masonry paint, brush cut and rollered",
      "Fascias, soffits, guttering and downpipes while the access is up",
      "Timber windows burnt off, primed, undercoated and finished",
      "Work planned around the forecast — we will move a date rather than paint onto damp",
    ],
    faqs: [
      {
        question: "What happens if it rains?",
        answer:
          "We stop. Masonry paint applied to a damp wall fails within two winters. You will get a call the night before if the forecast has turned, and we pick the job back up at the next dry spell.",
      },
      {
        question: "How long will an exterior repaint last?",
        answer:
          "On sound, properly prepared render, ten to twelve years for the walls. South and west elevations weather faster than the rest of the house.",
      },
      {
        question: "Do you arrange scaffolding?",
        answer:
          "Yes. For most semis and terraces a tower is enough. Anything three storeys or with a steep approach gets proper scaffold, priced separately and shown on the quote.",
      },
    ],
    image: "/work/project-2-01.png",
    tone: "#c8bcb4",
  },
  {
    id: "wallpapering",
    title: "Wallpapering",
    summary:
      "Feature walls, full rooms, murals and heavy grasscloth. Lined and sized before hanging.",
    lead: "Paper shows every shortcut. Walls get lined and sized, and the pattern gets planned before the first drop.",
    scope: [
      "Old paper stripped and walls made good, not papered over",
      "Lining paper where the plaster needs it, cross-lined on difficult walls",
      "Pattern set out from the focal point so joins land where nobody looks",
      "Murals and panoramics planned drop by drop before hanging",
      "Grasscloth, foils and hand-printed papers handled to the maker's instructions",
    ],
    faqs: [
      {
        question: "How much paper should I order?",
        answer:
          "Send us the room dimensions and the pattern repeat and we will work it out. Order one extra roll from the same batch — batches vary and a mid-wall repair a year later is impossible without it.",
      },
      {
        question: "Can you paper over textured walls?",
        answer:
          "Not directly. Textured coating has to come off or be skimmed, then lined. We will tell you which is cheaper for your room.",
      },
      {
        question: "Do you hang customer-supplied paper?",
        answer:
          "Yes, and most of our papering is exactly that. We will check the batch numbers match before we start.",
      },
    ],
    image: "/work/project-3-01.png",
    tone: "#aab3a4",
  },
  {
    id: "spray",
    title: "Spray finishing",
    summary:
      "Kitchens, staircases, wardrobes and doors. A factory finish with no brush marks.",
    lead: "Spraying is a preparation job with a short painting stage at the end. Masking is most of the week.",
    scope: [
      "Kitchen doors and drawer fronts degreased, keyed, primed and sprayed",
      "In-situ spraying of staircases, spindles and fitted wardrobes, fully masked",
      "Two-pack and water-based lacquers depending on the surface and the use",
      "Doors and hardware removed, numbered and refitted with new fixings",
      "Colour matched to any manufacturer's fan deck",
    ],
    faqs: [
      {
        question: "Is a sprayed kitchen as tough as a new one?",
        answer:
          "On solid or well-bonded doors, yes. The lacquer is harder than most factory finishes. On damaged laminate or chipboard that has swollen, replacement is the honest answer and we will say so.",
      },
      {
        question: "How long is the kitchen out of use?",
        answer:
          "Doors are off for three to four days. The carcasses stay in place and you keep the worktops, sink and appliances the whole time.",
      },
      {
        question: "Does the house fill with fumes?",
        answer:
          "No. Doors are sprayed off-site in a controlled space. In-situ work uses water-based products and full containment, and we ventilate as we go.",
      },
    ],
    image: "/work/project-4-01.png",
    tone: "#d5c9b6",
  },
  {
    id: "commercial",
    title: "Commercial",
    summary:
      "Offices, surgeries, shops and lettings. Phased, out of hours, insured and inducted.",
    lead: "Work planned around your opening hours, not ours. Nights and weekends where that is what it takes.",
    scope: [
      "Out-of-hours and weekend phasing so trading never stops",
      "Low-odour, scrubbable and anti-bacterial coatings where the use demands it",
      "RAMS supplied before we start, £2m public liability cover, site inductions attended",
      "End-of-tenancy and void turnarounds to a fixed date",
      "Single point of contact and a written programme for multi-floor work",
    ],
    faqs: [
      {
        question: "Can you work nights?",
        answer:
          "Yes. Surgeries, salons and shops are usually done between close and open, or across weekends. It costs a little more per day and saves far more in lost trade.",
      },
      {
        question: "Do you provide risk assessments?",
        answer:
          "Yes, before the first visit, along with insurance certificates and any inductions your building requires.",
      },
      {
        question: "How do you price larger contracts?",
        answer:
          "By measured schedule, room by room, with a written programme. You get a fixed price and a date, not a day rate that drifts.",
      },
    ],
    image: "/work/project-10-01.png",
    tone: "#c6cbd0",
  },
];

export const howItWorks = [
  {
    step: "01",
    title: "Quote",
    body: "We come and look at the job, measure up and talk through the finish. A written price lands in your inbox within 48 hours, itemised so you can see what the preparation costs.",
  },
  {
    step: "02",
    title: "Schedule",
    body: "Pick a start date that suits you. You get a written programme, a firm arrival time and a name and number for the person who will actually be in your house.",
  },
  {
    step: "03",
    title: "Fresh coat",
    body: "Sheets down, edges cut by hand, room put back and hoovered every evening. Nothing is called finished until you have walked it with us in daylight.",
  },
];
