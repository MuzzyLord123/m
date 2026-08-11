/**
 * /contact — replaces /contact-us/.
 *
 * Three kinds of enquiry arrive at a contractor of this size and they want
 * different things, so the form asks which one first and changes what it asks
 * for next. A tender enquiry needs a return date and a document; a householder
 * needs to know someone will ring back.
 *
 * The enquiry type is also the single most useful thing to measure. If Sean can
 * see that eleven tender enquiries came in last quarter and two of them were
 * schools, the site has told him something he can act on.
 */

export const contact = {
  meta: {
    title: 'Contact | McDonald Painting Contractors Ltd, Cheshire',
    description:
      'Talk to Sean about a commercial painting contract, a programmed maintenance programme or a tender enquiry. Cheshire base, contracts across the UK.',
  },

  sheet: {
    title: 'Enquiries',
    standfirst:
      'Tell us which kind of enquiry this is and it goes to the right place with the right questions attached. If it is urgent, the phone is faster than any form.',
  },

  types: [
    {
      id: 'tender',
      label: 'Tender or contract',
      blurb:
        'A specification, a framework, a pre-qualification questionnaire or a programmed contract to price.',
      wants: [
        'Return date and format',
        'Documents issued, or where to download them',
        'Whether a site visit is required before pricing',
      ],
      primary: 'capability-statement',
    },
    {
      id: 'commercial',
      label: 'Commercial or industrial job',
      blurb:
        'A building, an estate or a single job — factory, warehouse, office, school, hospital, hotel, shop or restaurant.',
      wants: [
        'What the building is and where',
        'When it can be worked on: occupied hours, term dates, shutdowns, closed periods',
        'Whether there is a specification or you want us to survey and propose',
      ],
      primary: 'capability-statement',
    },
    {
      id: 'domestic',
      label: 'Home',
      blurb: 'A house, inside or out, in Chester, the Wirral, North Wales or around Manchester.',
      wants: ['What needs doing', 'Roughly when you would like it done'],
      primary: 'phone',
    },
  ],

  direct: {
    title: 'Direct',
    note: 'Sean answers this number. If it goes to voicemail he is up a ladder; leave a message and he will ring back.',
  },

  registered: {
    title: 'Registered details',
    note: 'For your supplier records and for the pre-qualification questionnaire.',
  },
} as const;
