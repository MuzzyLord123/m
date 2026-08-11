/**
 * /contact — enquiry form, phone, area.
 * No opening hours and no email are published: neither is known.
 * See content/needed.ts#hours and #email.
 */

export const contact = {
  meta: {
    title: 'Arrange a visit — Neil Brookfield, decorator, Chester',
    description:
      'Ring me or send a few details about the job and I will come and look at it. Decorator in Chester, working across Cheshire. Trading since 1990.',
  },

  eyebrow: 'Arrange a visit',
  heading: 'Ring me, or tell me about the job.',
  lede: 'I would rather come and stand in the room than price a job off a description, and it costs you nothing to have me look at it. If you are ringing round several people, ask us all the same question: what will you do before you open a tin?',

  phoneNote: 'If I do not pick up I am up a ladder. Leave a message and I will ring back.',

  areaNote: 'Chester and across Cheshire.',

  photosNote:
    'Photographs help more than you would think — a picture of a window sill or the corner of a kitchen door tells me most of what I need before I arrive.',

  form: {
    eyebrow: 'Enquiry',
    heading: 'A few details.',
  },

  success: {
    heading: 'Got it, thank you.',
    body: 'I will ring you back. If it is urgent, or you would rather just talk it through, the number is below.',
  },
} as const;
