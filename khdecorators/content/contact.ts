/**
 * /contact — and the quote form used on both the home page and this page.
 *
 * There is no embedded Google Form anywhere on this site. The old one was the only
 * way to contact him, and on paid traffic that is expensive: it loads after
 * everything else, it looks like a Google product rather than like his business,
 * and on a phone it fights the viewport. This form is native HTML, it posts to a
 * route handler in this app, and it works with JavaScript switched off.
 */

export const contact = {
  h1: 'Get in touch',
  title: 'Contact — painter & decorator in {town} | KH Painting and Decorating',
  description:
    'Ring Kenny on 07538 869832 or send a few lines about the job. Painting, decorating and spray finishing in {town} and across the north west.',

  lede: 'Phone is quickest, and I would rather have a two-minute conversation than read a long form. If I am up a ladder or spraying I will not hear it — leave a message and I will ring back the same day.',

  /** Kept short deliberately. Every extra field costs enquiries. */
  form: {
    heading: 'Tell me about the job',
    standfirst:
      'Four fields, and only two of them are required. I read these myself and I answer them myself.',
    fields: {
      name: { label: 'Your name', required: true },
      contact: {
        label: 'Phone or email',
        required: true,
        hint: 'Whichever you would rather I used.',
      },
      place: {
        label: 'Town or postcode',
        required: false,
        hint: 'So I know whether I can get to you.',
      },
      job: {
        label: 'What needs doing',
        required: false,
        hint: 'A couple of lines is plenty. "Garage door sprayed" tells me most of what I need.',
      },
    },
    submit: 'Send it to Kenny',
    /** Shown inline on success. No redirect if JavaScript is on. */
    success: {
      heading: 'That’s come through.',
      body: 'I have got it and I will come back to you, usually the same day. If it is urgent, ring me on {phone} rather than waiting.',
    },
    error: {
      heading: 'That didn’t send.',
      body: 'Something went wrong at my end rather than yours. Ring me on {phone} or email {email} and I will pick it up straight away.',
    },
    /** Honest note under the button. No marketing consent theatre. */
    privacy:
      'It comes to me as an email and nowhere else. I do not have a mailing list to add you to.',
  },

  /** The direct routes, in the order they are actually useful. */
  methods: [
    {
      label: 'Phone',
      note: 'Best. If I miss it, leave a message and I will ring back.',
    },
    {
      label: 'Email',
      note: 'Fine for anything that needs photographs attaching.',
    },
    {
      label: 'Hours',
      note: '{{HOURS}}',
    },
  ],
}
