import { contact } from '@content/copy/contact';

/**
 * Where an enquiry goes.
 *
 * There is no paid form service and no database. An enquiry is POSTed as JSON
 * to whatever URL is in ENQUIRY_WEBHOOK_URL — a free Zapier or Make hook, a
 * Google Apps Script, or an email relay — and if that is not set it is written
 * to the server log so nothing is silently lost while it is being decided.
 *
 * The phone number is the primary route in and always will be. This is the
 * route for the enquiries that arrive at eleven at night with a specification
 * attached.
 */

export const ENQUIRY_TYPES = contact.types.map((t) => t.id);
export type EnquiryType = (typeof contact.types)[number]['id'];

export type Enquiry = {
  type: EnquiryType;
  name: string;
  organisation: string;
  email: string;
  telephone: string;
  building: string;
  message: string;
  /** Set when the enquiry came from the capability statement request. */
  wantsCapabilityStatement: boolean;
  receivedAt: string;
};

export async function deliverEnquiry(enquiry: Enquiry): Promise<void> {
  const webhook = process.env.ENQUIRY_WEBHOOK_URL;

  if (!webhook) {
    // Deliberately loud, and deliberately not an error: the visitor's enquiry
    // succeeded, the delivery route is what is missing.
    console.warn(
      '[enquiry] ENQUIRY_WEBHOOK_URL is not set — enquiry logged only:',
      JSON.stringify(enquiry),
    );
    return;
  }

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(enquiry),
  });

  if (!res.ok) {
    throw new Error(`enquiry webhook returned ${res.status}`);
  }
}

/**
 * Form state.
 *
 * This lives here rather than in lib/actions.ts because a file marked
 * `'use server'` may only export async functions — exporting a plain object
 * from one throws at request time, and the production build does not catch it.
 */
export type EnquiryState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Partial<Record<'name' | 'email' | 'telephone' | 'message', string>>;
  /** Echoed back so a failed submission does not empty the form. */
  values?: Record<string, string>;
  /** Set when the request was for the capability statement, so the client can
   *  start the download and fire the analytics event. */
  download?: string;
};

export const initialEnquiryState: EnquiryState = { status: 'idle' };
