/**
 * How a job runs — home page §04.
 *
 * The daily-update promise is step 05 and it is kept, because the reviews on the
 * old site mention it repeatedly and unprompted. It is one of the few things on
 * this site that is already proven rather than asserted, so it gets its own step
 * rather than a line in a paragraph.
 */

export type ProcessStep = {
  number: string
  title: string
  body: string
  /** The specification-style note in the margin. Short. */
  note?: string
}

export const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'You ring, or you send the form',
    body: 'Tell me what the job is and roughly when you want it. If I can answer a question on the phone in two minutes I would rather do that than have you fill anything in.',
    note: 'Same day, usually',
  },
  {
    number: '02',
    title: 'I come and look at it',
    body: 'Free, and there is no obligation attached to it. I need to see the surfaces before I can price the work — particularly on spraying, where what needs masking is most of what needs quoting. I will tell you if I think a job is not worth doing, or is somebody else’s trade.',
    note: 'Free, no obligation',
  },
  {
    number: '03',
    title: 'A written quote, itemised',
    body: 'What I am doing, what I am using, how many coats, and how long it will take. If there is something I would do differently from what you have asked for, it is in there with the reason, and you can ignore it.',
    note: 'In writing',
  },
  {
    number: '04',
    title: 'A date I can actually keep',
    body: 'I work on my own and on one job at a time, so I do not book two things into the same week. On outside work the date is a week rather than a day, because the weather decides and pretending otherwise wastes both our time.',
    note: 'One job at a time',
  },
  {
    number: '05',
    title: 'Photographs at the end of every day',
    body: 'You get a message with pictures of what got done, including on the days when the weather stopped me and the answer is "nothing outside today". If you are out at work while I am in the house, that is how you know where the job is up to.',
    note: 'Every day, including the bad ones',
  },
  {
    number: '06',
    title: 'Cleared up as I go, not at the end',
    body: 'Sheets down before anything starts, dust extracted as it is made, and the room put back at the end of each day rather than left as a building site until Friday.',
    note: 'Daily, not weekly',
  },
  {
    number: '07',
    title: 'We walk round it together',
    body: 'In daylight, before I load the van. Anything you are not happy with, I put right then. That is easier for both of us than a phone call a fortnight later.',
    note: 'Before I leave',
  },
]
