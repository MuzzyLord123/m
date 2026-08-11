/**
 * Where the enquiry form goes.
 *
 * A contact form that delivers nowhere is worse than no form: the customer
 * believes they have been in touch and then never hears anything. So the form
 * does not render until this is true, and /contact shows the phone number and
 * the email address instead.
 *
 * To turn it on: wire the handler in src/app/contact/actions.ts to whatever
 * actually delivers (an SMTP relay, a form service, a mailbox API), send one
 * test enquiry, confirm it arrived, then flip this.
 */
export const DELIVERY_CONFIGURED = false;
