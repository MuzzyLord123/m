import { site } from "@/config/site";

/**
 * The privacy policy, as data.
 *
 * WHY IT IS NOT JUST MARKUP ON THE PRIVACY PAGE. It is rendered in two places
 * that must never disagree: the full page at /privacy, and inside the notice
 * that appears on a first visit. A policy that says one thing in the pop-up and
 * another on the page is worse than having only one of them, because whichever
 * a visitor read is the one they will hold the business to. One array, two
 * renderers.
 *
 * EVERY CLAIM HERE IS CHECKED BY A SCRIPT. `npm run audit:privacy` walks the
 * site like a visitor and asserts that nothing leaves the origin, no cookie is
 * set, and nothing is written to storage beyond the two keys named below. If
 * anyone adds analytics, a CDN font or a map that loads on sight, that check
 * fails before this text can quietly become untrue.
 *
 * PLAIN ENGLISH IS THE POINT. This is a decorator's website, not a bank. A
 * policy nobody reads protects nobody, so it is written the way the rest of the
 * site is written and kept as short as the facts allow.
 */
export type PolicySection = {
  heading: string;
  body: string[];
};

/**
 * Update this when the wording changes in a way that affects what is collected,
 * why, or who sees it. It is shown to visitors, so a stale date is its own
 * small dishonesty.
 */
export const POLICY_UPDATED = "August 2026";

export const policySections: PolicySection[] = [
  {
    heading: "What we collect",
    body: [
      /* THIS LIST MUST MATCH src/lib/lead-schema.ts. It used to name five
         fields and finish "That is all we ask for and all we keep" — a closure
         claim, on the one item of a privacy notice anyone can check, while the
         form was collecting six more: the trade picked, the property type, how
         many rooms, how soon, and for a site visit the address, the day and
         whether morning or afternoon. Property type plus extent of work plus
         urgency is a fair picture of someone's house and their finances, and it
         is exactly what a notice exists to declare. If a field is ever added to
         that schema, add it here in the same commit. */
      "If you fill in the quote form we collect your name, phone number, email address, the town the job is in, which trade you picked, what sort of property it is, roughly how many rooms need doing, how soon you want it done, and whatever you write in the message box. If you ask for a site visit we also take the address we are coming to, the day you would like, and whether morning or afternoon suits you. We do not ask for anything else.",
      "We do not run analytics on this site. There is no tracking pixel, no advertising tag, and no cookie set by us.",
      "Two small things are saved in your browser's own storage, and neither is a cookie — they are never sent to us and nobody else can read them. One remembers that you have seen the opening animation, so it does not play again in the same visit. The other remembers that you have closed the privacy notice, so it does not ask you twice. You can clear both by clearing this site's data in your browser.",
    ],
  },
  {
    heading: "What we do with it",
    body: [
      "We use your details to price your job, arrange a visit and carry out the work. Your enquiry is emailed to us and stored in our email account.",
      "We never sell your details, never pass them to anyone for marketing, and never add you to a mailing list. You will not hear from us again after a quote unless you get in touch.",
    ],
  },
  {
    heading: "Who else touches it",
    body: [
      "Emails from this website are delivered by Resend, an email provider, which processes the contents of your enquiry in order to send it. Their privacy notice is at resend.com/legal/privacy-policy.",
      "The live chat is provided by Tawk.to. If you open a chat, your messages and basic connection details are handled by them. It loads only when you choose to open it — the script is not on the page until then.",
      "The map is an embed from Google Maps, and Google may set cookies through it. It is not loaded until you press the button on it, so if you never do, your browser never contacts Google. Nothing plays from YouTube until you press play on a video, and nothing is fetched from YouTube before that either.",
    ],
  },
  {
    heading: "Where it is kept",
    body: [
      "This website is hosted by Vercel, and enquiries reach us by email through Resend. Nothing is stored in a database on this site — there is no account to create and no login.",
      "Vercel, Resend and Tawk.to are all American companies, so sending an enquiry involves your details being transferred to the United States. Those transfers are covered by the standard contractual clauses those companies publish, together with the UK Addendum to them. If you would rather not send anything through the website at all, ring us on the number at the bottom of this page and none of it applies.",
      "Vercel keeps short-lived technical logs of requests to the site, including IP addresses, in order to serve pages and block abuse. We do not read them and cannot search them by person, and nothing you type into a form is written to them.",
    ],
  },
  {
    heading: "Our lawful basis",
    body: [
      "For quote enquiries, the basis is taking steps at your request before entering into a contract. You asked us for a price, so we use your details to give you one.",
      "For records of work we have carried out, the basis is our legal obligation to keep accounting and insurance records, and our legitimate interest in being able to answer questions about a job years later.",
    ],
  },
  {
    heading: "How long we keep it",
    body: [
      "Quote enquiries are kept for two years, so that we can look back at what was agreed if you come back to us. Records relating to work we have carried out are kept for six years, which is what our insurer and HMRC require.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "You can ask us what we hold about you, ask us to correct it, or ask us to delete it. You can also ask for a copy of it in a portable form, or object to us holding it at all. Ring or email and we will do it — there is no form to fill in, and it costs you nothing.",
      "We will answer within one month. If we cannot do what you have asked — because we are required to keep an accounting record, for example — we will tell you why.",
      "If you are not happy with how we have handled your details you can complain to the Information Commissioner's Office at ico.org.uk, or ring them on 0303 123 1113.",
    ],
  },
  {
    heading: "Children",
    body: [
      "This site is aimed at people arranging work on their own property. We do not knowingly collect details from anyone under 16. If you think a child has sent us something, ring us and we will delete it.",
    ],
  },
  {
    heading: "Who to contact",
    body: [
      `${site.legalName} is the data controller for the details you send through this website. Contact ${site.email} or ${site.phone} about anything on this page, including a request to see or delete what we hold.`,
    ],
  },
];

/**
 * The short version, for the notice that appears on a first visit. It is a
 * summary of the sections above, not a separate policy — if these two ever say
 * different things, the sections are what count and this is the bug.
 */
export const policySummary =
  "We set no cookies and run no analytics — nothing you do here is followed. The map, " +
  "the videos and the live chat come from other companies, and none of them load until " +
  "you press them.";
