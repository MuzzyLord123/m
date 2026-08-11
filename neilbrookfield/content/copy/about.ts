/**
 * /about — Neil's story at full length, in his words.
 *
 * Everything here traces back to something established: eight years of hotel
 * work on luxury bedrooms, going out on his own in 1990, the Chester interior
 * designer who drilled preparation into him, and a small team taught the same
 * way. No qualifications, insurance or memberships are claimed, because none
 * are known. See content/needed.ts#credentials.
 */

export const about = {
  meta: {
    title: 'About Neil Brookfield — decorator in Chester since 1990',
    description:
      'Eight years on hotel bedrooms, then out on my own in 1990. An interior designer in Chester taught me that preparation decides how a job looks years later. Still the way I work.',
  },

  eyebrow: 'About',
  heading: 'Eight years of hotel bedrooms, then out on my own.',

  lede: "People ask how long I've been doing this. I started on my own account in 1990, and I had eight years behind me before that, so you can do the arithmetic. What matters more is what those eight years were: hotel work, on luxury bedrooms, where the rooms are inspected and a bad line shows from the doorway.",

  sections: [
    {
      heading: 'What I was taught',
      paragraphs: [
        'An interior designer here in Chester taught me the thing I have built everything else on: the paint is the easy part. Anybody can put paint on a wall. What decides whether a job still looks right in five years is what you did in the three days before the first coat went on.',
        'So I fill and I sand and I sand again, and I wash things people assume do not need washing. On a kitchen that means the doors come off, the hinges get labelled, and every surface is degreased before it is flatted, because grease is invisible until it is under a topcoat and lifting. On a staircase it means stripping back to something sound rather than painting over a shine and hoping.',
        'It is not a sales pitch. It is just the only order that works.',
      ],
    },
    {
      heading: 'How I work in your house',
      paragraphs: [
        'I have a small team, and they were taught the same way I was. The other thing I taught them is how to behave in somebody\'s house — you knock, you cover the floor before you carry anything in, you keep the noise sensible, and you leave the place tidier at five than it was at eight.',
        'You will get me on the phone, and it will be me who comes and looks at the job. I would far rather stand in the room than quote off a description, because rooms tell you things: how the light falls on a wall, whether the last person cut in or masked, what is going on under the sill.',
      ],
    },
    {
      heading: 'Kitchens',
      paragraphs: [
        'Hand-painting kitchens and furniture is what I am asked for most now, and it is the work I would choose if I could choose. A sprayed door comes back to you flat and even and slightly anonymous. A brushed door has a surface to it. In a room with a stone floor and a window on one side, that difference is the whole point.',
        'It is also work that punishes shortcuts, which suits me. There is no fast version of it that survives a family cooking in the room for a decade.',
      ],
    },
    {
      heading: 'Saturdays',
      paragraphs: [
        'I also spend some Saturdays sat with somebody in their own house teaching them to do it themselves — how to prepare, how to hang paper, how to get a piece of furniture painted so it does not look painted. Nobody is born knowing it and it is not difficult once you have watched it done once.',
      ],
    },
    {
      heading: 'Otherwise',
      paragraphs: [
        'Out of hours I am usually on a real-ale trail somewhere, or with my granddaughter.',
      ],
    },
  ],

  closing: {
    heading: 'If you are weighing people up',
    body: 'Ask whoever you are speaking to what they will do before they open a tin. If the answer is short, keep ringing round.',
  },
} as const;
