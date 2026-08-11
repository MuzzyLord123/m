/**
 * /workshops — the Saturday one-to-one, in the customer's own home.
 * Pricing lives in content/pricing.ts and is only printed once confirmed.
 */

export const workshops = {
  meta: {
    title: 'Saturday decorating lessons, one to one, in your own home | Neil Brookfield',
    description:
      'A Saturday session in your own house, one to one: preparation, hanging wallpaper, painting furniture, and what to buy. Taught by a Chester decorator trading since 1990.',
  },

  eyebrow: 'Saturday sessions',
  heading: 'I will come and show you how to do it yourself.',
  lede: 'Some people do not want a decorator. They want to do their own house, they are perfectly capable of it, and nobody has ever stood next to them and shown them how. That is what this is: a Saturday, one to one, in your own house, on your own walls.',

  who: {
    eyebrow: 'Who it is for',
    heading: 'People who can do it, and have not been shown.',
    paragraphs: [
      'Someone who has just bought a house and is looking at four rooms of woodchip. Someone who has painted a bedroom before and could not work out why the finish came out patchy. Someone who has bought a chest of drawers to do up and does not want to ruin it.',
      'It is not a class and there is nobody else there. We work on your rooms, with your paint, in the order you would actually do it.',
    ],
  },

  covers: {
    eyebrow: 'What we cover',
    heading: 'Whatever you have got.',
    intro: 'Pick what is useful to you. Most people want the first two.',
    items: [
      {
        title: 'Preparation',
        body: 'Filling, caulking, sanding, and what "ready to paint" actually looks and feels like under your hand. Where to stop, which is the bit nobody tells you.',
      },
      {
        title: 'Hanging wallpaper',
        body: 'Setting out where the first drop goes and why, sizing the wall, pasting, matching a pattern, and how to get round a light switch and an internal corner without it showing.',
      },
      {
        title: 'Preparing and painting furniture',
        body: 'Getting a piece prepared so paint stays on it, and brushing a finish that does not show every stroke. We can do this on the piece you were nervous about.',
      },
      {
        title: 'Colour and what to buy',
        body: 'Which paint for which job, what the finishes actually mean, which brushes are worth the money and which are not, and how to look at a colour in your own light before you commit to eight litres of it.',
      },
    ],
  },

  practical: {
    eyebrow: 'Practical',
    points: [
      'Saturdays, at your house, one to one.',
      'You provide the room and the materials. I will tell you what to get beforehand so nothing is wasted.',
      'Bring the job you have been putting off. It is more use than a demonstration.',
    ],
  },

  price: {
    eyebrow: 'What it costs',
    heading: 'Priced plainly.',
  },

  enquiry: {
    eyebrow: 'Book a Saturday',
    heading: 'Which Saturday suits you?',
    body: 'Tell me roughly what you want to get out of it and which Saturday you had in mind, and I will come back to you.',
  },
} as const;
