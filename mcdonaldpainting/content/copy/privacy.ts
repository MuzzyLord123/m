/**
 * /privacy — the privacy notice.
 *
 * Written to be read, not to be survived. Most contractor privacy pages are a
 * generator's output with the company name dropped in, which is worthless to a
 * procurement team and a liability if it describes processing the business does
 * not do.
 *
 * This one describes what this site actually does and nothing else: an enquiry
 * form that posts to one place, a capability statement that captures a work
 * email, and analytics that do not load until somebody says yes. Every claim in
 * it is checkable against the code.
 *
 * Where a fact belongs to the company rather than to the site — the address for
 * a data request, whether the ICO registration is current, how long Sean keeps
 * enquiries — it is a marked question rather than a plausible sentence. A
 * privacy notice that states a retention period nobody has agreed to is worse
 * than one that admits the gap.
 */

export const privacy = {
  meta: {
    title: 'Privacy and cookies | McDonald Painting Contractors Ltd',
    description:
      'What this website collects, where it goes, how long it is kept, and how to ask for it. Analytics do not load until you allow them.',
  },

  sheet: {
    title: 'Privacy and cookies',
    standfirst:
      'This site collects two things: what you type into the enquiry form, and — only if you allow it — a count of which pages get read. There is no advertising, no tracking across other sites, no profiling, and nothing is sold or shared. What follows is the detail, in the order you would want it.',
  },

  updated: 'August 2026',

  sections: [
    {
      number: '01',
      title: 'Who is responsible',
      body: [
        'McDonald Painting Contractors Ltd, registered in England and Wales, company number 10402793, is the data controller for this website. That means we decide what is collected and why, and we are the ones to ask about it.',
      ],
      confirm: 'privacy-contact',
      confirmNote:
        'The address a data request should be sent to, and whether the company is registered with the Information Commissioner (most businesses that hold customer records are required to be, and it costs about £40 a year).',
    },
    {
      number: '02',
      title: 'The enquiry form',
      body: [
        'If you send an enquiry, we receive what you typed: your name, your organisation or town, your email address, your telephone number, the building and what needs doing. We also record which of the three enquiry types you picked, because the answer changes who deals with it.',
        'It is used to reply to you and to price the work. It is not added to a mailing list, because there is no mailing list.',
        'Technically: the form posts to this site’s own server, which forwards it to one address the company controls. It does not go through a third-party form service, so there is no other company holding a copy of it.',
      ],
      confirm: 'privacy-retention',
      confirmNote:
        'How long enquiries are kept. A sensible answer is "quotes and their correspondence for six years, because that is the contract limitation period; everything else for twelve months" — but it needs to be Sean’s answer, not ours.',
    },
    {
      number: '03',
      title: 'The capability statement',
      body: [
        'Downloading the capability statement asks for a work email address. That is deliberate: it is how a contractor knows a real buyer looked, and it is what allows Sean to follow it up.',
        'It is treated exactly like an enquiry. It is not used for anything else, and asking us to delete it is a one-line email.',
      ],
    },
    {
      number: '04',
      title: 'Analytics',
      body: [
        'If — and only if — you allow it, this site uses Google Analytics to count visits and see which pages are read. It tells us that eleven people looked at the programmed maintenance page last month; it does not tell us who they were.',
        'Nothing analytics-related loads before you choose. Decline and no Google script is requested by this page at all, which is not how most sites that show you a cookie banner behave.',
        'Google acts as our processor for this, and the data may be processed outside the UK under the transfer arrangements Google publishes. If that matters to your organisation, decline analytics — the site works identically either way.',
      ],
    },
    {
      number: '05',
      title: 'What is stored on your device',
      body: [
        'The table below is the whole list. It is generated from the same file the consent notice reads, so this page cannot describe something the site does not do.',
      ],
    },
    {
      number: '06',
      title: 'Your rights',
      body: [
        'You can ask what we hold about you, ask for it to be corrected, ask for it to be deleted, and object to us holding it. There is no charge and we have a month to answer.',
        'The lawful basis for replying to an enquiry is legitimate interests — you asked us to get in touch, so we do. The basis for analytics is your consent, which you can withdraw at any time using the Cookies link in the footer.',
        'If you think we have got it wrong, you can complain to the Information Commissioner’s Office at ico.org.uk, or by telephone on 0303 123 1113. We would rather you told us first, but it is your right either way.',
      ],
    },
    {
      number: '07',
      title: 'Photographs',
      body: [
        'Photographs of completed work are published with the client’s permission. Where a client or a third party supplied an image, they are credited under it. If a photograph of your building is on this site and you would rather it were not, tell us and it comes down.',
      ],
    },
    {
      number: '08',
      title: 'Changes',
      body: [
        'If this notice changes in a way that affects what is collected, the consent notice asks again rather than stretching an old answer to cover something new.',
      ],
    },
  ],

  storage: {
    title: 'What is stored on your device',
    note: 'Two entries, and one of them only exists if you allow analytics.',
  },
} as const;
