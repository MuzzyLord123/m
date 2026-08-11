/**
 * /hand-painted-kitchens — the specialism, and the main search target.
 *
 * No paint products are named. Which primer and which topcoat depends on what
 * the doors are made of, and naming a product here that Neil does not actually
 * use would be worse than naming none. Confirmed products appear per project,
 * on the specimen strip.
 */

export const kitchens = {
  meta: {
    title: 'Hand-painted kitchens in Chester & Cheshire | Neil Brookfield',
    description:
      'I hand-paint kitchens and furniture in Chester and across Cheshire — doors off, degreased, filled, flatted and primed before any colour goes on. Brushed, not sprayed. Decorating since 1990.',
  },

  eyebrow: 'Hand-painted kitchens',
  heading: 'A kitchen you already own, painted properly.',
  lede: 'Replacing a kitchen that is structurally sound is an expensive way of changing its colour. If the carcasses are solid and the doors are timber or a decent MDF, painting them by hand will change the room completely, and it will cost a fraction of ripping it out.',

  brushedNotSprayed: {
    eyebrow: 'Why brushed',
    heading: 'Sprayed doors come back anonymous.',
    paragraphs: [
      'Spraying gives you a flat, even, factory surface. That is exactly right on a car and slightly wrong in a room with a stone floor and a window down one side, because it reflects light like a machine made it. A brushed finish has a surface to it — you can see the hand in it when you stand close, and from across the room you just see depth.',
      'It also means the work happens in your house rather than in a unit forty miles away, so the doors are off for days rather than weeks, and anything that gets damaged in the fitting gets put right there and then.',
    ],
  },

  process: {
    eyebrow: 'What actually happens',
    heading: 'Most of it happens before any colour goes on.',
    intro: 'This is the order, and the first four steps are the ones that decide how it looks in five years.',
    steps: [
      {
        title: 'I come and open a door',
        body: 'Hinges, edges, the state of the finish, whether it is timber, MDF or wrapped. Not every kitchen is worth painting — if yours is vinyl-wrapped and the wrap is lifting, I will tell you so rather than take the job.',
      },
      {
        title: 'Doors off, hinges labelled',
        body: 'Every door and drawer front comes off and is numbered, and the hinges and handles are bagged with it. It goes back exactly where it came from, which matters on an older kitchen where nothing is quite square.',
      },
      {
        title: 'Degreasing',
        body: 'Kitchen doors carry cooking grease whether or not you can see it, and grease under a topcoat lifts it within a year. Everything is washed down properly, twice around the hob and the kettle.',
      },
      {
        title: 'Filling and flatting',
        body: 'Chips and old screw holes filled, edges made good, then the whole surface sanded back so there is no sheen left anywhere for the primer to slide off. This is the slow part and the part that is invisible when it is done well.',
      },
      {
        title: 'Priming',
        body: 'An adhesion primer chosen for what the doors are actually made of — timber, MDF and a previously sprayed factory finish all want different things. Then it is sanded again, because a primer coat raises the grain.',
      },
      {
        title: 'Two coats of eggshell, brushed and laid off',
        body: 'Two thin coats rather than one heavy one: thin coats cure harder, they do not sag on a raised panel, and the second one gives you an even sheen across doors that were never identical to start with. Rubbed down between coats with the light behind me.',
      },
      {
        title: 'Rehung and adjusted',
        body: 'Doors back on, hinges set so the gaps line up, handles on, the floor cleared. I would rather spend the last hour on the door that sits proud than leave you to notice it.',
      },
      {
        title: 'Living with it',
        body: 'It handles gently for the first fortnight while it hardens off, and after that it washes. I will tell you what to clean it with, and it is not what is under most people\'s sink.',
      },
    ],
  },

  furniture: {
    eyebrow: 'Furniture',
    heading: 'The same on a dresser or a bannister.',
    body: 'Freestanding furniture gets the same treatment, and it is often the better place to start if you are unsure — a dresser or a chest of drawers painted properly will tell you whether you want the whole kitchen doing.',
  },

  colour: {
    eyebrow: 'Colour',
    heading: 'Look at it on the wall, not on a phone.',
    body: 'I will bring colours to look at and I will put them up in the room, on the side of the kitchen where the light is worst, and we will leave them a day. Colour that looks handsome in a shop can go grey in a north-facing room, and no photograph on a screen will tell you that.',
  },

  cost: {
    eyebrow: 'What it costs',
    heading: 'Priced after I have seen it.',
    body: 'It depends on the number of doors, what they are made of and what state they are in, and I am not going to guess at it from here. It is days of work rather than a day, and I will give you a figure in writing once I have stood in the room.',
  },

  projects: {
    eyebrow: 'Kitchens',
    heading: 'Kitchens I have painted.',
  },
} as const;
